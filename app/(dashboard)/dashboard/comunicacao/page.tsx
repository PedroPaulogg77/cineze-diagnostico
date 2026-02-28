"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import type { Comunicacao, NivelProblema } from "@/types"

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconBulb = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" /><path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </svg>
)
const IconTarget = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
)
const IconSpeaker = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
)
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// ─── Constants ────────────────────────────────────────────────────────────────

const NIVEL_STYLE: Record<NivelProblema, { label: string; color: string; bg: string; border: string }> = {
  critico: { label: "Crítico", color: "var(--danger)", bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)" },
  moderado: { label: "Moderado", color: "#EAB308", bg: "rgba(234, 179, 8, 0.12)", border: "rgba(234, 179, 8, 0.3)" },
  leve: { label: "Leve", color: "var(--blue-primary)", bg: "rgba(0, 102, 255, 0.12)", border: "rgba(0, 102, 255, 0.3)" },
}

function scoreColor(s: number) {
  if (s < 40) return "var(--danger)"
  if (s < 70) return "#EAB308"
  return "var(--blue-primary)"
}

const C = 2 * Math.PI * 42

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
      ` }} />
      <div className="rx-pulse" style={{ height: 28, width: 260, borderRadius: 8, background: "var(--border-color)", marginBottom: 8 }} />
      <div className="rx-pulse" style={{ height: 16, width: 340, borderRadius: 6, background: "var(--border-color)", marginBottom: 32 }} />
      <div className="rx-pulse" style={{ height: 180, borderRadius: 16, background: "var(--border-color)", marginBottom: 16 }} />
      {[1, 2].map(i => (
        <div key={i} className="rx-pulse" style={{ height: 90, borderRadius: 16, background: "var(--border-color)", marginBottom: 16 }} />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComunicacaoPage() {
  const router = useRouter()
  const [data, setData] = useState<Comunicacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }

      const { data: row } = await supabase
        .from("diagnosticos")
        .select("comunicacao")
        .eq("user_id", user.id)
        .eq("status", "concluido")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!row) { router.replace("/onboarding"); return }

      setData(row.comunicacao as unknown as Comunicacao)
      setLoading(false)
      setTimeout(() => setAnimated(true), 100)
    }
    load()
  }, [router])

  if (loading) return <Skeleton />

  const d = data!
  const score = d.score ?? 0
  const color = scoreColor(score)
  const offset = animated ? C * (1 - score / 100) : C

  const brandItems = [
    { icon: <IconBulb />, label: "Proposta de Valor", text: d.proposta_de_valor },
    { icon: <IconTarget />, label: "Tom de Voz", text: d.tom_de_voz },
    { icon: <IconSpeaker />, label: "CTA Principal", text: d.cta },
  ]

  const criticalCount = d.problemas?.filter(p => p.nivel === "critico").length ?? 0
  const moderadoCount = d.problemas?.filter(p => p.nivel === "moderado").length ?? 0
  const leveCount = d.problemas?.filter(p => p.nivel === "leve").length ?? 0

  return (
    <div style={{ padding: "24px 28px" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
      ` }} />

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
          Auditoria de Comunicação
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Análise da identidade, mensagem e eficácia da sua comunicação com o mercado
        </p>
      </div>

      {/* Score + Análise Geral */}
      <div
        className="dl-glass-card"
        style={{
          padding: "32px",
          marginBottom: 24,
          display: "flex",
          alignItems: "flex-start",
          gap: 40,
          flexWrap: "wrap",
        }}
      >
        {/* Circle */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <svg width={104} height={104} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={52} cy={52} r={42} fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth={8} />
            <circle
              cx={52} cy={52} r={42} fill="none"
              stroke={color} strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
            />
          </svg>
          <div style={{ marginTop: -80, marginBottom: 12, textAlign: "center", position: "relative", zIndex: 1 }}>
            <p style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{score}</p>
            <p style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>/ 100</p>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 36 }}>
            {criticalCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", background: "rgba(239, 68, 68, 0.15)", padding: "2px 8px", borderRadius: 20 }}>
                {criticalCount} crítico{criticalCount > 1 ? "s" : ""}
              </span>
            )}
            {moderadoCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", background: "rgba(249, 115, 22, 0.15)", padding: "2px 8px", borderRadius: 20 }}>
                {moderadoCount} moderado{moderadoCount > 1 ? "s" : ""}
              </span>
            )}
            {leveCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--blue-primary)", background: "rgba(0, 102, 255, 0.15)", padding: "2px 8px", borderRadius: 20 }}>
                {leveCount} leve{leveCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Análise */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
            Análise Geral
          </p>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{d.analise_geral}</p>
        </div>
      </div>

      {/* Brand cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24, marginBottom: 24 }}>
        {brandItems.map(item => item.text && (
          <div
            key={item.label}
            className="dl-glass-card"
            style={{ padding: "24px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ color: "var(--text-secondary)" }}>{item.icon}</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {item.label}
              </p>
            </div>
            <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.7 }}>{item.text}</p>
          </div>
        ))}
      </div>

      {/* Problemas */}
      {d.problemas && d.problemas.length > 0 && (
        <div
          className="dl-glass-card"
          style={{ padding: "32px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", border: "1px solid var(--border-color)" }}>
              <IconSearch />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Problemas Identificados
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
            {d.problemas
              .sort((a, b) => {
                const order: Record<NivelProblema, number> = { critico: 0, moderado: 1, leve: 2 }
                return order[a.nivel] - order[b.nivel]
              })
              .map((p, i) => {
                const st = NIVEL_STYLE[p.nivel] ?? NIVEL_STYLE.leve
                return (
                  <div
                    key={i}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border-color)",
                      borderRadius: 16,
                      padding: "20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 6, background: st.bg, color: st.color, flexShrink: 0 }}>
                          <IconSearch />
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px", lineHeight: 1.4 }}>{p.problema}</p>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: st.color, background: st.bg,
                        padding: "4px 10px", borderRadius: 9999,
                        flexShrink: 0,
                      }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "rgba(0,102,255,0.04)", padding: 16, borderRadius: 12, border: "1px solid rgba(0,102,255,0.15)" }}>
                      <span style={{ flexShrink: 0, marginTop: 2 }}><IconCheck /></span>
                      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{p.solucao}</p>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
