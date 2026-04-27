"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"


export default function LoginPage() {
  const [view, setView] = useState<"login" | "forgot">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Digite um email válido.")
      setStatus("error")
      return
    }

    if (!password) {
      setErrorMsg("Digite sua senha.")
      setStatus("error")
      return
    }

    setStatus("loading")
    setErrorMsg("")

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setErrorMsg("Email ou senha incorretos.")
        setStatus("error")
        return
      }

      setStatus("success")
      window.location.href = "/dashboard/raio-x"
    } catch {
      setErrorMsg("Erro de conexão. Verifique sua internet.")
      setStatus("error")
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Digite um email válido.")
      setStatus("error")
      return
    }

    setStatus("loading")
    setErrorMsg("")

    try {
      const res = await fetch("/api/auth/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || "Erro ao enviar o link. Tente novamente.")
        setStatus("error")
        return
      }

      setStatus("success")
    } catch {
      setErrorMsg("Erro de conexão. Verifique sua internet.")
      setStatus("error")
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          {view === "login" ? "Acesse seu Painel" : "Recuperar Senha"}
        </h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          {view === "login"
            ? "Digite seu email e a senha que você criou (ou recebeu no e-mail) para acessar seu diagnóstico."
            : "Digite seu email e enviaremos um link seguro para você redefinir sua senha."}
        </p>

        {status === "success" && view === "login" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-green-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Login realizado!</h2>
            <p className="text-gray-400 text-sm mb-6">Redirecionando para o seu painel...</p>
          </div>
        )}

        {status === "success" && view === "forgot" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-green-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Link enviado!</h2>
            <p className="text-gray-400 text-sm mb-6">
              Enviamos um link de redefinição para <strong>{email}</strong>. Verifique sua caixa de entrada e também o spam.
            </p>
            <button
              onClick={() => {
                setView("login")
                setStatus("idle")
                setPassword("")
              }}
              className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors"
            >
              Voltar para o login
            </button>
          </div>
        )}

        {status !== "success" && (
          <form onSubmit={view === "login" ? handleSubmit : handleForgotPassword} className="space-y-4 text-left">
            <div className="space-y-4">
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
              </div>

              {view === "login" && (
                <div>
                  <div className="flex justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-300">
                      Sua senha
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setView("forgot")
                        setStatus("idle")
                        setErrorMsg("")
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={status === "loading"}
                    className="w-full px-4 py-3.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-base disabled:opacity-50"
                  />
                </div>
              )}

              {status === "error" && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-gray-950 font-bold rounded-xl transition-all text-base tracking-wide shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {status === "loading" ? "Processando..." : view === "login" ? "ENTRAR NO PAINEL" : "ENVIAR LINK DE REDEFINIÇÃO"}
            </button>
            
            {view === "forgot" && (
              <button
                type="button"
                onClick={() => {
                  setView("login")
                  setStatus("idle")
                  setErrorMsg("")
                }}
                className="w-full text-gray-400 hover:text-white text-sm font-semibold transition-colors mt-4"
              >
                Voltar para o login
              </button>
            )}
          </form>
        )}
      </div>
    </main>
  )
}
