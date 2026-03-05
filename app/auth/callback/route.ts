import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as "invite" | "email" | "magiclink" | undefined
  const next = searchParams.get("next") ?? "/dashboard/raio-x"

  const supabase = await createServerSupabaseClient()

  // Magic link / OTP (login page flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    console.error("[auth/callback] exchangeCodeForSession error:", error)
  }

  // Invite email (webhook flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    console.error("[auth/callback] verifyOtp error:", error)
  }

  return NextResponse.redirect(`${origin}/login?error=link_invalido`)
}
