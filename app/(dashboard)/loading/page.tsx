"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
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
  const payloadRef = useRef<OnboardingFormData | null>(null)
  const timersRef = useRef<{ text?: ReturnType<typeof setInterval>; progress?: ReturnType<typeof setTimeout> }>({})

  function clearTimers() {
    clearInterval(timersRef.current.text)
    clearTimeout(timersRef.current.progress)
  }

  const runGeneration = useCallback(async () => {
    if (!payloadRef.current) {
      router.replace("/onboarding")
      return
    }

    setError("")
    setProgress(0)
    setLoadingText(LOADING_TEXTS[0])

    let textIdx = 0
    timersRef.current.text = setInterval(() => {
      textIdx++
      if (textIdx < LOADING_TEXTS.length) setLoadingText(LOADING_TEXTS[textIdx])
    }, 10000)
    timersRef.current.progress = setTimeout(() => setProgress(90), 100)

    try {
      const res = await fetch("/api/diagnostico/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadRef.current),
      })

      clearTimers()

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
      clearTimers()
      setProgress(0)
      const msg = err instanceof Error ? err.message : "Erro desconhecido"
      setError(`Não foi possível gerar o diagnóstico: ${msg}`)
    }
  }, [router])

  useEffect(() => {
    if (called.current) return
    called.current = true

    async function init() {
      // 1. Try sessionStorage first
      const raw = sessionStorage.getItem("cineze_onboarding_payload")
      if (raw) {
        try {
          payloadRef.current = JSON.parse(raw) as OnboardingFormData
          runGeneration()
          return
        } catch {
          // fall through to DB
        }
      }

      // 2. Fallback: load api_payload from localStorage (persisted on form submit)
      try {
        const supabase = createBrowserSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const raw = localStorage.getItem(`cineze_api_payload_${user.id}`)
          if (raw) {
            payloadRef.current = JSON.parse(raw) as OnboardingFormData
            sessionStorage.setItem("cineze_onboarding_payload", JSON.stringify(payloadRef.current))
            runGeneration()
            return
          }
        }
      } catch {
        // ignore
      }

      // 3. No data anywhere — send to onboarding
      router.replace("/onboarding")
    }

    init()

    return () => clearTimers()
  }, [router, runGeneration])

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
            onClick={runGeneration}
            className="w-full px-6 py-4 rounded-xl text-base font-semibold text-white mb-3"
            style={{ background: "linear-gradient(135deg, #0066FF, #06B7D8)" }}
          >
            Tentar novamente
          </button>
          <button
            onClick={() => router.push("/onboarding")}
            className="text-[14px] transition-colors"
            style={{ color: "#8B9DB5" }}
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
