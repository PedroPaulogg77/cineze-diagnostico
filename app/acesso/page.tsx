"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

type Estado = "verificando" | "email" | "enviando" | "sucesso" | "ja_resgatado" | "timeout" | "erro"

const WHATSAPP_URL = "https://wa.me/5531985335573?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20com%20meu%20acesso%20ao%20diagn%C3%B3stico."
const POLLING_INTERVAL_MS = 3000
const TIMEOUT_MS = 90000

export default function AcessoPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-16 h-16 animate-spin text-blue-400">
          <svg viewBox="0 0 24 24" fill="none">
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </main>
    }>
      <AcessoContent />
    </Suspense>
  )
}

function AcessoContent() {
  const searchParams = useSearchParams()
  const orderNsu = searchParams.get("order_nsu")
  const transactionNsu = searchParams.get("transaction_nsu")
  const slug = searchParams.get("slug")

  const [estado, setEstado] = useState<Estado>("verificando")
  const [emailInput, setEmailInput] = useState("")
  const [confirmEmailInput, setConfirmEmailInput] = useState("")
  const [emailConfirmado, setEmailConfirmado] = useState<string | null>(null)
  const [erroMsg, setErroMsg] = useState<string | null>(null)
  const [visivel, setVisivel] = useState(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function limparTimers() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }

  // Polling: espera o webhook marcar o pedido como "pago"
  useEffect(() => {
    const t = setTimeout(() => setVisivel(true), 200)

    if (!orderNsu) {
      setEstado("erro")
      return () => clearTimeout(t)
    }

    async function verificar() {
      try {
        const res = await fetch(`/api/pagamento/status?order_nsu=${encodeURIComponent(orderNsu!)}`)
        const data = await res.json()

        if (data.pago) {
          limparTimers()

          // Se o email já é real (não é placeholder), o acesso já foi resgatado
          if (data.email && !data.email.includes("aguardando_checkout")) {
            setEstado("ja_resgatado")
            setEmailConfirmado(data.email)
          } else {
            // Pagamento confirmado, pedir email
            setEstado("email")
          }
        }
      } catch {
        // Rede instável — aguarda próxima tentativa
      }
    }

    verificar()
    intervalRef.current = setInterval(verificar, POLLING_INTERVAL_MS)

    timeoutRef.current = setTimeout(() => {
      limparTimers()
      setEstado("timeout")
    }, TIMEOUT_MS)

    return () => {
      clearTimeout(t)
      limparTimers()
    }
  }, [orderNsu])

  async function handleSubmitEmail(e: React.FormEvent) {
    e.preventDefault()

    if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setErroMsg("Digite um email válido.")
      return
    }

    if (emailInput !== confirmEmailInput) {
      setErroMsg("Os emails não conferem. Digite com atenção.")
      return
    }

    setEstado("enviando")
    setErroMsg(null)

    try {
      const res = await fetch("/api/pagamento/resgatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_nsu: orderNsu,
          transaction_nsu: transactionNsu,
          slug,
          email: emailInput,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Envia magic link para o email informado
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        await supabase.auth.signInWithOtp({
          email: data.email,
          options: {
            emailRedirectTo: "https://diagnostico.cineze.com.br/dashboard/raio-x",
            shouldCreateUser: false,
          },
        })

        setEmailConfirmado(data.email)
        setEstado("sucesso")
      } else if (res.status === 409) {
        setEstado("ja_resgatado")
      } else {
        setErroMsg(data.error || "Erro ao processar. Tente novamente.")
        setEstado("email")
      }
    } catch {
      setErroMsg("Erro de conexão. Tente novamente.")
      setEstado("email")
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div
        className={`max-w-md w-full text-center transition-all duration-700 ease-out ${
          visivel ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {estado === "verificando" && <TelaCarregando />}
        {estado === "email" && (
          <TelaEmail
            emailInput={emailInput}
            setEmailInput={setEmailInput}
            confirmEmailInput={confirmEmailInput}
            setConfirmEmailInput={setConfirmEmailInput}
            erroMsg={erroMsg}
            onSubmit={handleSubmitEmail}
          />
        )}
        {estado === "enviando" && <TelaEnviando />}
        {estado === "sucesso" && <TelaSucesso email={emailConfirmado} />}
        {estado === "ja_resgatado" && <TelaJaResgatado email={emailConfirmado} />}
        {estado === "timeout" && <TelaTimeout />}
        {estado === "erro" && <TelaErro />}
      </div>
    </main>
  )
}

// ─── Telas ────────────────────────────────────────────────────────────────────

function TelaCarregando() {
  return (
    <>
      <div className="flex justify-center mb-10">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-blue-500/15 animate-ping" />
          <svg
            className="w-16 h-16 animate-spin text-blue-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">
        Confirmando seu pagamento...
      </h1>

      <p className="text-gray-400 text-base leading-relaxed">
        Aguarde enquanto verificamos a transação.
        <br />
        Isso normalmente leva alguns segundos.
      </p>
    </>
  )
}

function TelaEmail({
  emailInput,
  setEmailInput,
  confirmEmailInput,
  setConfirmEmailInput,
  erroMsg,
  onSubmit,
}: {
  emailInput: string
  setEmailInput: (v: string) => void
  confirmEmailInput: string
  setConfirmEmailInput: (v: string) => void
  erroMsg: string | null
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <>
      {/* Ícone de check */}
      <div className="flex justify-center mb-8">
        <div className="w-20 h-20 rounded-full border-2 border-green-500/60 flex items-center justify-center bg-green-500/5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10 text-green-400"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
        Pagamento confirmado!
      </h1>

      <p className="text-gray-400 text-base leading-relaxed mb-8">
        Informe seu email para receber o link de acesso ao diagnóstico.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <input
            type="email"
            placeholder="Seu email principal"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            autoFocus
            className="w-full px-4 py-3.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-center text-base"
          />
        </div>
        <div className="flex flex-col gap-1">
          <input
            type="email"
            placeholder="Confirme seu email"
            value={confirmEmailInput}
            onChange={(e) => setConfirmEmailInput(e.target.value)}
            className="w-full px-4 py-3.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-center text-base"
          />
        </div>

        {erroMsg && (
          <p className="text-red-400 text-sm font-semibold">{erroMsg}</p>
        )}

        <button
          type="submit"
          className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-gray-950 font-bold rounded-xl transition-all text-base tracking-wide shadow-lg shadow-cyan-500/20"
        >
          RECEBER MEU ACESSO
        </button>
      </form>

      <p className="text-gray-600 text-xs mt-6">
        Enviaremos um link seguro de acesso único para este email.
      </p>
    </>
  )
}

function TelaEnviando() {
  return (
    <>
      <div className="flex justify-center mb-10">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-cyan-500/15 animate-ping" />
          <svg
            className="w-16 h-16 animate-spin text-cyan-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">
        Criando seu acesso...
      </h1>

      <p className="text-gray-400 text-base leading-relaxed">
        Estamos configurando tudo para você.
        <br />
        Aguarde um momento.
      </p>
    </>
  )
}

function TelaSucesso({ email }: { email: string | null }) {
  return (
    <>
      {/* Check animado */}
      <div className="flex justify-center mb-10">
        <div className="relative w-28 h-28">
          <span className="absolute inset-0 rounded-full bg-green-500/15 animate-ping" />
          <span className="absolute inset-2 rounded-full bg-green-500/10" />
          <div className="absolute inset-0 rounded-full border-2 border-green-500/60 flex items-center justify-center bg-green-500/5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 text-green-400"
              style={{
                strokeDasharray: 38,
                strokeDashoffset: 0,
                transition: "stroke-dashoffset 0.55s cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">
        Acesso criado!
      </h1>

      <p className="text-gray-300 text-lg leading-relaxed mb-3">
        Enviamos um link de acesso para
        {email && (
          <span className="block font-semibold text-white mt-1">{email}</span>
        )}
      </p>

      <p className="text-gray-500 text-sm mb-10">
        Pode demorar até 2 minutos para chegar. Verifique também o spam.
      </p>

      <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 text-left space-y-4 mb-10">
        <Passo numero={1} texto={'Abra o email com assunto "Seu acesso ao Diagnóstico Cineze"'} />
        <Passo numero={2} texto="Clique no botão para entrar na plataforma" />
        <Passo numero={3} texto="Preencha o formulário e receba seu diagnóstico em instantes" />
      </div>

      <a
        href="https://cineze.com.br"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Voltar para o site
      </a>
    </>
  )
}

function TelaJaResgatado({ email }: { email: string | null }) {
  return (
    <>
      <div className="flex justify-center mb-10">
        <div className="w-28 h-28 rounded-full border-2 border-yellow-500/60 flex items-center justify-center bg-yellow-500/5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-12 h-12 text-yellow-400"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">
        Acesso já resgatado
      </h1>

      <p className="text-gray-400 text-base leading-relaxed mb-4">
        Este pagamento já foi vinculado a um email.
        {email && (
          <>
            <br />
            <span className="text-gray-300">Verifique a caixa de entrada de <strong className="text-white">{email}</strong></span>
          </>
        )}
      </p>

      <p className="text-gray-500 text-sm mb-8">
        Se não encontrar o email, verifique o spam ou entre em contato.
      </p>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Falar no WhatsApp
      </a>
    </>
  )
}

function TelaTimeout() {
  return (
    <>
      <div className="flex justify-center mb-10">
        <div className="w-28 h-28 rounded-full border-2 border-yellow-500/60 flex items-center justify-center bg-yellow-500/5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-12 h-12 text-yellow-400"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">
        Demorou mais que o esperado
      </h1>

      <p className="text-gray-400 text-base leading-relaxed mb-8">
        Seu pagamento pode ainda estar sendo processado. Se já foi debitado,
        entre em contato e resolvemos na hora.
      </p>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors mb-6"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Falar no WhatsApp
      </a>

      <p className="text-xs text-gray-600">
        Ou recarregue a página para tentar novamente.
      </p>
    </>
  )
}

function TelaErro() {
  return (
    <>
      <div className="flex justify-center mb-10">
        <div className="w-28 h-28 rounded-full border-2 border-red-500/60 flex items-center justify-center bg-red-500/5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-12 h-12 text-red-400"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-4 tracking-tight">
        Link inválido
      </h1>

      <p className="text-gray-400 text-base leading-relaxed mb-8">
        Este link de acesso não é válido. Entre em contato se precisar de ajuda.
      </p>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Falar no WhatsApp
      </a>
    </>
  )
}

// ─── Componente auxiliar ──────────────────────────────────────────────────────

function Passo({ numero, texto }: { numero: number; texto: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
        {numero}
      </span>
      <span className="text-gray-400 text-sm leading-relaxed">{texto}</span>
    </div>
  )
}
