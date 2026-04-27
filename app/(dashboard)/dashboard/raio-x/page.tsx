"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer,
} from "recharts"
import { useReactToPrint } from "react-to-print"
import type { Pilares, NivelDiagnostico } from "@/types"

// ─── Constants ────────────────────────────────────────────────────────────────

const C_MAIN = 2 * Math.PI * 70  // ≈ 439.8
const C_MINI = 2 * Math.PI * 16  // ≈ 100.5
const CSS = `@keyframes rx-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageData {
  pendente?: boolean
  score_geral: number
  nivel: NivelDiagnostico
  resumo_executivo: string
  score_visibilidade: number
  score_captacao: number
  score_conversao: number
  score_posicionamento: number
  pilares: Pilares
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(s: number): string {
  if (s < 4) return "#EF4444"
  if (s < 6) return "#F97316"
  if (s < 8) return "#EAB308"
  return "#3B82F6"
}

function badgeColors(nivel: NivelDiagnostico): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    "Presença Crítica":     { color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
    "Em Construção":        { color: "#F97316", bg: "rgba(249,115,22,0.15)" },
    "Em Crescimento":       { color: "#EAB308", bg: "rgba(234,179,8,0.15)" },
    "Presença Sólida":      { color: "#3B82F6", bg: "rgba(59,130,246,0.15)" },
    "Referência na região": { color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
  }
  return map[nivel] ?? { color: "#EAB308", bg: "rgba(234,179,8,0.15)" }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skel({ style }: { style: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--border-color)",
        borderRadius: 8,
        animation: "rx-pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  )
}

function MiniArc({ score }: { score: number }) {
  const color = scoreColor(score)
  const offset = C_MINI * (1 - score / 10)
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
      <circle cx="20" cy="20" r="16" fill="none" stroke="var(--border-color)" strokeWidth="4" />
      <circle
        cx="20" cy="20" r="16" fill="none"
        stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={C_MINI} strokeDashoffset={offset}
        transform="rotate(-90 20 20)"
      />
    </svg>
  )
}

function PillarRow({
  label, score, animated,
}: { label: string; score: number; animated: boolean }) {
  const color = scoreColor(score)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 500 }}>{label}</span>
        <span style={{ color, fontSize: 14, fontWeight: 600 }}>{score.toFixed(1)} / 10</span>
      </div>
      <div style={{ height: 6, background: "var(--border-color)", borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            height: "100%", borderRadius: 3, background: color,
            width: animated ? `${score * 10}%` : "0%",
            transition: "width 1s ease-in-out",
          }}
        />
      </div>
    </div>
  )
}

function DetailCard({
  label, score, diagnostico, recomendacoes,
}: { label: string; score: number; diagnostico: string; recomendacoes: string[] }) {
  const color = scoreColor(score)
  return (
    <div
      className="print-card"
      style={{
        background: "var(--bg-surface)", borderRadius: 12, padding: 24,
        border: "1px solid var(--border-color)", borderLeft: `4px solid ${color}`,
        display: "flex", flexDirection: "column", gap: 16,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <MiniArc score={score} />
        <span style={{ color: "var(--text-primary)", fontSize: 16, fontWeight: 600 }}>{label}</span>
      </div>

      <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
        {diagnostico}
      </p>

      {recomendacoes.length > 0 && (
        <div>
          <h4
            style={{
              color: "#0066FF", fontSize: 12, textTransform: "uppercase",
              fontWeight: 600, margin: "0 0 12px", letterSpacing: "0.5px",
            }}
          >
            Recomendações
          </h4>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {recomendacoes.map((rec, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.4 }}>
                  {rec}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Skeleton layout ──────────────────────────────────────────────────────────

function SkeletonLayout() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Score card */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 32, display: "flex", gap: 40, alignItems: "center" }}>
          <Skel style={{ width: 160, height: 160, borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <Skel style={{ height: 14, width: "40%" }} />
            <Skel style={{ height: 32, width: "35%", borderRadius: 20 }} />
            <Skel style={{ height: 14 }} />
            <Skel style={{ height: 14, width: "85%" }} />
            <Skel style={{ height: 14, width: "70%" }} />
          </div>
        </div>

        {/* Analysis card */}
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 32 }}>
          <Skel style={{ height: 22, width: "20%", marginBottom: 24 }} />
          <div style={{ display: "flex", gap: 40 }}>
            <Skel style={{ flex: 1, height: 240, borderRadius: 12 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Skel style={{ height: 14, width: "40%" }} />
                    <Skel style={{ height: 14, width: "20%" }} />
                  </div>
                  <Skel style={{ height: 6, borderRadius: 3 }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail cards */}
        <Skel style={{ height: 22, width: "25%" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Skel style={{ width: 40, height: 40, borderRadius: "50%" }} />
                <Skel style={{ height: 16, width: "50%" }} />
              </div>
              <Skel style={{ height: 14 }} />
              <Skel style={{ height: 14, width: "90%" }} />
              <Skel style={{ height: 14, width: "75%" }} />
              <Skel style={{ height: 14, width: "60%" }} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const CHART_COLORS: Record<string, { grid: string; tick: string }> = {
  "default":   { grid: "#1A3050", tick: "#8B9DB5" },
  "dark-gray": { grid: "#2A2A2A", tick: "#A1A1AA" },
  "light":     { grid: "#E2E8F0", tick: "#475569" },
}

export default function RaioXPage() {
  const router = useRouter()
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [animated, setAnimated] = useState(false)
  const [chartColors, setChartColors] = useState(CHART_COLORS["light"])
  const contentRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Diagnostico-Cineze-Pro",
  })

  useEffect(() => {
    function syncChartColors() {
      const t = document.documentElement.getAttribute("data-theme") || "light"
      setChartColors(CHART_COLORS[t] ?? CHART_COLORS["light"])
    }
    syncChartColors()
    const observer = new MutationObserver(syncChartColors)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    async function load() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completo")
        .eq("id", user.id)
        .single()

      const { data: diag } = await supabase
        .from("diagnosticos")
        .select("score_geral, nivel, resumo_executivo, score_visibilidade, score_captacao, score_conversao, score_posicionamento, raio_x")
        .eq("user_id", user.id)
        .eq("status", "concluido")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!diag?.raio_x) { 
        if (profile?.onboarding_completo) {
          setPageData({
            pendente: true,
            score_geral: 0, nivel: "Em Construção", resumo_executivo: "",
            score_visibilidade: 0, score_captacao: 0, score_conversao: 0, score_posicionamento: 0,
            pilares: {} as Pilares,
          })
          setLoading(false)
          return
        }
        router.replace("/onboarding")
        return 
      }

      setPageData({
        score_geral:          diag.score_geral ?? 0,
        nivel:                (diag.nivel ?? "Em Construção") as NivelDiagnostico,
        resumo_executivo:     diag.resumo_executivo ?? "",
        score_visibilidade:   diag.score_visibilidade ?? 0,
        score_captacao:       diag.score_captacao ?? 0,
        score_conversao:      diag.score_conversao ?? 0,
        score_posicionamento: diag.score_posicionamento ?? 0,
        pilares:              diag.raio_x as unknown as Pilares,
      })
      setLoading(false)
      setTimeout(() => setAnimated(true), 100)
    }

    load()
  }, [router])

  if (loading) return <SkeletonLayout />
  if (!pageData) return null

  if (pageData.pendente) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center", background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(6,183,216,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#06B7D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Relatório Pendente</h2>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", maxWidth: 400, marginBottom: 32 }}>
          Suas respostas foram salvas com sucesso, mas o diagnóstico ainda não foi gerado pela IA.
        </p>
        <button
          onClick={() => router.push("/loading")}
          style={{
            background: "linear-gradient(135deg, #0066FF, #06B7D8)",
            color: "#FFF",
            fontSize: 16,
            fontWeight: 600,
            padding: "16px 32px",
            border: "none",
            borderRadius: 12,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0, 102, 255, 0.2)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease"
          }}
        >
          Gerar Diagnóstico Agora
        </button>
      </div>
    )
  }

  const {
    score_geral, nivel, resumo_executivo,
    score_visibilidade, score_captacao, score_conversao, score_posicionamento,
    pilares,
  } = pageData

  const badge = badgeColors(nivel)
  const mainOffset = C_MAIN * (1 - score_geral / 10)

  const radarData = [
    { subject: "Visibilidade",   score: score_visibilidade,   fullMark: 10 },
    { subject: "Captação",       score: score_captacao,       fullMark: 10 },
    { subject: "Conversão",      score: score_conversao,      fullMark: 10 },
    { subject: "Posicionamento", score: score_posicionamento, fullMark: 10 },
  ]

  const pillarRows = [
    { label: "Visibilidade",   score: score_visibilidade },
    { label: "Captação",       score: score_captacao },
    { label: "Conversão",      score: score_conversao },
    { label: "Posicionamento", score: score_posicionamento },
  ]

  const details = [
    { label: "Visibilidade",   score: score_visibilidade,   pilar: pilares?.visibilidade },
    { label: "Captação",       score: score_captacao,       pilar: pilares?.captacao },
    { label: "Conversão",      score: score_conversao,      pilar: pilares?.conversao },
    { label: "Posicionamento", score: score_posicionamento, pilar: pilares?.posicionamento },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; }
          .print-container { padding: 0 !important; background: white !important; }
          .print-card { border: 1px solid #eee !important; box-shadow: none !important; break-inside: avoid; }
          .dl-top-header, .dl-sidebar { display: none !important; }
        }
      ` }} />

      <div className="flex flex-col gap-6">
        <div className="no-print flex justify-end mb-2">
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Baixar PDF
          </button>
        </div>

        <div ref={contentRef} className="print-container flex flex-col gap-24">
          <div
            className="print-card"
            style={{
              background: "var(--bg-surface)", border: "1px solid var(--border-color)",
              borderRadius: 16, padding: 32, display: "flex", gap: 40, alignItems: "center",
            }}
          >
            <div style={{ flexShrink: 0, position: "relative", width: 160, height: 160 }}>
              <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
                <defs>
                  <linearGradient id="rxGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0066FF" />
                    <stop offset="100%" stopColor="#06B7D8" />
                  </linearGradient>
                </defs>
                <circle cx="80" cy="80" r="70" fill="none" stroke="var(--border-color)" strokeWidth="12" />
                <circle
                  cx="80" cy="80" r="70" fill="none"
                  stroke="url(#rxGrad)" strokeWidth="12" strokeLinecap="round"
                  strokeDasharray={C_MAIN}
                  strokeDashoffset={animated ? mainOffset : C_MAIN}
                  style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
                />
              </svg>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                <div style={{ color: "var(--text-primary)", fontSize: 48, fontWeight: 700, lineHeight: 1 }}>{score_geral.toFixed(1)}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>de 10</div>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <span style={{ display: "block", color: "var(--text-secondary)", fontSize: 13, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px", marginBottom: 12 }}>Índice geral de presença digital</span>
              <span style={{ display: "inline-block", background: badge.bg, color: badge.color, padding: "6px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 24 }}>{nivel}</span>
              <p style={{ color: "var(--text-primary)", fontSize: 15, lineHeight: 1.6, margin: 0 }}>{resumo_executivo}</p>
            </div>
          </div>

          <div
            className="print-card"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-color)", borderRadius: 16, padding: 32 }}
          >
            <h2 style={{ color: "var(--text-primary)", fontSize: 18, fontWeight: 600, margin: "0 0 24px" }}>Análise por pilar</h2>
            <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke={chartColors.grid} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: chartColors.tick, fontSize: 12 }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="score" stroke="#0066FF" fill="#0066FF" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
                {pillarRows.map(p => (
                  <PillarRow key={p.label} label={p.label} score={p.score} animated={animated} />
                ))}
              </div>
            </div>
          </div>

          <h2 style={{ color: "var(--text-primary)", fontSize: 18, fontWeight: 600, margin: "8px 0 0" }}>Diagnóstico detalhado</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {details.map(d => (
              <DetailCard
                key={d.label}
                label={d.label}
                score={d.score}
                diagnostico={d.pilar?.diagnostico ?? ""}
                recomendacoes={d.pilar?.recomendacoes ?? []}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
