import { NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase"
import { checkRateLimit } from "@/lib/rate-limit"
import { enviarEmailAcesso } from "@/lib/email"

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || request.ip || "127.0.0.1"
  const rateLimit = checkRateLimit(`login-${ip}`, 5, 15 * 60 * 1000)

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

  // Verifica se o usuário existe (só enviamos se existir para não vazar emails)
  // Usaremos admin.generateLink direto, se der erro de usuário não encontrado, sabemos.
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: cleanEmail,
    options: {
      redirectTo: `${request.nextUrl.origin}/dashboard/raio-x`,
    },
  })

  // Se o usuário não existe, o Supabase retorna erro.
  if (linkError) {
    console.error("[recuperar-acesso] Erro:", linkError)
    // Retornamos 400 simulando que ele não tem acesso
    return NextResponse.json({ error: "Este email não possui acesso liberado." }, { status: 400 })
  }

  const magicLink = linkData.properties?.action_link

  if (!magicLink) {
    return NextResponse.json({ error: "Erro ao criar link seguro" }, { status: 500 })
  }

  // Enviar via Resend
  const envio = await enviarEmailAcesso(cleanEmail, magicLink)

  if (envio.error) {
    console.error("[recuperar-acesso] Erro Resend:", envio.error)
    return NextResponse.json({ error: "Erro no servidor de e-mails." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
