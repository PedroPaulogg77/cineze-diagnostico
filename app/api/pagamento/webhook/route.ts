import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase-server"

// ─── Tipos do payload InfinitePay ─────────────────────────────────────────────
//
// Body recebido no webhook após pagamento confirmado:
// {
//   "invoice_slug": "abc123",
//   "amount": 6700,
//   "paid_amount": 6700,
//   "capture_method": "credit_card" | "pix",
//   "transaction_nsu": "uuid-do-pagamento",
//   "order_nsu": "cineze-1234567890-ABCD",
//   "receipt_url": "https://..."
// }

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

// ─── Route Handler ────────────────────────────────────────────────────────────

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

  const { email } = pedido

  // 3. Atualizar status do pedido
  await supabase
    .from("pedidos")
    .update({ status: "pago", transaction_nsu })
    .eq("order_nsu", order_nsu)

  // 4. Criar usuário no Supabase Auth
  //    email_confirm: true → email já confirmado, não precisa verificar
  let userId: string | null = null

  const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (!createError && newUserData?.user?.id) {
    userId = newUserData.user.id
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

  // 5. Gerar link de redefinição de senha e enviar email
  //
  //    generateLink com type "recovery":
  //    → Gera um link "Definir senha" e envia automaticamente via Supabase Email
  //    → Também retorna o user.id (útil quando o usuário já existia)
  //    → Requer SMTP configurado em: Supabase Dashboard → Auth → SMTP Settings
  //
  const { data: recoveryData, error: recoveryError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/raio-x`,
    },
  })

  if (recoveryError || !recoveryData?.user?.id) {
    console.error("Erro ao gerar link de acesso:", recoveryError)
    return NextResponse.json({ error: "Erro ao enviar email de acesso" }, { status: 500 })
  }

  // Usar userId do recovery se não tínhamos (usuário já existia)
  userId = userId ?? recoveryData.user.id

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
