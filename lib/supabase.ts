import { createBrowserClient, createServerClient as createSSRServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/database"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ─── Cliente Browser (Client Components) ─────────────────────────────────────
// Usado em "use client" components. Gerencia sessão via localStorage.

export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}

// ─── Cliente Server (Server Components, Route Handlers, Server Actions) ───────
// Lê e escreve cookies para manter a sessão no servidor.

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createSSRServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server Components não podem escrever cookies — ignorar
        }
      },
    },
  })
}

// ─── Cliente Admin (apenas server-side) ──────────────────────────────────────
// Usa a service role key — bypassa RLS. Nunca expor no client.

export function createAdminSupabaseClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
