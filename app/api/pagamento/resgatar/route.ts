import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase"

const PLACEHOLDER_EMAIL = "aguardando_checkout@cineze.com.br"

// ─── POST /api/pagamento/resgatar ─────────────────────────────────────────────
//
//   Recebe { order_nsu, transaction_nsu, slug, email }
//   Valida que o pagamento é real, atualiza o pedido com o email do cliente,
//   cria o usuário no Supabase Auth, gera magic link e ativa o plano.
//

export async function POST(request: NextRequest) {
  let body: {
    order_nsu?: string
    transaction_nsu?: string
    slug?: string
    email?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const { order_nsu, transaction_nsu, slug, email } = body

  // 1. Validar campos obrigatórios
  if (!order_nsu || !transaction_nsu || !slug) {
    return NextResponse.json({ error: "Parâmetros de pagamento ausentes" }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 })
  }

  const cleanEmail = email.toLowerCase().trim()

  const handle = process.env.INFINITEPAY_HANDLE
  if (!handle) {
    console.error("INFINITEPAY_HANDLE não configurado")
    return NextResponse.json({ error: "Serviço indisponível" }, { status: 503 })
  }

  const supabase = createAdminSupabaseClient()

  // 2. Verificar pedido no banco
  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .select("email, status, transaction_nsu")
    .eq("order_nsu", order_nsu)
    .single()

  if (pedidoError || !pedido) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
  }

  if (pedido.status !== "pago") {
    return NextResponse.json({ error: "Pagamento ainda não confirmado" }, { status: 402 })
  }

  // Já resgatado: email diferente do placeholder significa que já foi usado
  if (pedido.email !== PLACEHOLDER_EMAIL) {
    return NextResponse.json({ error: "Este pedido já foi resgatado" }, { status: 409 })
  }

  // 3. Verificar autenticidade do pagamento com a InfinitePay
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
          slug,
        }),
      }
    )

    if (!checkResponse.ok) {
      console.error("[resgatar] payment_check falhou:", checkResponse.status)
      return NextResponse.json({ error: "Verificação de pagamento falhou" }, { status: 400 })
    }

    const checkData = await checkResponse.json()
    if (checkData.paid !== true) {
      return NextResponse.json({ error: "Pagamento não confirmado" }, { status: 402 })
    }
  } catch (err) {
    console.error("[resgatar] Erro ao verificar pagamento:", err)
    return NextResponse.json({ error: "Erro na verificação" }, { status: 500 })
  }

  // 4. Atualizar pedido com o email real
  await supabase
    .from("pedidos")
    .update({ email: cleanEmail })
    .eq("order_nsu", order_nsu)

  // 5. Criar usuário no Supabase Auth
  let userId: string | null = null

  const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
    email: cleanEmail,
    email_confirm: true,
  })

  if (!createError && newUserData?.user?.id) {
    userId = newUserData.user.id
  } else if (createError) {
    const jaExiste =
      createError.status === 422 ||
      createError.message?.toLowerCase().includes("already") ||
      createError.message?.toLowerCase().includes("registered")

    if (!jaExiste) {
      console.error("[resgatar] Erro ao criar usuário:", createError)
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }
    console.log(`[resgatar] Usuário ${cleanEmail} já existe, prosseguindo...`)
  }

  // 6. Gerar magic link de acesso (enviado automaticamente via Supabase SMTP/Resend)
  const { data: recoveryData, error: recoveryError } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email: cleanEmail,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/raio-x`,
    },
  })

  if (recoveryError || !recoveryData?.user?.id) {
    console.error("[resgatar] Erro ao gerar link de acesso:", recoveryError)
    return NextResponse.json({ error: "Erro ao enviar email de acesso" }, { status: 500 })
  }

  userId = userId ?? recoveryData.user.id

  // 7. Ativar plano no perfil
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      plano_ativo: true,
      pagamento_id: transaction_nsu,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (profileError) {
    console.warn("[resgatar] Perfil não encontrado, criando manualmente:", profileError)
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

  console.log(`✓ [resgatar] Acesso criado para ${cleanEmail} | order_nsu: ${order_nsu}`)

  return NextResponse.json({ success: true, email: cleanEmail })
}
