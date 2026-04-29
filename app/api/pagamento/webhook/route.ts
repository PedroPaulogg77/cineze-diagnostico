import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase"
import { enviarEmailBoasVindas } from "@/lib/email"
import crypto from "crypto"

// ─── Tipos do payload InfinitePay ─────────────────────────────────────────────
//
// Body recebido no webhook após pagamento confirmado.
// O payload pode conter dados do cliente em diferentes formatos dependendo
// de como o checkout foi criado.

async function enviarCAPI(eventName: string, value: number, emailStr: string, ip: string, userAgent: string) {
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  
  if (!PIXEL_ID || !ACCESS_TOKEN) return;

  let hashedEmail = "";
  if (emailStr && !emailStr.includes("aguardando_checkout")) {
    hashedEmail = crypto.createHash("sha256").update(emailStr.toLowerCase().trim()).digest("hex");
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_source_url: (process.env.NEXT_PUBLIC_APP_URL || "https://diagnostico.cineze.com.br") + "/acesso",
        user_data: {
          client_ip_address: ip,
          client_user_agent: userAgent,
          ...(hashedEmail ? { em: [hashedEmail] } : {})
        },
        custom_data: {
          value: value,
          currency: "BRL",
          content_name: "Diagnóstico Cineze IA",
          content_category: "Consultoria",
          num_items: 1
        }
      }
    ]
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log(`[CAPI] Evento ${eventName} enviado:`, data);
  } catch (err) {
    console.error(`[CAPI] Erro ao enviar evento ${eventName}:`, err);
  }
}

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

  // 2. Buscar o pedido no banco — ele pode não existir se foi cold traffic direto
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("email, status, order_nsu")
    .eq("order_nsu", order_nsu)
    .maybeSingle()

  // 2a. Verificar idempotência: se já está pago, retornar imediatamente
  if (pedido?.status === "pago") {
    console.log(`[webhook] Pedido ${order_nsu} já estava pago.`)
    return NextResponse.json({ success: true, message: "Já processado" })
  }

  // Extrair email do cliente do payload do webhook (InfinitePay envia em vários campos)
  const emailFromPayload = (
    body.customer?.email ||
    body.email ||
    body.metadata?.email ||
    ""
  ).toString().toLowerCase().trim()

  const email = emailFromPayload || pedido?.email || PLACEHOLDER_EMAIL

  // 2b. Se pedido não existe, criar agora (cold traffic sem checkout prévio)
  if (!pedido) {
    console.log(`[webhook] Pedido ${order_nsu} não existe — criando agora.`)
    const { error: insertErr } = await supabase
      .from("pedidos")
      .insert({
        order_nsu,
        transaction_nsu,
        email,
        status: "pago",
      })

    if (insertErr) {
      console.error("[webhook] Erro ao inserir pedido:", insertErr)
      return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 })
    }
  } else {
    // 2c. Pedido existe mas não está pago — atualizar
    const { error: updErr } = await supabase
      .from("pedidos")
      .update({ status: "pago", transaction_nsu, email })
      .eq("order_nsu", order_nsu)

    if (updErr) {
      console.error("[webhook] Erro ao atualizar pedido:", updErr)
      return NextResponse.json({ error: "Erro ao atualizar pedido" }, { status: 500 })
    }
  }

  // Enviar evento de Compra (Purchase) via API de Conversões da Meta
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1"
  const clientUa = request.headers.get("user-agent") || ""
  await enviarCAPI("Purchase", 67.00, email, clientIp, clientUa)

  // 3. Se for placeholder (sem email real), apenas liberamos a página /acesso
  if (email === PLACEHOLDER_EMAIL) {
    console.log(`✓ Pedido ${order_nsu} marcado como pago (Aguardando email em /acesso)`)
    return NextResponse.json({ received: true, awaiting_email: true })
  }

  // 4. Email real: criar conta e ativar plano
  console.log(`[webhook] Processando conta para email real: ${email}`)

  // 5. Criar usuário no Supabase Auth
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
