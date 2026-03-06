import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as "invite" | "email" | "magiclink" | undefined
  const next = searchParams.get("next") ?? "/dashboard/raio-x"

  // Cria o redirect antecipado para poder setar cookies diretamente nele
  const successResponse = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Seta os cookies da sessão direto na resposta de redirect
          cookiesToSet.forEach(({ name, value, options }) => {
            successResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Magic link / OTP (login page flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return successResponse
    console.error("[auth/callback] exchangeCodeForSession error:", error)
  }

  // Invite email (webhook flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) return successResponse
    console.error("[auth/callback] verifyOtp error:", error)
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalido`)
}
