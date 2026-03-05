"use client"

import { useState } from "react"

type Estado = "idle" | "loading" | "error"

export default function PagamentoPage() {
  const [nome, setNome] = useState("")
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [estado, setEstado] = useState<Estado>("idle")
  const [erro, setErro] = useState<string | null>(null)

  function formatarTelefone(valor: string) {
    const digits = valor.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  async function handleComprar() {
    const nomeTrim = nome.trim()
    const emailNorm = email.toLowerCase().trim()
    const telefoneTrim = telefone.trim()

    if (!nomeTrim) { setErro("Digite seu nome."); return }
    if (!telefoneTrim || telefone.replace(/\D/g, "").length < 10) { setErro("Digite um telefone válido com DDD."); return }
    if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) { setErro("Digite um email válido."); return }

    setEstado("loading")
    setErro(null)

    try {
      const res = await fetch("/api/pagamento/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nomeTrim, telefone: telefone.replace(/\D/g, ""), email: emailNorm }),
      })

      const data = await res.json()

      if (!res.ok || !data.checkout_url) {
        setErro(data.error ?? "Erro ao gerar link de pagamento. Tente novamente.")
        setEstado("error")
        return
      }

      window.location.href = data.checkout_url
    } catch {
      setErro("Erro de conexão. Verifique sua internet e tente novamente.")
      setEstado("error")
    }
  }

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-lg text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">📊</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Desbloqueie seu Diagnóstico Empresarial
        </h1>
        <p className="text-gray-500 mb-8">
          Acesso completo ao diagnóstico personalizado da sua empresa gerado por inteligência artificial.
        </p>

        <ul className="text-left space-y-3 mb-8">
          {[
            "Raio-X completo do seu negócio",
            "Análise de maturidade digital",
            "Posicionamento de mercado",
            "Plano de ação personalizado",
            "Objetivos SMART",
            "Métricas e KPIs recomendados",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        <div className="space-y-3 mb-4">
          <input
            type="text"
            value={nome}
            onChange={(e) => { setNome(e.target.value); if (erro) setErro(null) }}
            placeholder="Seu nome completo"
            disabled={estado === "loading"}
            className={inputClass}
          />
          <input
            type="tel"
            value={telefone}
            onChange={(e) => { setTelefone(formatarTelefone(e.target.value)); if (erro) setErro(null) }}
            placeholder="(11) 99999-9999"
            disabled={estado === "loading"}
            className={inputClass}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (erro) setErro(null) }}
            onKeyDown={(e) => e.key === "Enter" && handleComprar()}
            placeholder="Seu melhor email"
            disabled={estado === "loading"}
            className={inputClass}
          />
          {erro && (
            <p className="text-sm text-red-600 text-left">{erro}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleComprar}
          disabled={estado === "loading"}
          className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {estado === "loading" ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Gerando link...
            </>
          ) : (
            "Comprar agora"
          )}
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Pagamento seguro. Acesso imediato após confirmação.
        </p>
      </div>
    </main>
  )
}
