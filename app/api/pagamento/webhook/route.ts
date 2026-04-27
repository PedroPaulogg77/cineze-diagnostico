import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase"
import { enviarEmailBoasVindas } from "@/lib/email"

// ─── Tipos do payload InfinitePay ─────────────────────────────────────────────
//
// Body recebido no webhook após pagamento confirmado.
// O payload pode conter dados do cliente em diferentes formatos dependendo
// de como o checkout foi criado.

interface InfinitePayWebhookBody {
  invoice_slug?: string
  amount?: number
  paid_amount?: number
  capture_method?: string
  transaction_nsu?: string
  order_nsu?: string
  receipt_url?: string
  // Dados do cliente — InfinitePay pode enviar em diferentes formatos
  customer?: {
    name?: string
    email?: string
    phone_number?: string
  }
  email?: string
  metadata?: {
    email?: string
    [key: string]: unknown
  }
  [key: string]: unknown // Captura campos extras não mapeados
}

// Email placeholder usado pelo create-checkout quando o cliente ainda não informou email
const PLACEHOLDER_EMAIL = "aguardando_checkout@cineze.com.br"

interface InfinitePayPaymentCheckResponse {
  paid?: boolean
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: InfinitePayWebhookBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  // Log completo do payload para depuração
  console.log("[Webhook InfinitePay] Payload recebido:", JSON.stringify(body, null, 2))

  const { order_nsu, transaction_nsu, invoice_slug } = body

  if (!order_nsu || !transaction_nsu || !invoice_slug) {
    console.warn("Webhook InfinitePay: campos obrigatórios ausentes", body)
    return NextResponse.json({ error: "Payload incompleto" }, { status: 400 })
  }

  const handle = process.env.INFINITEPAY_HANDLE
  if (!handle) {
    console.error("INFINITEPAY_HANDLE não configurado")
    return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 })
  }

  // 1. Verificar autenticidade do pagamento com a InfinitePay
  //
  //    POST https://api.infinitepay.io/invoices/public/checkout/payment_check
  //    Se { paid: true } → pagamento real → processar
  //    Se { paid: false } → ignorar (InfinitePay pode reenviar depois)
  //
  let pagamentoValido = false

  try {
    const checkResponse = await fetch(
      "https://api.infinitepay.io/invoices/public/checkout/payment_check",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          order_nsu,
          transaction_nsu,
          slug: invoice_slug,
        }),
      }
    )

    if (!checkResponse.ok) {
      console.error("payment_check falhou:", checkResponse.status)
      return NextResponse.json({ error: "Verificação de pagamento falhou" }, { status: 400 })
    }

    const checkData: InfinitePayPaymentCheckResponse = await checkResponse.json()
    pagamentoValido = checkData.paid === true
  } catch (err) {
    console.error("Erro ao verificar pagamento:", err)
    return NextResponse.json({ error: "Erro na verificação" }, { status: 400 })
  }

  if (!pagamentoValido) {
    // Retorna 400 → InfinitePay vai retentar o webhook mais tarde
    return NextResponse.json({ paid: false }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()

  // 2. Buscar email pelo order_nsu
  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .select("email, status, order_nsu")
    .eq("order_nsu", order_nsu)
    .maybeSingle()

  if (pedidoError || !pedido) {
    console.error(`[webhook] Pedido ${order_nsu} não encontrado no banco.`)
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
  }

  let email = pedido.email
  
  // 2. Verificar se já foi processado (Idempotência)
  const { data: existingPaid } = await supabase
    .from("pedidos")
    .select("status")
    .eq("transaction_nsu", transaction_nsu)
    .eq("status", "pago")
    .maybeSingle()

  if (existingPaid) {
    console.log(`[webhook] Transação ${transaction_nsu} já processada.`)
    return NextResponse.json({ success: true, message: "Já processado" })
  }

  // 3. Se for placeholder, apenas marca como pago
  if (email === PLACEHOLDER_EMAIL) {
    const { error: updErr } = await supabase
      .from("pedidos")
      .update({ status: "pago", transaction_nsu })
      .eq("order_nsu", order_nsu)

    if (updErr) {
      console.error("[webhook] Erro ao atualizar placeholder:", updErr)
      return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 })
    }

    console.log(`✓ Pedido ${order_nsu} marcado como pago (Aguardando email em /acesso)`)
    return NextResponse.json({ received: true, awaiting_email: true })
  }

  // 4. Se tiver email real, processa tudo
  console.log(`[webhook] Processando pagamento com email real: ${email}`)
  const { error: updErr } = await supabase
    .from("pedidos")
    .update({ status: "pago", transaction_nsu, email })
    .eq("order_nsu", order_nsu)

  if (updErr) {
    console.error("[webhook] Erro ao atualizar pedido real:", updErr)
    return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 })
  }

  // 4. Criar usuário no Supabase Auth
  let userId: string | null = null
  const generatedPassword = Math.random().toString(36).slice(-8) + "Cz!"

  console.log(`[webhook] Criando/Buscando usuário para: ${email}`)
  const { data: authData, error: createError } = await supabase.auth.admin.createUser({
    email: email,
    password: generatedPassword,
    email_confirm: true,
  })

  if (authData?.user) {
    userId = authData.user.id
  } else if (createError) {
    const jaExiste = createError.status === 422 || createError.message?.toLowerCase().includes("already") || createError.message?.toLowerCase().includes("registered")
    if (!jaExiste) {
      console.error("[webhook] Erro ao criar usuário:", createError)
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    const existingUser = !listError ? users.find(u => u.email?.toLowerCase() === email.toLowerCase()) : null
    if (existingUser) userId = existingUser.id
  }

  if (!userId) {
    console.error("[webhook] Não foi possível identificar o userId para:", email)
    return NextResponse.json({ error: "Erro ao identificar usuário" }, { status: 500 })
  }

  // 5. ENVIAR VIA RESEND
  console.log(`[webhook] Enviando boas-vindas via Resend para: ${email}`)
  const envioResend = await enviarEmailBoasVindas(email, generatedPassword)
  if (envioResend.error) {
    console.error("[webhook] Erro Resend:", envioResend.error)
  }

  // 6. Ativar plano no perfil
  console.log(`[webhook] Ativando plano para userId: ${userId}`)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      plano_ativo: true,
      pagamento_id: transaction_nsu,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (profileError) {
    console.warn("[webhook] Perfil não encontrado, criando manualmente...")
    await supabase.from("profiles").upsert(
      {
        id: userId,
        nome_responsavel: "",
        nome_negocio: "",
        plano_ativo: true,
        pagamento_id: transaction_nsu,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
  }

  console.log(`✓ [webhook] Finalizado com sucesso para: ${email}`)
  return NextResponse.json({ success: true })
}
