"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"

export default function AtualizarSenhaPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState<"loading" | "idle" | "submitting" | "success" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Verificar se o usuário está logado (o que deve acontecer via hash do recovery link)
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Se a sessão não existir, o link pode ter expirado ou o redirecionamento falhou
        // Vamos aguardar 1 segundinho pra ver se o client hydration pega o hash, senão avisamos.
        setTimeout(async () => {
          const { data: { session: sessionRetry } } = await supabase.auth.getSession()
          if (!sessionRetry) {
            setErrorMsg("Link inválido ou expirado. Por favor, solicite a recuperação novamente.")
            setStatus("error")
          } else {
            setStatus("idle")
          }
        }, 1500)
      } else {
        setStatus("idle")
      }
    }
    checkUser()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 6) {
      setErrorMsg("A senha deve ter pelo menos 6 caracteres.")
      setStatus("error")
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem.")
      setStatus("error")
      return
    }

    setStatus("submitting")
    setErrorMsg("")

    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      setErrorMsg(error.message || "Erro ao atualizar a senha.")
      setStatus("error")
      return
    }

    setStatus("success")
    setTimeout(() => {
      router.push("/dashboard/raio-x")
    }, 2000)
  }

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="flex flex-col items-center">
          <svg className="w-10 h-10 animate-spin text-cyan-400 mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-400">Autenticando link seguro...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Criar Nova Senha</h1>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          Digite sua nova senha abaixo para recuperar seu acesso ao Diagnóstico.
        </p>

        {status === "success" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-green-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Senha Atualizada!</h2>
            <p className="text-gray-400 text-sm mb-6">Redirecionando para o seu painel...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
                  Nova senha (mínimo 6 caracteres)
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua nova senha"
                  disabled={status === "submitting" || status === "error" && errorMsg.includes("inválido")}
                  className="w-full px-4 py-3.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-base disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-300 mb-2">
                  Confirmar nova senha
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  disabled={status === "submitting" || status === "error" && errorMsg.includes("inválido")}
                  className="w-full px-4 py-3.5 bg-gray-950 border border-gray-800 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-base disabled:opacity-50"
                />
              </div>

              {status === "error" && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={status === "submitting" || status === "error" && errorMsg.includes("inválido")}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-gray-950 font-bold rounded-xl transition-all text-base tracking-wide shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {status === "submitting" ? "Atualizando..." : "SALVAR E ENTRAR"}
            </button>
            
            {status === "error" && errorMsg.includes("inválido") && (
              <button
                type="button"
                onClick={() => router.push("/login")}
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
