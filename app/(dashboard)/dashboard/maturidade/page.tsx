"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import type { MaturidadeCanal } from "@/types"

const STATUS_COLOR: Record<string, string> = {
  Inexistente: "var(--danger)",
  Básico: "var(--danger)",
  Intermediário: "#EAB308",
  Ativo: "var(--blue-primary)",
  Avançado: "var(--blue-primary)",
}

const STATUS_BG: Record<string, string> = {
  Inexistente: "rgba(239, 68, 68, 0.12)",
  Básico: "rgba(239, 68, 68, 0.12)",
  Intermediário: "rgba(234, 179, 8, 0.12)",
  Ativo: "rgba(0, 102, 255, 0.12)",
  Avançado: "rgba(0, 102, 255, 0.12)",
}

function scoreColor(s: number) {
  if (s < 4) return "var(--danger)"
  if (s < 7) return "#EAB308"
  return "var(--blue-primary)"
}

function getInitial(canal: string) {
  return canal.charAt(0).toUpperCase()
}

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-color)", padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div className="rx-pulse" style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--border-color)" }} />
              <div>
                <div className="rx-pulse" style={{ height: 16, width: 120, borderRadius: 6, background: "var(--border-color)", marginBottom: 6 }} />
                <div className="rx-pulse" style={{ height: 12, width: 80, borderRadius: 4, background: "var(--border-color)" }} />
              </div>
            </div>
            <div className="rx-pulse" style={{ height: 8, borderRadius: 4, background: "var(--border-color)", marginBottom: 12 }} />
            <div className="rx-pulse" style={{ height: 60, borderRadius: 8, background: "var(--border-color)" }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MaturidadePage() {
  const router = useRouter()
  const [canais, setCanais] = useState<MaturidadeCanal[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }

      const { data } = await supabase
        .from("diagnosticos")
        .select("maturidade")
        .eq("user_id", user.id)
        .eq("status", "concluido")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!data) { router.replace("/onboarding"); return }

      setCanais((data.maturidade as unknown as MaturidadeCanal[]) ?? [])
      setLoading(false)
      setTimeout(() => setAnimated(true), 100)
    }
    load()
  }, [router])

  if (loading) return <Skeleton />

  const avg = canais && canais.length > 0
    ? Math.round((canais.reduce((s, c) => s + (c.score ?? 0), 0) / canais.length) * 10) / 10
    : 0

  const avgColor = scoreColor(avg)

  return (
    <div className="mat-container">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
        .mat-bar { transition: width 1s cubic-bezier(.4,0,.2,1); }
        
        .mat-container { padding: 16px; }
        .mat-header { margin-bottom: 24px; }
        .mat-title { font-size: 20px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px; }
        .mat-subtitle { font-size: 14px; color: var(--text-secondary); }
        
        .mat-summary { display: flex; flex-direction: column; gap: 24px; padding: 24px; margin-bottom: 24px; }
        .mat-summary-score { display: flex; alignItems: center; gap: 16px; width: 100%; }
        .mat-summary-stats { display: flex; gap: 16px; flex-wrap: wrap; width: 100%; justify-content: space-between; }
        .mat-stat-item { text-align: center; flex: 1; min-width: 80px; }
        
        .mat-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        
        @media (min-width: 768px) {
          .mat-container { padding: 24px 28px; }
          .mat-header { margin-bottom: 32px; }
          .mat-title { font-size: 24px; }
          .mat-summary { flex-direction: row; align-items: center; gap: 32px; padding: 32px; margin-bottom: 32px; }
          .mat-summary-score { flex: 1; min-width: 200px; gap: 20px; }
          .mat-summary-stats { flex: 2; gap: 20px; justify-content: flex-start; }
          .mat-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
        }
      ` }} />

      {/* Header */}
      <div className="mat-header">
        <h1 className="mat-title">
          Maturidade Digital
        </h1>
        <p className="mat-subtitle">
          Nível de presença e performance em cada canal digital
        </p>
      </div>

      {/* Summary bar */}
      <div className="dl-glass-card mat-summary">
        <div className="mat-summary-score">
          <div style={{
            width: 64, height: 64, borderRadius: "50%",
            background: `${avgColor}1A`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: avgColor }}>{avg}</span>
          </div>
          <div>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>Score médio geral</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px", margin: 0 }}>
              {avg < 4 ? "Crítico" : avg < 6 ? "Básico" : avg < 8 ? "Intermediário" : "Avançado"}
            </p>
          </div>
        </div>
        <div className="mat-summary-stats">
          {Object.entries(STATUS_COLOR).map(([status, color]) => {
            const count = canais?.filter(c => c.status === status).length ?? 0
            return (
              <div key={status} className="mat-stat-item">
                <p style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px", color }}>{count}</p>
                <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0 }}>{status}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Canais grid */}
      <div className="mat-grid">
        {canais?.map((canal, idx) => {
          const color = scoreColor(canal.score ?? 0)
          const statusColor = STATUS_COLOR[canal.status] ?? "#8B9DB5"
          const statusBg = STATUS_BG[canal.status] ?? "rgba(139,157,181,0.12)"
          const pct = ((canal.score ?? 0) / 10) * 100

          return (
            <div
              key={idx}
              className="dl-glass-card"
              style={{ padding: 24 }}
            >
              {/* Card header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: statusBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 700, color: statusColor, flexShrink: 0,
                    border: `1px solid ${statusBg}`
                  }}>
                    {getInitial(canal.canal)}
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" }}>
                      {canal.canal}
                    </p>
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      fontSize: 12, fontWeight: 600,
                      color: statusColor,
                      background: statusBg,
                      padding: "4px 10px",
                      borderRadius: 9999,
                      border: "1px solid rgba(255,255,255,0.05)"
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, marginRight: 6 }} />
                      {canal.status}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: 24, fontWeight: 700, color }}>{canal.score ?? 0}</span>
              </div>

              {/* Score bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div
                    className="mat-bar"
                    style={{
                      height: "100%",
                      borderRadius: 3,
                      background: `linear-gradient(90deg, ${color}88, ${color})`,
                      width: animated ? `${pct}%` : "0%",
                    }}
                  />
                </div>
              </div>

              {/* Diagnóstico */}
              {canal.diagnostico && (
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 20 }}>
                  {canal.diagnostico}
                </p>
              )}

              {/* O que falta */}
              {canal.o_que_falta && canal.o_que_falta.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                    Próximos passos
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {canal.o_que_falta.slice(0, 3).map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 4,
                          border: "1.5px solid var(--border-color)",
                          flexShrink: 0, marginTop: 1,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <div style={{ width: 6, height: 6, borderRadius: 1, background: "var(--blue)" }} />
                        </div>
                        <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
