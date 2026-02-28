"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { OnboardingFormData } from "@/types"

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
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const raw = sessionStorage.getItem("cineze_onboarding_payload")
    if (!raw) {
      // No payload — already processed or direct navigation
      router.replace("/dashboard/raio-x")
      return
    }

    let payload: OnboardingFormData
    try {
      payload = JSON.parse(raw) as OnboardingFormData
    } catch {
      setError("Erro ao ler dados do formulário. Volte ao onboarding.")
      return
    }

    // Rotate loading text every 10s
    let textIdx = 0
    const textInterval = setInterval(() => {
      textIdx++
      if (textIdx < LOADING_TEXTS.length) setLoadingText(LOADING_TEXTS[textIdx])
    }, 10000)

    // Animate progress bar to 90% over 60s (eases to show work happening)
    const progressTimeout = setTimeout(() => setProgress(90), 100)

    async function callApi() {
      try {
        const res = await fetch("/api/diagnostico/gerar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        clearInterval(textInterval)
        clearTimeout(progressTimeout)

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
        }

        const { id } = (await res.json()) as { id: string }

        setLoadingText("Diagnóstico gerado com sucesso!")
        setProgress(100)

        sessionStorage.removeItem("cineze_onboarding_payload")

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

    callApi()

    return () => {
      clearInterval(textInterval)
      clearTimeout(progressTimeout)
    }
  }, [router])

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
          <p className="text-[18px] font-semibold mb-4" style={{ color: "#FF4A4A" }}>
            Ops, algo deu errado
          </p>
          <p className="text-[14px] mb-6" style={{ color: "#8B9DB5" }}>{error}</p>
          <button
            onClick={() => router.push("/onboarding")}
            className="px-6 py-3 rounded-xl text-base font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #0066FF, #06B7D8)" }}
          >
            Voltar ao formulário
          </button>
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
