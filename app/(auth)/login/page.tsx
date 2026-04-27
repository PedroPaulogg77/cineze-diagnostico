"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Digite um email válido.")
      setStatus("error")
      return
    }

    setStatus("loading")
    setErrorMsg("")

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard/raio-x`,
        shouldCreateUser: false, // Só permite quem já comprou e foi criado na rota /resgatar
      },
    })

    if (error) {
      if (error.message.includes("Signups not allowed")) {
        setErrorMsg("Este email não possui acesso liberado. Se você já pagou, use o link que recebeu após a compra.")
      } else {
        setErrorMsg("Erro ao enviar o link. Verifique seu email e tente novamente.")
      }
      setStatus("error")
    } else {
      setStatus("success")
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Acesso ao Diagnóstico</h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          Seu link de acesso expirou? Digite o email cadastrado na compra para receber um novo link mágico.
        </p>

        {status === "success" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-green-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Enviado com sucesso!</h2>
            <p className="text-gray-400 text-sm mb-6">
              Enviamos um novo link de acesso para <strong>{email}</strong>. Verifique sua caixa de entrada e também a pasta de spam.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors"
            >
              Tentar com outro email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
                Seu email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: pedro@cineze.com.br"
                disabled={status === "loading"}
                className="w-full px-4 py-3.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-base disabled:opacity-50"
              />
              {status === "error" && (
                <p className="text-red-400 text-xs mt-2">{errorMsg}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-gray-950 font-bold rounded-xl transition-all text-base tracking-wide shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {status === "loading" ? "Enviando link..." : "RECEBER LINK DE ACESSO"}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
