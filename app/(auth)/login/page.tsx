"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"

type Aba = "senha" | "magiclink"
type EstadoMagic = "idle" | "loading" | "enviado"

function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard/raio-x"

  const [aba, setAba] = useState<Aba>("magiclink")

  // Senha
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [erroSenha, setErroSenha] = useState("")
  const [loadingSenha, setLoadingSenha] = useState(false)

  // Magic link
  const [emailMagic, setEmailMagic] = useState("")
  const [estadoMagic, setEstadoMagic] = useState<EstadoMagic>("idle")
  const [erroMagic, setErroMagic] = useState("")

  async function handleLoginSenha(e: React.FormEvent) {
    e.preventDefault()
    setErroSenha("")
    setLoadingSenha(true)
    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErroSenha("E-mail ou senha incorretos.")
        setLoadingSenha(false)
        return
      }
      window.location.href = redirect
    } catch {
      setErroSenha("Erro ao conectar com o servidor.")
      setLoadingSenha(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setErroMagic("")
    const emailNorm = emailMagic.toLowerCase().trim()
    if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      setErroMagic("Digite um email válido.")
      return
    }
    setEstadoMagic("loading")
    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: emailNorm,
        options: {
          emailRedirectTo: `${window.location.origin}${redirect}`,
          shouldCreateUser: false,
        },
      })
      if (error) {
        setErroMagic("Não foi possível enviar o link. Verifique o email ou entre em contato.")
        setEstadoMagic("idle")
        return
      }
      setEstadoMagic("enviado")
    } catch {
      setErroMagic("Erro ao conectar com o servidor.")
      setEstadoMagic("idle")
    }
  }

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

  return (
    <div className="w-full max-w-md px-8 py-10 bg-white rounded-2xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Acessar plataforma</h1>
      <p className="text-gray-500 text-sm mb-8">Acesso exclusivo para clientes Cineze</p>

      {/* Abas */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8">
        <button
          type="button"
          onClick={() => setAba("magiclink")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            aba === "magiclink"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Magic Link
        </button>
        <button
          type="button"
          onClick={() => setAba("senha")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
            aba === "senha"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Senha
        </button>
      </div>

      {/* Aba Magic Link */}
      {aba === "magiclink" && (
        estadoMagic === "enviado" ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7 text-blue-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-gray-900 mb-2">Link enviado!</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Verifique sua caixa de entrada em <span className="font-medium text-gray-700">{emailMagic}</span>.<br />
              Clique no link para entrar automaticamente.
            </p>
            <button
              type="button"
              onClick={() => { setEstadoMagic("idle"); setEmailMagic("") }}
              className="mt-6 text-sm text-blue-600 hover:underline"
            >
              Usar outro email
            </button>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <p className="text-sm text-gray-500 -mt-2 mb-2">
              Informe seu email e enviaremos um link de acesso direto — sem precisar de senha.
            </p>
            <input
              type="email"
              value={emailMagic}
              onChange={e => { setEmailMagic(e.target.value); setErroMagic("") }}
              placeholder="seu@email.com"
              disabled={estadoMagic === "loading"}
              className={inputClass}
            />
            {erroMagic && <p className="text-sm text-red-600">{erroMagic}</p>}
            <button
              type="submit"
              disabled={estadoMagic === "loading"}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
            >
              {estadoMagic === "loading" ? "Enviando..." : "Enviar link de acesso"}
            </button>
          </form>
        )
      )}

      {/* Aba Senha */}
      {aba === "senha" && (
        <form onSubmit={handleLoginSenha} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErroSenha("") }}
            placeholder="seu@email.com"
            required
            className={inputClass}
          />
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setErroSenha("") }}
            placeholder="Senha"
            required
            className={inputClass}
          />
          {erroSenha && <p className="text-sm text-red-600">{erroSenha}</p>}
          <button
            type="submit"
            disabled={loadingSenha}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            {loadingSenha ? "Entrando..." : "Entrar"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-xs text-gray-400">
        Ainda não tem acesso?{" "}
        <a href="https://cineze.com.br" className="text-blue-600 hover:underline">
          Conheça a Cineze
        </a>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense fallback={<div className="w-full max-w-md px-8 py-10 bg-white rounded-2xl shadow-lg" />}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
