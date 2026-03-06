import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as "invite" | "email" | "magiclink" | undefined
  const next = searchParams.get("next") ?? "/dashboard/raio-x"

  const cookieStore = await cookies()

  // Rastreia os cookies definidos pelo Supabase para aplicar no redirect
  const supabaseCookies: Array<{ name: string; value: string; options: Parameters<typeof cookieStore.set>[2] }> = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
            supabaseCookies.push({ name, value, options })
          })
        },
      },
    }
  )

  // Cria redirect e aplica os cookies da sessão nele
  const redirect = (url: string) => {
    const response = NextResponse.redirect(url)
    supabaseCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    return response
  }

  // Magic link / OTP (login page flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return redirect(`${origin}${next}`)
    console.error("[auth/callback] exchangeCodeForSession error:", error)
  }

  // Invite email (webhook flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) return redirect(`${origin}${next}`)
    console.error("[auth/callback] verifyOtp error:", error)
  }

  // Fallback: sessão já válida
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return redirect(`${origin}${next}`)

  return NextResponse.redirect(`${origin}/login?error=link_invalido`)
}
