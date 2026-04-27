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
    .select("email, status")
    .eq("order_nsu", order_nsu)
    .single()

  if (pedidoError || !pedido) {
    console.error("Pedido não encontrado para order_nsu:", order_nsu, pedidoError)
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 400 })
  }

  // Idempotência: se já processado, retornar 200 sem fazer nada
  if (pedido.status === "pago") {
    return NextResponse.json({ received: true, already_processed: true })
  }

  // 2.5 Resolver email real do cliente
  //     Quando o checkout é criado via cold traffic (DiagnosticoPro), o email
  //     salvo é o placeholder. O email real é coletado pela InfinitePay durante
  //     o checkout e vem no payload do webhook.
  let email = pedido.email

  if (email === PLACEHOLDER_EMAIL) {
    // Cold traffic: o email real será coletado na página /acesso após o redirect.
    // Aqui só atualizamos o status para "pago" e saímos.
    await supabase
      .from("pedidos")
      .update({ status: "pago", transaction_nsu })
      .eq("order_nsu", order_nsu)

    console.log(`✓ Pedido ${order_nsu} marcado como pago (email será coletado na página /acesso)`)
    return NextResponse.json({ received: true, awaiting_email: true })
  }

  // 3. Atualizar status do pedido (e email se era placeholder)
  await supabase
    .from("pedidos")
    .update({ status: "pago", transaction_nsu, email })
    .eq("order_nsu", order_nsu)

  // 3. Verificar idempotência (Evitar processar a mesma transação duas vezes)
  const { data: existingOrder } = await supabase
    .from("pedidos")
    .select("status")
    .eq("transaction_nsu", transaction_nsu)
    .single()

  if (existingOrder?.status === "pago") {
    console.log(`[webhook] Transação ${transaction_nsu} já processada. Ignorando.`)
    return NextResponse.json({ success: true, message: "Já processado" })
  }

  // 4. Criar usuário no Supabase Auth
  //    email_confirm: true → email já confirmado, não precisa verificar
  let userId = null
  let generatedPassword = Math.random().toString(36).slice(-8) + "Cz!"

  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: generatedPassword,
    email_confirm: true,
  })

  if (!createError && userData?.user?.id) {
    userId = userData.user.id
  } else if (createError) {
    // Usuário já existe (status 422 ou mensagem "already registered")
    const jaExiste =
      createError.status === 422 ||
      createError.message?.toLowerCase().includes("already") ||
      createError.message?.toLowerCase().includes("registered")

    if (!jaExiste) {
      console.error("Erro inesperado ao criar usuário:", createError)
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }

    console.log(`Usuário ${email} já existe, prosseguindo...`)
    // userId virá do generateLink logo abaixo
  }

  // Buscar o userId se falhou tudo
  if (!userId) {
    const { data: profileObj } = await supabase.from("profiles").select("id").eq("email", email).single()
    if (profileObj) userId = profileObj.id
  }

  // 5. ENVIAR VIA RESEND DE BOAS VINDAS (Sem link mágico)
  const envioResend = await enviarEmailBoasVindas(email, generatedPassword || undefined)
  
  if (envioResend.error) {
    console.error("Erro no Resend ao disparar webhook:", envioResend.error)
    // Opcional: Ainda retornar 200 pro InfinitePay, pois o pedido em si foi processado e salvo,
    // mas logamos o erro do resend pesadamente.
  }

  // 6. Ativar plano no perfil
  //    O trigger on_auth_user_created já criou o perfil ao criar o usuário.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      plano_ativo: true,
      pagamento_id: transaction_nsu,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (profileError) {
    // Trigger ainda não rodou (edge case) — criar perfil manualmente
    console.warn("Perfil não encontrado, criando manualmente:", profileError)
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

  console.log(`✓ Acesso criado para ${email} | order_nsu: ${order_nsu}`)

  // 7. Retornar 200 rapidamente para o InfinitePay não reenviar
  return NextResponse.json({ received: true, processed: true })
}
