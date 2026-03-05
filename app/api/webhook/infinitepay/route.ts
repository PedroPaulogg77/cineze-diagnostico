import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase-server"

interface InfinitePayWebhookBody {
  invoice_slug?: string
  amount?: number
  paid_amount?: number
  capture_method?: string
  transaction_nsu?: string
  order_nsu?: string
  receipt_url?: string
}

interface InfinitePayPaymentCheckResponse {
  paid?: boolean
}

export async function POST(request: NextRequest) {
  let body: InfinitePayWebhookBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

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

  // 1. Verificar autenticidade do pagamento
  let pagamentoValido = false
  try {
    const checkResponse = await fetch(
      "https://api.infinitepay.io/invoices/public/checkout/payment_check",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, order_nsu, transaction_nsu, slug: invoice_slug }),
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
    return NextResponse.json({ paid: false }, { status: 400 })
  }

  const supabase = createAdminSupabaseClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

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

  // Idempotência: se já processado, retornar 200
  if (pedido.status === "pago") {
    return NextResponse.json({ received: true, already_processed: true })
  }

  const { email } = pedido

  // 3. Atualizar status do pedido
  await supabase
    .from("pedidos")
    .update({ status: "pago", transaction_nsu })
    .eq("order_nsu", order_nsu)

  // 4. Convidar usuário — cria conta e envia email de acesso via SMTP configurado
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo: `${appUrl}/auth/callback?next=/dashboard/raio-x`,
    }
  )

  if (inviteError) {
    console.error("Erro ao convidar usuário:", inviteError)
    return NextResponse.json({ error: "Erro ao criar acesso" }, { status: 500 })
  }

  const userId = inviteData?.user?.id

  if (!userId) {
    console.error("inviteUserByEmail não retornou userId para:", email)
    return NextResponse.json({ error: "Erro ao obter ID do usuário" }, { status: 500 })
  }

  // 5. Ativar plano no perfil (upsert garante que funciona mesmo sem row prévia)
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        nome_responsavel: "",
        plano_ativo: true,
        pagamento_id: transaction_nsu,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

  if (profileError) {
    console.error("Erro ao ativar plano no perfil:", profileError)
  }

  console.log(`✓ Convite enviado para ${email} | order_nsu: ${order_nsu}`)

  return NextResponse.json({ received: true, processed: true })
}
