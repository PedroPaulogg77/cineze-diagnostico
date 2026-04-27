import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase"
import { checkRateLimit } from "@/lib/rate-limit"
import { enviarEmailRecuperacaoSenha } from "@/lib/email"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.ip || "127.0.0.1"
  const rateLimit = await checkRateLimit(`recover-${ip}`, 3, 15 * 60 * 1000)

  if (!rateLimit.success) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 15 minutos." }, { status: 429 })
  }

  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const { email } = body

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 })
  }

  const cleanEmail = email.toLowerCase().trim()
  const supabaseAdmin = createAdminSupabaseClient()

  // Gerar link de redefinição de senha via Supabase (tipo recovery)
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: cleanEmail,
    options: {
      redirectTo: `${request.nextUrl.origin}/atualizar-senha`,
    },
  })

  // Se o usuário não existe, o Supabase retorna erro.
  if (linkError) {
    console.error("[recuperar-senha] Erro:", linkError)
    // Retornamos 400 simulando que não encontrou pra não vazar infos
    return NextResponse.json({ error: "Este email não possui conta no sistema." }, { status: 400 })
  }

  const magicLink = linkData.properties?.action_link

  if (!magicLink) {
    return NextResponse.json({ error: "Erro ao criar link seguro" }, { status: 500 })
  }

  // Enviar via Resend (Novo template)
  const envio = await enviarEmailRecuperacaoSenha(cleanEmail, magicLink)

  if (envio.error) {
    console.error("[recuperar-senha] Erro Resend:", envio.error)
    return NextResponse.json({ error: "Erro no servidor de e-mails." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
