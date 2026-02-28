"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard/raio-x"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    console.log("[LOGIN] Iniciando fluxo de login...")
    console.log("[LOGIN] Email:", email)

    try {
      console.log("[LOGIN] Criando cliente Supabase browser...")
      const supabase = createBrowserSupabaseClient()

      console.log("[LOGIN] Enviando credenciais para API Supabase...")

      // Promise race para evitar hang infinito
      const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout na requisição de login. O servidor demorou muito para responder.")), 15000)
      )

      const authPromise = supabase.auth.signInWithPassword({ email, password })
      const { data, error } = await Promise.race([authPromise, timeoutPromise]) as any

      console.log("[LOGIN] Resposta do Supabase:", { data, error })

      if (error) {
        console.error("[LOGIN] Login error:", error)
        setError(error?.message || "E-mail ou senha incorretos.")
        setLoading(false)
        return
      }

      console.log("[LOGIN] Sucesso. Redirecionando para:", redirect)
      window.location.href = redirect
    } catch (err: any) {
      console.error("[LOGIN] Unexpected error during login:", err)
      setError(err?.message || "Ocorreu um erro ao conectar com o servidor.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Entrar</h1>
      <p className="text-gray-500 mb-8">Acesse sua conta para continuar</p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Não tem conta?{" "}
        <Link href="/signup" className="text-blue-600 hover:underline font-medium">
          Cadastre-se
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg" />}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
