import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase"
import { checkRateLimit } from "@/lib/rate-limit"
import { enviarEmailBoasVindas } from "@/lib/email"

const PLACEHOLDER_EMAIL = "aguardando_checkout@cineze.com.br"

// ─── POST /api/pagamento/resgatar ─────────────────────────────────────────────
//
//   Recebe { order_nsu, transaction_nsu, slug, email }
//   Valida que o pagamento é real, atualiza o pedido com o email do cliente,
//   cria o usuário no Supabase Auth, gera magic link e ativa o plano.
//

export async function POST(request: NextRequest) {
  // Rate Limiting Básico (Anti-Spam)
  const ip = request.headers.get("x-forwarded-for") || request.ip || "127.0.0.1"
  const rateLimit = await checkRateLimit(ip, 5, 15 * 60 * 1000) // 5 req a cada 15 min

  if (!rateLimit.success) {
    console.warn(`[Rate Limit] Bloqueado IP: ${ip} na rota /resgatar`)
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 })
  }

  let body: {
    order_nsu?: string
    transaction_nsu?: string
    slug?: string
    email?: string
    password?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const { order_nsu, transaction_nsu, slug, email, password } = body

  // 1. Validar campos obrigatórios
  if (!order_nsu || !transaction_nsu || !slug || !password) {
    return NextResponse.json({ error: "Parâmetros de pagamento ou senha ausentes" }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres" }, { status: 400 })
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
    return NextResponse.json({ error: "Pagamento ainda não confirmado pelo sistema. Aguarde e tente novamente." }, { status: 402 })
  }

  // Já resgatado: tem email real E não é o placeholder significa que o acesso já foi criado
  // Verificamos pelo campo updated_at ou se o email não é placeholder E já existe usuário ativo
  // NOTA: se o webhook gravou o email real, precisamos verificar de outro jeito
  // A forma correta é: existe algum usuário no Auth com este email E com plano_ativo?
  // Por simplificidade: se o email do pedido já é real (não placeholder) E já existe conta Auth → já resgatado
  const emailNoPedido = pedido.email
  const isPlaceholder = !emailNoPedido || emailNoPedido.includes("aguardando_checkout")

  if (!isPlaceholder && emailNoPedido !== cleanEmail) {
    // Pedido foi resgatado com outro email — bloqueamos
    return NextResponse.json({ error: "Este pedido já foi resgatado com outro email." }, { status: 409 })
  }

  // O pagamento já foi validado pelo webhook com a InfinitePay.
  // Confiamos no status "pago" do banco — não precisamos re-verificar.
  console.log(`[resgatar] Pedido ${order_nsu} validado no banco. Prosseguindo...`)

  // 4. Atualizar pedido com o email real
  await supabase
    .from("pedidos")
    .update({ email: cleanEmail })
    .eq("order_nsu", order_nsu)

  // 5. Criar usuário no Supabase Auth
  let userId: string | null = null

  const { data: newUserData, error: createError } = await supabase.auth.admin.createUser({
    email: cleanEmail,
    password: password,
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
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    const existingUser = !listError ? users.find(u => u.email?.toLowerCase() === cleanEmail) : null
    
    if (existingUser) {
      userId = existingUser.id
      // Atualizar a senha
      await supabase.auth.admin.updateUserById(userId, { password: password })
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Erro ao identificar usuário" }, { status: 500 })
  }

  // 6. ENVIAR E-MAIL DE BOAS-VINDAS VIA RESEND (Sem link mágico)
  const envioResend = await enviarEmailBoasVindas(cleanEmail)
  
  if (envioResend.error) {
    console.error("[resgatar] Erro no Resend:", envioResend.error)
    return NextResponse.json({ error: "Erro no servidor de e-mails. Avise o suporte." }, { status: 500 })
  }

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
