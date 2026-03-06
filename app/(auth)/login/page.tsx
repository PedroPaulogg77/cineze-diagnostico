"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"

type Aba = "magiclink" | "senha"
type Estado = "idle" | "loading" | "enviado"

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const erro = searchParams.get("error")

  const [aba, setAba] = useState<Aba>("magiclink")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [estado, setEstado] = useState<Estado>("idle")
  const [erroMsg, setErroMsg] = useState(
    erro === "link_invalido" || erro === "invalid_link"
      ? "Link expirado ou inválido. Solicite um novo abaixo."
      : ""
  )
  const [showReset, setShowReset] = useState(false)

  function trocarAba(nova: Aba) {
    setAba(nova)
    setErroMsg("")
    setEstado("idle")
    setShowReset(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    const emailNorm = email.toLowerCase().trim()
    if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      setErroMsg("Digite um email válido.")
      return
    }
    setErroMsg("")
    setEstado("loading")
    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.signInWithOtp({
        email: emailNorm,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: false,
        },
      })
      if (error) {
        setErroMsg("Não foi possível enviar o link. Verifique o email ou entre em contato.")
        setEstado("idle")
        return
      }
      setEstado("enviado")
    } catch {
      setErroMsg("Erro ao conectar com o servidor.")
      setEstado("idle")
    }
  }

  async function handleSenha(e: React.FormEvent) {
    e.preventDefault()
    const emailNorm = email.toLowerCase().trim()
    if (!emailNorm || !senha) {
      setErroMsg("Preencha email e senha.")
      return
    }
    setErroMsg("")
    setEstado("loading")
    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.signInWithPassword({ email: emailNorm, password: senha })
      if (error) {
        setErroMsg("Email ou senha incorretos.")
        setEstado("idle")
        return
      }
      router.push("/dashboard/raio-x")
    } catch {
      setErroMsg("Erro ao conectar com o servidor.")
      setEstado("idle")
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    const emailNorm = email.toLowerCase().trim()
    if (!emailNorm) {
      setErroMsg("Digite seu email.")
      return
    }
    setErroMsg("")
    setEstado("loading")
    try {
      const supabase = createBrowserSupabaseClient()
      const { error } = await supabase.auth.resetPasswordForEmail(emailNorm, {
        redirectTo: `${window.location.origin}/auth/callback`,
      })
      if (error) {
        setErroMsg("Erro ao enviar email. Tente novamente.")
        setEstado("idle")
        return
      }
      setEstado("enviado")
    } catch {
      setErroMsg("Erro ao conectar com o servidor.")
      setEstado("idle")
    }
  }

  if (estado === "enviado") {
    return (
      <div className="w-full max-w-md px-8 py-10 bg-white rounded-2xl shadow-lg text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7 text-blue-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {showReset ? "Email de redefinição enviado!" : "Link enviado!"}
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Verifique sua caixa de entrada em<br />
          <span className="font-medium text-gray-700">{email}</span>
        </p>
        <p className="text-xs text-gray-400 mb-5">Não chegou? Verifique o spam.</p>
        <button
          type="button"
          onClick={() => { setEstado("idle"); setShowReset(false) }}
          className="text-sm text-blue-600 hover:underline"
        >
          Voltar ao login
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md px-8 py-10 bg-white rounded-2xl shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Acessar plataforma</h1>

      {/* Tabs */}
      <div className="flex border border-gray-200 rounded-xl p-1 mb-7 gap-1">
        <button
          type="button"
          onClick={() => trocarAba("magiclink")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            aba === "magiclink"
              ? "bg-blue-600 text-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Link de acesso
        </button>
        <button
          type="button"
          onClick={() => trocarAba("senha")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            aba === "senha"
              ? "bg-blue-600 text-white"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Senha
        </button>
      </div>

      {/* Magic link form */}
      {aba === "magiclink" && (
        <form onSubmit={handleMagicLink} className="space-y-4">
          <p className="text-sm text-gray-500 -mt-2 mb-4">
            Enviaremos um link direto para seu email.
          </p>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErroMsg("") }}
            placeholder="seu@email.com"
            disabled={estado === "loading"}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          {erroMsg && <p className="text-sm text-red-600">{erroMsg}</p>}
          <button
            type="submit"
            disabled={estado === "loading"}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            {estado === "loading" ? "Enviando..." : "Enviar link de acesso"}
          </button>
        </form>
      )}

      {/* Senha form */}
      {aba === "senha" && !showReset && (
        <form onSubmit={handleSenha} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErroMsg("") }}
            placeholder="seu@email.com"
            disabled={estado === "loading"}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <input
            type="password"
            value={senha}
            onChange={e => { setSenha(e.target.value); setErroMsg("") }}
            placeholder="Sua senha"
            disabled={estado === "loading"}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          {erroMsg && <p className="text-sm text-red-600">{erroMsg}</p>}
          <button
            type="submit"
            disabled={estado === "loading"}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            {estado === "loading" ? "Entrando..." : "Entrar"}
          </button>
          <button
            type="button"
            onClick={() => { setShowReset(true); setErroMsg("") }}
            className="w-full text-center text-sm text-gray-400 hover:text-blue-600 transition-colors"
          >
            Esqueci minha senha
          </button>
        </form>
      )}

      {/* Reset form */}
      {aba === "senha" && showReset && (
        <form onSubmit={handleReset} className="space-y-4">
          <p className="text-sm text-gray-500 -mt-2 mb-4">
            Enviaremos um link para redefinir sua senha.
          </p>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErroMsg("") }}
            placeholder="seu@email.com"
            disabled={estado === "loading"}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          {erroMsg && <p className="text-sm text-red-600">{erroMsg}</p>}
          <button
            type="submit"
            disabled={estado === "loading"}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            {estado === "loading" ? "Enviando..." : "Enviar link de redefinição"}
          </button>
          <button
            type="button"
            onClick={() => { setShowReset(false); setErroMsg("") }}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Voltar ao login
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
