"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type { Comunicacao, NivelProblema } from "@/types"

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconBulb = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6"/><path d="M10 22h4"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
)
const IconTarget = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const IconSpeaker = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
  </svg>
)
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

// ─── Constants ────────────────────────────────────────────────────────────────

const NIVEL_STYLE: Record<NivelProblema, { label: string; color: string; bg: string; border: string }> = {
  critico: { label: "Crítico",  color: "#EF4444", bg: "rgba(239,68,68,0.10)",  border: "rgba(239,68,68,0.3)" },
  moderado:{ label: "Moderado", color: "#F97316", bg: "rgba(249,115,22,0.10)", border: "rgba(249,115,22,0.3)" },
  leve:    { label: "Leve",     color: "#EAB308", bg: "rgba(234,179,8,0.10)",  border: "rgba(234,179,8,0.3)" },
}

function scoreColor(s: number) {
  if (s < 40) return "#EF4444"
  if (s < 60) return "#F97316"
  if (s < 80) return "#EAB308"
  return "#3B82F6"
}

const C = 2 * Math.PI * 42

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
      ` }} />
      <div className="rx-pulse" style={{ height: 28, width: 260, borderRadius: 8, background: "var(--border-color)", marginBottom: 8 }} />
      <div className="rx-pulse" style={{ height: 16, width: 340, borderRadius: 6, background: "var(--border-color)", marginBottom: 32 }} />
      <div className="rx-pulse" style={{ height: 180, borderRadius: 16, background: "var(--border-color)", marginBottom: 16 }} />
      {[1,2].map(i => (
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
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
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
    { icon: <IconBulb />,    label: "Proposta de Valor", text: d.proposta_de_valor },
    { icon: <IconTarget />,  label: "Tom de Voz",        text: d.tom_de_voz },
    { icon: <IconSpeaker />, label: "CTA Principal",     text: d.cta },
  ]

  const criticalCount = d.problemas?.filter(p => p.nivel === "critico").length ?? 0
  const moderadoCount = d.problemas?.filter(p => p.nivel === "moderado").length ?? 0
  const leveCount     = d.problemas?.filter(p => p.nivel === "leve").length ?? 0

  return (
    <div style={{ padding: "24px 28px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
        .com-card { transition: transform .2s ease; }
        .com-card:hover { transform: translateY(-2px); }
      ` }} />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          Auditoria de Comunicação
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Análise da identidade, mensagem e eficácia da sua comunicação com o mercado
        </p>
      </div>

      {/* Score + Análise Geral */}
      <div
        className="com-card"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 16,
          display: "flex",
          alignItems: "flex-start",
          gap: 28,
          flexWrap: "wrap",
        }}
      >
        {/* Circle */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <svg width={104} height={104} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={52} cy={52} r={42} fill="none" stroke="var(--border-color)" strokeWidth={8} />
            <circle
              cx={52} cy={52} r={42} fill="none"
              stroke={color} strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
            />
          </svg>
          <div style={{ marginTop: -80, marginBottom: 12, textAlign: "center", position: "relative", zIndex: 1 }}>
            <p style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{score}</p>
            <p style={{ fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>/ 100</p>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 36 }}>
            {criticalCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#EF4444", background: "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: 20 }}>
                {criticalCount} crítico{criticalCount > 1 ? "s" : ""}
              </span>
            )}
            {moderadoCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#F97316", background: "rgba(249,115,22,0.1)", padding: "2px 8px", borderRadius: 20 }}>
                {moderadoCount} moderado{moderadoCount > 1 ? "s" : ""}
              </span>
            )}
            {leveCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: "#EAB308", background: "rgba(234,179,8,0.1)", padding: "2px 8px", borderRadius: 20 }}>
                {leveCount} leve{leveCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Análise */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Análise Geral
          </p>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8 }}>{d.analise_geral}</p>
        </div>
      </div>

      {/* Brand cards row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16, marginBottom: 16 }}>
        {brandItems.map(item => item.text && (
          <div
            key={item.label}
            className="com-card"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              borderRadius: 16,
              padding: "18px 20px",
            }}
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
          className="com-card"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: 16,
            padding: "22px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span style={{ color: "var(--text-secondary)" }}><IconSearch /></span>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              Problemas Identificados
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                      background: st.bg,
                      border: `1px solid ${st.border}`,
                      borderLeft: `3px solid ${st.color}`,
                      borderRadius: 12,
                      padding: "14px 18px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{p.problema}</p>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: st.color, background: st.bg,
                        padding: "2px 10px", borderRadius: 20,
                        border: `1px solid ${st.border}`,
                        flexShrink: 0, marginLeft: 12,
                      }}>
                        {st.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ flexShrink: 0, marginTop: 1 }}><IconCheck /></span>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{p.solucao}</p>
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
