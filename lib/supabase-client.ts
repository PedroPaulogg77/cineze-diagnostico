import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ─── Cliente Browser (Client Components) ─────────────────────────────────────
// Usado em "use client" components. Gerencia sessão via localStorage.

export function createBrowserSupabaseClient() {
    return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}
