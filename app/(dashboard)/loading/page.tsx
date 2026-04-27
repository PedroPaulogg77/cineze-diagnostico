"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { OnboardingFormData } from "@/types"

import { createBrowserClient } from "@supabase/ssr"

const LOADING_TEXTS = [
  "Analisando a estrutura do seu negócio...",
  "Auditando sua presença digital...",
  "Mapeando seu funil de captação...",
  "Avaliando seu posicionamento no mercado...",
  "Analisando retenção e potencial de crescimento...",
  "Cruzando os dados de todos os especialistas...",
  "Preparando suas recomendações personalizadas...",
]

export default function LoadingPage() {
  const router = useRouter()
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const calledForRetry = useRef(-1)

  useEffect(() => {
    if (calledForRetry.current === retryCount) return
    calledForRetry.current = retryCount

    setError("")
    setProgress(0)
    setLoadingText(LOADING_TEXTS[0])

    let textIdx = 0
    const textInterval = setInterval(() => {
      textIdx++
      if (textIdx < LOADING_TEXTS.length) setLoadingText(LOADING_TEXTS[textIdx])
    }, 10000)

    const progressTimeout = setTimeout(() => setProgress(90), 100)

    async function runGeneration() {
      try {
        let payload: OnboardingFormData | null = null

        // Reconstruct from DB
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Usuário não autenticado")

        const [{ data: profile }, { data: respostas }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("onboarding_respostas").select("*").eq("user_id", user.id).maybeSingle()
        ])

        if (!profile) {
          throw new Error("Perfil não encontrado. Faça login novamente.")
        }

        if (!respostas) {
          // Usuário ainda não completou o onboarding — redirecionar
          router.replace("/onboarding")
          return
        }

        payload = {
          nome_responsavel: profile.nome_responsavel || user.email || "",
          nome_negocio: profile.nome_negocio || "",
          cidade_bairro: profile.cidade_bairro || "",
          segmento: profile.segmento || "",
          faturamento_faixa: profile.faturamento_faixa || "",
          objetivos: respostas.objetivos || [],
          descricao_clientes: respostas.descricao_clientes || "",
          canais_ativos: respostas.canais_ativos || [],
          contexto_extra: respostas.contexto_extra || ""
        }

        const res = await fetch("/api/diagnostico/gerar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        clearInterval(textInterval)
        clearTimeout(progressTimeout)

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error((body as { error?: string }).error ?? `A IA demorou muito a responder (Timeout ${res.status}).`)
        }

        const { id } = (await res.json()) as { id: string }

        setLoadingText("Diagnóstico gerado com sucesso!")
        setProgress(100)

        setTimeout(() => {
          router.replace(`/dashboard/raio-x?id=${id}`)
        }, 800)

      } catch (err) {
        clearInterval(textInterval)
        clearTimeout(progressTimeout)
        setProgress(0)
        const msg = err instanceof Error ? err.message : "Erro desconhecido"
        setError(`Não foi possível gerar o diagnóstico: ${msg}`)
      }
    }

    runGeneration()

    return () => {
      clearInterval(textInterval)
      clearTimeout(progressTimeout)
    }
  }, [router, retryCount])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-5 text-center"
      style={{ backgroundColor: "#060D1A", color: "#FFFFFF", fontFamily: "Inter, sans-serif" }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes cineze-spin { 100% { transform: rotate(360deg); } }
        .cineze-spinner { animation: cineze-spin 1s linear infinite; }
      ` }} />

      {error ? (
        <div className="max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full border-2 border-red-500/60 flex items-center justify-center bg-red-500/5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-red-400">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
          </div>
          <p className="text-[20px] font-bold mb-3" style={{ color: "#FFF" }}>
            Houve uma instabilidade
          </p>
          <p className="text-[14px] mb-8 leading-relaxed" style={{ color: "#8B9DB5" }}>
            {error} Suas respostas estão salvas, então você não precisa responder tudo de novo.
          </p>
          
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setRetryCount(c => c + 1)}
              className="w-full py-4 rounded-xl text-base font-bold text-gray-900 transition-transform hover:scale-[1.02] active:scale-95"
              style={{ background: "linear-gradient(135deg, #0066FF, #06B7D8)", boxShadow: "0 4px 12px rgba(0, 102, 255, 0.2)" }}
            >
              TENTAR NOVAMENTE
            </button>
            <button
              onClick={() => router.push("/onboarding")}
              className="w-full py-4 rounded-xl text-sm font-semibold transition-colors hover:bg-white/5"
              style={{ color: "#8B9DB5", border: "1px solid #1A3050" }}
            >
              Voltar ao formulário
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Spinner */}
          <div
            className="cineze-spinner w-10 h-10 rounded-full mb-8"
            style={{ border: "3px solid rgba(6,183,216,0.2)", borderTopColor: "#06B7D8" }}
          />

          {/* Progress bar */}
          <div
            className="w-full max-w-[300px] h-2 rounded-full mb-5 overflow-hidden"
            style={{ backgroundColor: "#1A3050" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: "linear-gradient(135deg, #0066FF, #06B7D8)",
                transition:
                  progress === 90
                    ? "width 60s cubic-bezier(0.1, 0.8, 0.3, 1)"
                    : "width 0.5s ease",
              }}
            />
          </div>

          <p className="text-[18px] font-semibold mb-2 min-h-[28px]">{loadingText}</p>
          <p className="text-[13px]" style={{ color: "#8B9DB5" }}>
            Isso leva cerca de 60 segundos.
          </p>
        </>
      )}
    </div>
  )
}
