import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase"
import { checkRateLimit } from "@/lib/rate-limit"
import { enviarEmailBoasVindas } from "@/lib/email"

const PLACEHOLDER_EMAIL = "aguardando_checkout@cineze.com.br"

export async function POST(request: NextRequest) {
  // ── Rate Limiting ──────────────────────────────────────────────────────────
  const ip = request.headers.get("x-forwarded-for") || "127.0.0.1"
  const rateLimit = await checkRateLimit(ip, 5, 15 * 60 * 1000)
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 })
  }

  // ── Parse Body ─────────────────────────────────────────────────────────────
  let body: { order_nsu?: string; email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const { order_nsu, email, password } = body

  // ── Validações básicas ─────────────────────────────────────────────────────
  if (!order_nsu) {
    return NextResponse.json({ error: "Identificador do pedido ausente." }, { status: 400 })
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 })
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "A senha deve ter pelo menos 6 caracteres." }, { status: 400 })
  }

  const cleanEmail = email.toLowerCase().trim()
  const supabase = createAdminSupabaseClient()

  // ── 1. Buscar pedido no banco ───────────────────────────────────────────────
  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .select("email, status, transaction_nsu, order_nsu")
    .eq("order_nsu", order_nsu)
    .maybeSingle()

  if (pedidoError) {
    console.error("[resgatar] Erro ao buscar pedido:", pedidoError)
    return NextResponse.json({ error: "Erro ao verificar pedido." }, { status: 500 })
  }

  if (!pedido) {
    return NextResponse.json({ error: "Pedido não encontrado. Verifique o link ou contate o suporte." }, { status: 404 })
  }

  // ── 2. Verificar se está pago ──────────────────────────────────────────────
  // O webhook já validou com InfinitePay — confiamos no status do banco.
  if (pedido.status !== "pago") {
    return NextResponse.json({
      error: "Pagamento ainda não confirmado. Aguarde alguns instantes e tente novamente."
    }, { status: 402 })
  }

  // ── 3. Verificar se já foi resgatado com outro email ───────────────────────
  const emailDoBanco = pedido.email || ""
  const isPlaceholder = !emailDoBanco || emailDoBanco.includes("aguardando_checkout")

  if (!isPlaceholder && emailDoBanco !== cleanEmail) {
    // Pedido já foi usado com um email diferente
    return NextResponse.json({ error: "Este pedido já foi resgatado." }, { status: 409 })
  }

  // ── 4. Criar ou recuperar conta no Supabase Auth ───────────────────────────
  let userId: string | null = null

  const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
  })

  if (newUser?.user?.id) {
    userId = newUser.user.id
    console.log(`[resgatar] Usuário criado: ${cleanEmail}`)
  } else if (createError) {
    const isAlreadyExists =
      createError.status === 422 ||
      createError.message?.toLowerCase().includes("already") ||
      createError.message?.toLowerCase().includes("registered")

    if (isAlreadyExists) {
      // Usuário já existe — buscar e atualizar a senha
      console.log(`[resgatar] Usuário ${cleanEmail} já existe — buscando...`)
      const { data: { users } } = await supabase.auth.admin.listUsers()
      const found = users.find(u => u.email?.toLowerCase() === cleanEmail)
      if (found) {
        userId = found.id
        await supabase.auth.admin.updateUserById(userId, { password })
        console.log(`[resgatar] Senha atualizada para ${cleanEmail}`)
      }
    } else {
      console.error("[resgatar] Erro ao criar usuário:", createError)
      return NextResponse.json({ error: "Erro ao criar conta. Contate o suporte." }, { status: 500 })
    }
  }

  if (!userId) {
    console.error("[resgatar] Não foi possível obter userId para:", cleanEmail)
    return NextResponse.json({ error: "Erro interno ao identificar usuário." }, { status: 500 })
  }

  // ── 5. Atualizar pedido com email real ─────────────────────────────────────
  await supabase
    .from("pedidos")
    .update({ email: cleanEmail })
    .eq("order_nsu", order_nsu)

  // ── 6. Ativar plano no perfil ──────────────────────────────────────────────
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      plano_ativo: true,
      pagamento_id: pedido.transaction_nsu || order_nsu,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (profileError) {
    // Trigger pode não ter rodado ainda — criar o perfil manualmente
    console.warn("[resgatar] Perfil não existe, criando via upsert...")
    await supabase.from("profiles").upsert(
      {
        id: userId,
        nome_responsavel: "",
        nome_negocio: "",
        plano_ativo: true,
        pagamento_id: pedido.transaction_nsu || order_nsu,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
  }

  // ── 7. Enviar e-mail de boas-vindas (não-bloqueante) ───────────────────────
  // Não bloqueamos o sucesso se o e-mail falhar — o usuário já tem acesso.
  enviarEmailBoasVindas(cleanEmail).then(({ error }) => {
    if (error) console.error("[resgatar] Erro Resend (não bloqueante):", error)
  })

  console.log(`✓ [resgatar] Acesso criado para ${cleanEmail} | order_nsu: ${order_nsu}`)
  return NextResponse.json({ success: true, email: cleanEmail })
}
