"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import type { ObjetivoSMART } from "@/types"

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconTarget = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
)
const IconBarChart = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)
const IconTrendingUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
)
const IconStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
)

// ─── SMART Items ──────────────────────────────────────────────────────────────

const SMART_ITEMS = [
  { key: "especifico" as const, label: "Específico", icon: <IconTarget />, color: "var(--blue-dark)" },
  { key: "mensuravel" as const, label: "Mensurável", icon: <IconBarChart />, color: "var(--blue-primary)" },
  { key: "atingivel" as const, label: "Atingível", icon: <IconTrendingUp />, color: "var(--blue-light)" },
  { key: "relevante" as const, label: "Relevante", icon: <IconStar />, color: "var(--text-secondary)" },
  { key: "temporal" as const, label: "Temporal", icon: <IconClock />, color: "var(--blue-primary)" },
]

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
        <div key={i} className="rx-pulse" style={{ height: 180, borderRadius: 16, background: "var(--border-color)", marginBottom: 16 }} />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ObjetivosPage() {
  const router = useRouter()
  const [objetivos, setObjetivos] = useState<ObjetivoSMART[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number>(0)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }

      const { data: row } = await supabase
        .from("diagnosticos")
        .select("objetivos_smart")
        .eq("user_id", user.id)
        .eq("status", "concluido")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!row) { router.replace("/onboarding"); return }

      setObjetivos(row.objetivos_smart as unknown as ObjetivoSMART[])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <Skeleton />

  const list = objetivos ?? []

  return (
    <div className="obj-container">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
        .obj-tab { cursor: pointer; transition: background 0.15s ease, border-color 0.15s ease; color: var(--text-secondary); }
        .obj-tab:hover { background: var(--bg-surface-hover) !important; }
        .obj-tab.active { background: rgba(0,102,255,0.08) !important; border-color: rgba(0,102,255,0.3) !important; color: var(--blue-primary); font-weight: 600; }
        
        .obj-container { padding: 16px; }
        .obj-header { margin-bottom: 24px; }
        .obj-title { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px; }
        .obj-subtitle { font-size: 14px; color: var(--text-secondary); }
        
        .obj-legend { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
        
        .obj-banner { padding: 24px; border-bottom: 1px solid rgba(0,102,255,0.15); background: linear-gradient(135deg, rgba(0,102,255,0.06) 0%, rgba(77,148,255,0.02) 100%); }
        .obj-banner-content { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
        
        .obj-breakdown { padding: 24px; }
        .obj-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        
        @media (min-width: 768px) {
          .obj-container { padding: 24px 28px; }
          .obj-header { margin-bottom: 32px; }
          .obj-title { font-size: 24px; }
          .obj-legend { gap: 12px; margin-bottom: 32px; }
          .obj-banner { padding: 32px; }
          .obj-banner-content { flex-direction: row; gap: 16px; }
          .obj-breakdown { padding: 32px; }
          .obj-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
        }
      ` }} />

      {/* Layout Header manages the titles now */}

      {/* SMART Legend */}
      <div className="obj-legend">
        {SMART_ITEMS.map(s => (
          <div
            key={s.key}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              background: `rgba(0,102,255,0.06)`,
              border: `1px solid rgba(0,102,255,0.15)`,
              borderRadius: 20, padding: "6px 14px",
            }}
          >
            <span style={{ color: s.color, display: "flex", alignItems: "center" }}>{s.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      {list.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {list.map((obj, i) => (
            <button
              key={i}
              className={`obj-tab ${expanded === i ? "active" : ""}`}
              onClick={() => setExpanded(i)}
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border-color)",
                borderRadius: 12,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Objetivo {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Active objetivo */}
      {list.map((obj, i) => i !== expanded ? null : (
        <div
          key={i}
          className="dl-glass-card"
          style={{ overflow: "hidden" }}
        >
          {/* Title banner */}
          <div className="obj-banner">
            <div className="obj-banner-content">
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: "rgba(0,102,255,0.1)",
                border: "1px solid rgba(0,102,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 700, color: "var(--blue-primary)",
                flexShrink: 0,
              }}>
                {i + 1}
              </div>
              <div>
                <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
                  {obj.titulo}
                </p>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>{obj.meta}</p>
              </div>
            </div>
          </div>

          {/* SMART breakdown */}
          <div className="obj-breakdown">
            <div className="obj-grid">
              {SMART_ITEMS.map(s => {
                const text = obj[s.key]
                if (!text) return null
                return (
                  <div
                    key={s.key}
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid var(--border-color)",
                      borderLeft: `3px solid ${s.color}`,
                      borderRadius: 16,
                      padding: "20px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span style={{ color: s.color, display: "flex", alignItems: "center", padding: "6px", borderRadius: "8px", background: `rgba(0,102,255,0.08)` }}>{s.icon}</span>
                      <p style={{ fontSize: 13, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>
                        {s.label}
                      </p>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
