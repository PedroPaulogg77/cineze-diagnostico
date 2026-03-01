"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer,
} from "recharts"
import type { Pilares, NivelDiagnostico } from "@/types"

// ─── Constants ────────────────────────────────────────────────────────────────

const C_MAIN = 2 * Math.PI * 70  // ≈ 439.8
const C_MINI = 2 * Math.PI * 16  // ≈ 100.5
const CSS = `
  :root { --rx-padding: 24px; }
  @keyframes rx-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  .rx-detail-card { transition: all 0.2s ease; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
  .rx-detail-card:hover { transform: translateY(-2px); border-color: rgba(0, 102, 255, 0.3); box-shadow: 0 8px 24px rgba(0, 102, 255, 0.08); background: rgba(255, 255, 255, 0.04); }
  
  /* Mobile First Structure */
  .rx-score-container { display: flex; flex-direction: column; gap: 32px; align-items: center; text-align: center; }
  .rx-chart-container { display: flex; flex-direction: column; gap: 40px; align-items: center; }
  .rx-details-grid { display: flex; flex-direction: column; gap: 16px; }
  
  /* Desktop */
  @media(min-width: 1024px) {
    :root { --rx-padding: 32px; }
    .rx-score-container { flex-direction: row; gap: 48px; text-align: left; }
    .rx-chart-container { flex-direction: row; gap: 64px; }
    .rx-details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
  }
`

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageData {
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
  if (s < 4) return "var(--danger)"
  if (s < 7) return "#EAB308"
  return "var(--blue-primary)"
}

function badgeColors(nivel: NivelDiagnostico): { color: string; bg: string } {
  const map: Record<string, { color: string; bg: string }> = {
    "Presença Crítica": { color: "var(--danger)", bg: "rgba(239, 68, 68, 0.12)" },
    "Em Construção": { color: "#EAB308", bg: "rgba(234, 179, 8, 0.12)" },
    "Em Crescimento": { color: "var(--blue-primary)", bg: "rgba(0, 102, 255, 0.12)" },
    "Presença Sólida": { color: "var(--blue-primary)", bg: "rgba(0, 102, 255, 0.12)" },
    "Referência na região": { color: "var(--blue-primary)", bg: "rgba(0, 102, 255, 0.12)" },
  }
  return map[nivel] ?? { color: "#EAB308", bg: "rgba(234, 179, 8, 0.12)" }
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
        <span style={{ color: "var(--text-primary)", fontSize: 15, fontWeight: 600 }}>{label}</span>
        <span style={{ color, fontSize: 14, fontWeight: 700 }}>{score.toFixed(1)} <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>/ 10</span></span>
      </div>
      <div style={{ height: 6, background: "var(--bg-main)", borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            height: "100%", borderRadius: 3, background: color,
            width: animated ? `${score * 10}%` : "0%",
            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
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
      className="rx-detail-card"
      style={{ borderLeft: `6px solid ${color}` }}
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
        <div className="dl-glass-card" style={{ padding: "32px", display: "flex", gap: 40, alignItems: "center" }}>
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
        <div className="dl-glass-card" style={{ padding: "32px" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="rx-detail-card">
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
  "default": { grid: "#1A3050", tick: "#8B9DB5" },
  "dark-gray": { grid: "#2A2A2A", tick: "#A1A1AA" },
  "light": { grid: "#E5E7EB", tick: "#9CA3AF" },
}

export default function RaioXPage() {
  const router = useRouter()
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [animated, setAnimated] = useState(false)
  const [chartColors, setChartColors] = useState(CHART_COLORS["light"])

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
      const supabase = createBrowserSupabaseClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }

      const { data: diag } = await supabase
        .from("diagnosticos")
        .select("score_geral, nivel, resumo_executivo, score_visibilidade, score_captacao, score_conversao, score_posicionamento, raio_x")
        .eq("user_id", user.id)
        .eq("status", "concluido")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!diag?.raio_x) { router.replace("/onboarding"); return }

      setPageData({
        score_geral: diag.score_geral ?? 0,
        nivel: (diag.nivel ?? "Em Construção") as NivelDiagnostico,
        resumo_executivo: diag.resumo_executivo ?? "",
        score_visibilidade: diag.score_visibilidade ?? 0,
        score_captacao: diag.score_captacao ?? 0,
        score_conversao: diag.score_conversao ?? 0,
        score_posicionamento: diag.score_posicionamento ?? 0,
        pilares: diag.raio_x as unknown as Pilares,
      })
      setLoading(false)
      setTimeout(() => setAnimated(true), 100)
    }

    load()
  }, [router])

  if (loading) return <SkeletonLayout />
  if (!pageData) return null

  const {
    score_geral, nivel, resumo_executivo,
    score_visibilidade, score_captacao, score_conversao, score_posicionamento,
    pilares,
  } = pageData

  const badge = badgeColors(nivel)
  const mainOffset = C_MAIN * (1 - score_geral / 10)

  const radarData = [
    { subject: "Visibilidade", score: score_visibilidade, fullMark: 10 },
    { subject: "Captação", score: score_captacao, fullMark: 10 },
    { subject: "Conversão", score: score_conversao, fullMark: 10 },
    { subject: "Posicionamento", score: score_posicionamento, fullMark: 10 },
  ]

  const pillarRows = [
    { label: "Visibilidade", score: score_visibilidade },
    { label: "Captação", score: score_captacao },
    { label: "Conversão", score: score_conversao },
    { label: "Posicionamento", score: score_posicionamento },
  ]

  const details = [
    { label: "Visibilidade", score: score_visibilidade, pilar: pilares?.visibilidade },
    { label: "Captação", score: score_captacao, pilar: pilares?.captacao },
    { label: "Conversão", score: score_conversao, pilar: pilares?.conversao },
    { label: "Posicionamento", score: score_posicionamento, pilar: pilares?.posicionamento },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── BLOCO 1: SCORE GERAL ────────────────────────────────────────── */}
        <div className="dl-glass-card rx-score-container" style={{ padding: "var(--rx-padding)" }}>
          {/* Círculo animado */}
          <div style={{ flexShrink: 0, position: "relative", width: 160, height: 160, margin: "0 auto" }}>
            <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
              <defs>
                <linearGradient id="rxGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0066FF" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>
              <circle cx="80" cy="80" r="70" fill="none" stroke="var(--bg-main)" strokeWidth="12" />
              <circle
                cx="80" cy="80" r="70" fill="none"
                stroke="url(#rxGrad)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={C_MAIN}
                strokeDashoffset={animated ? mainOffset : C_MAIN}
                style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
              />
            </svg>
            <div
              style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)", textAlign: "center",
              }}
            >
              <div style={{ color: "var(--text-primary)", fontSize: 48, fontWeight: 700, lineHeight: 1 }}>
                {score_geral.toFixed(1)}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>de 10</div>
            </div>
          </div>

          {/* Info lateral */}
          <div style={{ flex: 1 }}>
            <span
              style={{
                display: "block", color: "var(--text-tertiary)", fontSize: 12,
                textTransform: "uppercase", fontWeight: 700, letterSpacing: "1px", marginBottom: 16,
              }}
            >
              Índice geral de presença digital
            </span>
            <span
              style={{
                display: "inline-flex", alignItems: "center", background: badge.bg, color: badge.color,
                padding: "6px 14px", borderRadius: 9999, fontSize: 13, fontWeight: 700, marginBottom: 24,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: badge.color, marginRight: 8 }} />
              {nivel}
            </span>
            <p style={{ color: "var(--text-primary)", fontSize: 15, lineHeight: 1.6, margin: 0 }}>
              {resumo_executivo}
            </p>
          </div>
        </div>

        {/* ── BLOCO 2: RADAR + BARRAS ─────────────────────────────────────── */}
        <div className="dl-glass-card" style={{ padding: "var(--rx-padding)" }}>
          <h2 style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 700, margin: "0 0 32px" }}>
            Análise por pilar
          </h2>
          <div className="rx-chart-container">
            {/* Radar Chart */}
            <div style={{ flex: 1, minHeight: 280, width: "100%" }}>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={chartColors.grid} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: chartColors.tick, fontSize: 12, fontWeight: 500 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar
                    name="Score" dataKey="score"
                    stroke="#0066FF" fill="#0066FF" fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Barras dos pilares */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
              {pillarRows.map(p => (
                <PillarRow key={p.label} label={p.label} score={p.score} animated={animated} />
              ))}
            </div>
          </div>
        </div>

        {/* ── BLOCO 3: DIAGNÓSTICO DETALHADO ──────────────────────────────── */}
        <h2 style={{ color: "var(--text-primary)", fontSize: 20, fontWeight: 700, margin: "16px 0 0" }}>
          Diagnóstico detalhado
        </h2>

        <div className="rx-details-grid">
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
    </>
  )
}
