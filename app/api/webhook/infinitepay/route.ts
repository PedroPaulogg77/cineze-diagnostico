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

function buildEmailHtml(magicLink: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seu acesso ao Diagnóstico Cineze</title>
</head>
<body style="margin:0;padding:0;background-color:#060E1C;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#060E1C;padding:48px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:#0A1628;border-radius:20px;border:1px solid rgba(6,183,216,0.18);overflow:hidden;">
        <tr><td style="height:3px;background:linear-gradient(90deg,#06B7D8,#0EA5E9,#06B7D8);"></td></tr>
        <tr><td align="center" style="padding:40px 40px 36px;">
          <img src="https://cineze.com.br/assets/logo-cineze-CKvDmt6k.png" alt="Cineze" width="140" style="display:block;height:auto;" />
        </td></tr>
        <tr><td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,rgba(6,183,216,0.25),transparent);"></div></td></tr>
        <tr><td align="center" style="padding:40px 40px 16px;">
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;line-height:1.4;">Seu acesso está pronto</h1>
        </td></tr>
        <tr><td align="center" style="padding:0 40px 36px;">
          <p style="margin:0;font-size:15px;color:#8B9DB5;line-height:1.75;text-align:center;">
            Seu pagamento foi confirmado. Clique no botão abaixo para acessar a plataforma e receber seu diagnóstico empresarial personalizado com inteligência artificial.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 40px 40px;">
          <a href="${magicLink}" style="display:inline-block;background:linear-gradient(135deg,#06B7D8,#0EA5E9);color:#060E1C;font-size:14px;font-weight:800;text-decoration:none;padding:16px 52px;border-radius:50px;letter-spacing:0.5px;box-shadow:0 0 32px rgba(6,183,216,0.3);">
            ACESSAR MEU DIAGNÓSTICO
          </a>
        </td></tr>
        <tr><td style="padding:0 40px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(6,183,216,0.05);border:1px solid rgba(6,183,216,0.12);border-radius:12px;">
            <tr><td style="padding:22px 24px;">
              <p style="margin:0 0 14px 0;font-size:11px;font-weight:700;color:#06B7D8;letter-spacing:1px;text-transform:uppercase;">O que você vai receber</p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="padding:5px 0;font-size:13px;color:#8B9DB5;"><span style="color:#06B7D8;margin-right:10px;">—</span>Raio-X completo do seu negócio</td></tr>
                <tr><td style="padding:5px 0;font-size:13px;color:#8B9DB5;"><span style="color:#06B7D8;margin-right:10px;">—</span>Análise de maturidade digital</td></tr>
                <tr><td style="padding:5px 0;font-size:13px;color:#8B9DB5;"><span style="color:#06B7D8;margin-right:10px;">—</span>Posicionamento de mercado</td></tr>
                <tr><td style="padding:5px 0;font-size:13px;color:#8B9DB5;"><span style="color:#06B7D8;margin-right:10px;">—</span>Plano de ação personalizado</td></tr>
                <tr><td style="padding:5px 0;font-size:13px;color:#8B9DB5;"><span style="color:#06B7D8;margin-right:10px;">—</span>Objetivos SMART e métricas</td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:0 40px 28px;">
          <p style="margin:0;font-size:12px;color:#374151;line-height:1.6;text-align:center;">
            Se o botão não funcionar, copie e cole o link abaixo:<br/>
            <a href="${magicLink}" style="color:#06B7D8;text-decoration:none;word-break:break-all;font-size:11px;">${magicLink}</a>
          </p>
        </td></tr>
        <tr><td style="padding:0 40px;"><div style="height:1px;background:rgba(255,255,255,0.05);"></div></td></tr>
        <tr><td align="center" style="padding:24px 40px 32px;">
          <p style="margin:0 0 8px 0;font-size:12px;color:#374151;line-height:1.6;">
            Este link expira em <strong style="color:#4A5568;">24 horas</strong>. Se não solicitou o acesso, ignore este email.
          </p>
          <p style="margin:0;font-size:11px;color:#1F2937;">
            <a href="https://cineze.com.br" style="color:#06B7D8;text-decoration:none;">cineze.com.br</a>
            <span style="color:#374151;">&nbsp;·&nbsp;</span>
            <a href="https://diagnostico.cineze.com.br" style="color:#06B7D8;text-decoration:none;">diagnostico.cineze.com.br</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
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

  // 2. Buscar email pelo order_nsu
  type PedidoRow = { email: string; nome: string | null; phone: string | null; status: string }
  const rawPedido = await supabase
    .from("pedidos")
    .select("email, nome, phone, status")
    .eq("order_nsu", order_nsu)
    .single()
  const pedidoError = rawPedido.error
  const pedido = rawPedido.data as unknown as PedidoRow | null

  if (pedidoError || !pedido) {
    console.error("Pedido não encontrado para order_nsu:", order_nsu, pedidoError)
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 400 })
  }

  // Idempotência
  if (pedido.status === "pago") {
    return NextResponse.json({ received: true, already_processed: true })
  }

  const { email, nome, phone } = pedido

  // 3. Atualizar status do pedido
  await supabase
    .from("pedidos")
    .update({ status: "pago", transaction_nsu })
    .eq("order_nsu", order_nsu)

  // 4. Criar usuário (ignora erro se já existir)
  await supabase.auth.admin.createUser({ email, email_confirm: true })

  // 5. Gerar magic link
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: "https://diagnostico.cineze.com.br/auth/callback",
    },
  })

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("Erro ao gerar magic link:", linkError)
    return NextResponse.json({ error: "Erro ao gerar link de acesso" }, { status: 500 })
  }

  const userId = linkData.user.id
  const magicLink = `https://diagnostico.cineze.com.br/auth/callback?token_hash=${linkData.properties.hashed_token}&type=magiclink`

  // 6. Ativar plano no perfil
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { id: userId, nome_responsavel: nome || "", nome_negocio: "", plano_ativo: true, pagamento_id: transaction_nsu },
      { onConflict: "id" }
    )

  if (profileError) {
    console.error("Erro ao ativar plano no perfil:", profileError)
  }

  // 7. Enviar email via Resend
  const resendApiKey = process.env.RESEND_API_KEY
  if (!resendApiKey) {
    console.error("RESEND_API_KEY não configurado")
    return NextResponse.json({ error: "Serviço de email indisponível" }, { status: 503 })
  }

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Cineze <noreply@cineze.com.br>",
      to: email,
      subject: "Seu acesso ao Diagnóstico Cineze",
      html: buildEmailHtml(magicLink),
    }),
  })

  if (!emailRes.ok) {
    const emailError = await emailRes.json()
    console.error("Erro ao enviar email via Resend:", emailError)
    return NextResponse.json({ error: "Erro ao enviar email de acesso" }, { status: 500 })
  }

  console.log(`✓ Email enviado para ${email} | order_nsu: ${order_nsu}`)

  return NextResponse.json({ received: true, processed: true })
}
