"use client"

import { useState } from "react"

type Estado = "idle" | "loading" | "error"

export default function PagamentoPage() {
  const [email, setEmail] = useState("")
  const [estado, setEstado] = useState<Estado>("idle")
  const [erro, setErro] = useState<string | null>(null)

  async function handleComprar() {
    const emailNorm = email.toLowerCase().trim()

    if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      setErro("Digite um email válido.")
      return
    }

    setEstado("loading")
    setErro(null)

    // Rastreio Meta Pixel: InitiateCheckout
    if (typeof window !== "undefined" && window.fbq) {
      const eventId = crypto.randomUUID ? crypto.randomUUID() : 'id_' + Math.random().toString(36).substr(2, 9);
      
      window.fbq("track", "InitiateCheckout", {
        value: 67.00,
        currency: "BRL",
        content_name: "Diagnóstico Cineze IA",
        num_items: 1,
      }, { eventID: eventId })

      // Envia também para o CAPI do próprio Next.js
      fetch("/api/meta-capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_name: "InitiateCheckout",
          event_id: eventId,
          source_url: window.location.href,
        })
      }).catch(err => console.error("Erro CAPI InitiateCheckout:", err))
    }

    try {
      const res = await fetch("/api/pagamento/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailNorm }),
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

  const isLoading = estado === "loading"

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-lg text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">📊</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Desbloqueie seu Diagnóstico Empresarial
        </h1>
        <p className="text-gray-500 mb-6">
          Diagnóstico completo da sua presença digital gerado por inteligência artificial.
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

        {/* Price */}
        <div className="mb-6 py-4 border-t border-b border-gray-100">
          <p className="text-sm text-gray-400 mb-1">Acesso único</p>
          <p className="text-4xl font-extrabold text-gray-900">
            R$&nbsp;67<span className="text-2xl font-semibold text-gray-500">,00</span>
          </p>
        </div>

        {/* Email field */}
        <div className="mb-4 text-left">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Seu email para receber o acesso
          </label>
          <input
            id="email"
            type="email"
            placeholder="Ex: pedro@cineze.com.br"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErro(null) }}
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        {erro && (
          <p className="mb-4 text-sm text-red-600 text-left">{erro}</p>
        )}

        <button
          type="button"
          onClick={handleComprar}
          disabled={isLoading}
          className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-base disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Gerando link de pagamento…
            </>
          ) : (
            "Comprar agora — R$ 67,00"
          )}
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Pagamento seguro via InfinitePay. Acesso imediato após confirmação.
        </p>
      </div>
    </main>
  )
}
