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
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)
const IconBarChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
)
const IconCursor = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 3l14 9-7 1-3 7-4-17z"/>
  </svg>
)
const IconGlobe = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IconArrowUp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
)
const IconBulb = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6"/><path d="M10 22h4"/>
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
  </svg>
)

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
      {[1,2,3].map(i => (
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
      color: "#22C55E",
      bg: "rgba(34,197,94,0.08)",
    },
    {
      label: "CPM Estimado",
      value: fmt(d.cpm_estimado),
      sub: "custo por mil impressões",
      icon: <IconBarChart />,
      color: "#3B82F6",
      bg: "rgba(59,130,246,0.08)",
    },
    {
      label: "CPC Estimado",
      value: fmt(d.cpc_estimado),
      sub: "custo por clique",
      icon: <IconCursor />,
      color: "#8B5CF6",
      bg: "rgba(139,92,246,0.08)",
    },
  ]

  return (
    <div style={{ padding: "24px 28px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
        .mkt-card { transition: transform .2s ease, box-shadow .2s ease; }
        .mkt-card:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.12); }
      ` }} />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          Análise de Mercado
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Panorama competitivo e oportunidades de crescimento no seu segmento
        </p>
      </div>

      {/* Panorama card */}
      <div
        className="mkt-card"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ color: "var(--text-secondary)" }}><IconGlobe /></span>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>Panorama do Mercado</h2>
        </div>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8 }}>{d.panorama}</p>
      </div>

      {/* Metrics row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16, marginBottom: 20 }}>
        {metrics.map(m => (
          <div
            key={m.label}
            className="mkt-card"
            style={{
              background: m.bg,
              border: `1px solid ${m.color}30`,
              borderRadius: 16,
              padding: "20px 22px",
            }}
          >
            <div style={{ marginBottom: 12, color: m.color }}>{m.icon}</div>
            <p style={{ fontSize: 22, fontWeight: 700, color: m.color, marginBottom: 4 }}>{m.value}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{m.label}</p>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Two-column row: Desafios + Oportunidade */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Desafios */}
        <div
          className="mkt-card"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: 16,
            padding: "22px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ color: "#F97316" }}><IconAlert /></span>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Desafios do Segmento</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {d.desafios?.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  flexShrink: 0, marginTop: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#EF4444",
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Oportunidade */}
        <div
          className="mkt-card"
          style={{
            background: "linear-gradient(135deg, rgba(6,102,255,0.08) 0%, rgba(6,183,216,0.08) 100%)",
            border: "1px solid rgba(6,183,216,0.2)",
            borderRadius: 16,
            padding: "22px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ color: "#06B7D8" }}><IconArrowUp /></span>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>Maior Oportunidade</h2>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8 }}>{d.oportunidade}</p>
          <div style={{
            marginTop: 18,
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(6,183,216,0.12)",
            border: "1px solid rgba(6,183,216,0.2)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ color: "#06B7D8", flexShrink: 0 }}><IconBulb /></span>
            <p style={{ fontSize: 12, color: "#06B7D8", fontWeight: 600 }}>
              Foque aqui nos próximos 30 dias para resultados mais rápidos
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
