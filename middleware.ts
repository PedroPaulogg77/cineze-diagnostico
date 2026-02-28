import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Rotas que qualquer um pode acessar sem sessão
const PUBLIC_ROUTES = ["/login", "/signup", "/pagamento", "/acesso"]

// Rotas de autenticação — redireciona para o dashboard se já logado
const AUTH_ROUTES = ["/login", "/signup"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Deixa passar recursos estáticos e webhook de pagamento (precisa do body raw)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/pagamento/webhook") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // Cria o cliente Supabase que lê/escreve os cookies de sessão
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Propaga os cookies tanto para o request quanto para o response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Verifica a sessão (getUser() valida junto ao servidor do Supabase)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── Usuário logado tentando acessar página de auth ──────────────────────────
  if (user && AUTH_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard/raio-x", request.url))
  }

  // ── Rotas públicas — qualquer um pode acessar ────────────────────────────────
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return response
  }

  // ── Rotas protegidas: /dashboard/* e /onboarding ─────────────────────────────
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")

  if (isProtected) {
    // 1. Sem sessão → login
    if (!user) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 2. Busca o perfil para checar plano e onboarding
    const { data: profile } = await supabase
      .from("profiles")
      .select("plano_ativo, onboarding_completo")
      .eq("id", user.id)
      .single()

    // 3. Sem plano ativo → pagamento
    if (!profile?.plano_ativo) {
      return NextResponse.redirect(new URL("/pagamento", request.url))
    }

    // 4. Plano ativo mas onboarding pendente → /onboarding
    //    (exceto se já está em /onboarding ou /loading)
    if (
      !profile?.onboarding_completo &&
      !pathname.startsWith("/onboarding") &&
      !pathname.startsWith("/loading")
    ) {
      return NextResponse.redirect(new URL("/onboarding", request.url))
    }
  }

  return response
}

export const config = {
  // Roda em todas as rotas exceto recursos estáticos do Next
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
