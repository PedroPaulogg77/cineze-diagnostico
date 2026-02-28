"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type { AnaliseMercado } from "@/types"

function fmt(value: number, prefix = "R$") {
  if (!value) return "—"
  return `${prefix} ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconMoney = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
)
const IconBarChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)
const IconCursor = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3l14 9-7 1-3 7-4-17z" />
  </svg>
)
const IconGlobe = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
)
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconArrowUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
  </svg>
)
const IconBulb = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" /><path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </svg>
)

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
      {[1, 2, 3].map(i => (
        <div key={i} className="rx-pulse" style={{ height: 80, borderRadius: 16, background: "var(--border-color)", marginBottom: 16 }} />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MercadoPage() {
  const router = useRouter()
  const [data, setData] = useState<AnaliseMercado | null>(null)
  const [loading, setLoading] = useState(true)

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
        .select("analise_mercado")
        .eq("user_id", user.id)
        .eq("status", "concluido")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!row) { router.replace("/onboarding"); return }

      setData(row.analise_mercado as unknown as AnaliseMercado)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <Skeleton />

  const d = data!

  const metrics = [
    {
      label: "Investimento Mensal Recomendado",
      value: fmt(d.investimento_mensal_recomendado),
      sub: "para tráfego pago e mídia",
      icon: <IconMoney />,
      color: "var(--blue-dark)",
      bg: "rgba(0, 71, 179, 0.08)",
    },
    {
      label: "CPM Estimado",
      value: fmt(d.cpm_estimado),
      sub: "custo por mil impressões",
      icon: <IconBarChart />,
      color: "var(--blue-primary)",
      bg: "rgba(0, 102, 255, 0.08)",
    },
    {
      label: "CPC Estimado",
      value: fmt(d.cpc_estimado),
      sub: "custo por clique",
      icon: <IconCursor />,
      color: "var(--blue-light)",
      bg: "rgba(77, 148, 255, 0.08)",
    },
  ]

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
          Análise de Mercado
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Panorama competitivo e oportunidades de crescimento no seu segmento
        </p>
      </div>

      {/* Panorama card */}
      <div
        className="dl-glass-card"
        style={{
          padding: "32px",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
            <IconGlobe />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Panorama do Mercado</h2>
        </div>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{d.panorama}</p>
      </div>

      {/* Metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24, marginBottom: 24 }}>
        {metrics.map(m => (
          <div
            key={m.label}
            className="dl-glass-card"
            style={{
              padding: "24px",
              border: `1px solid ${m.color}20`,
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: m.bg, opacity: 0.5, pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ marginBottom: 16, color: m.color, background: "var(--bg-surface)", width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>{m.icon}</div>
              <p style={{ fontSize: 28, fontWeight: 800, color: m.color, margin: "0 0 6px", letterSpacing: "-0.5px" }}>{m.value}</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>{m.label}</p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column row: Desafios + Oportunidade */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Desafios */}
        <div
          className="dl-glass-card"
          style={{ padding: "32px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--danger)" }}>
              <IconAlert />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Desafios do Segmento</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {d.desafios?.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  flexShrink: 0, marginTop: 2,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700, color: "#EF4444",
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Oportunidade */}
        <div
          className="dl-glass-card"
          style={{
            background: "linear-gradient(135deg, rgba(0,102,255,0.06) 0%, rgba(77,148,255,0.02) 100%)",
            border: "1px solid rgba(0,102,255,0.15)",
            padding: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,102,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue-primary)" }}>
              <IconArrowUp />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Maior Oportunidade</h2>
          </div>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{d.oportunidade}</p>
          <div style={{
            marginTop: 24,
            padding: "16px 20px",
            borderRadius: 12,
            background: "rgba(0,102,255,0.08)",
            border: "1px solid rgba(0,102,255,0.15)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ color: "var(--blue-primary)", flexShrink: 0 }}><IconBulb /></span>
            <p style={{ fontSize: 14, color: "var(--blue-primary)", fontWeight: 600, margin: 0 }}>
              Foque aqui nos próximos 30 dias para resultados mais rápidos
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
