import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dunerotgzckgvbnszzjn.supabase.co"
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1bmVyb3RnemNrZ3ZibnN6empuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyODUyNTIsImV4cCI6MjA4Nzg2MTI1Mn0.GBIcjPI1hRYzWbVY8qZijdVct8wfANbxqV2GSHxTiEg"

// ─── Cliente Browser (Client Components) ─────────────────────────────────────
// Usado em "use client" components. Gerencia sessão via localStorage.

export function createBrowserSupabaseClient() {
    return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
}
