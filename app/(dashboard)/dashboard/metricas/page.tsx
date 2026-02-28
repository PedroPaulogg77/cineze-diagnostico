"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type { Metrica, FrequenciaMetrica } from "@/types"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts"

const FREQ_STYLE: Record<FrequenciaMetrica, { color: string; bg: string }> = {
  "diária": { color: "var(--blue-light)", bg: "rgba(77, 148, 255, 0.12)" },
  "semanal": { color: "var(--blue-primary)", bg: "rgba(0, 102, 255, 0.12)" },
  "mensal": { color: "var(--blue-dark)", bg: "rgba(0, 71, 179, 0.12)" },
}

const CHART_COLORS = ["var(--blue-primary)", "var(--blue-light)", "var(--blue-dark)", "rgba(0,102,255,0.7)", "rgba(77,148,255,0.7)", "rgba(0,71,179,0.7)"]

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
      <div className="rx-pulse" style={{ height: 220, borderRadius: 16, background: "var(--border-color)", marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="rx-pulse" style={{ height: 140, borderRadius: 16, background: "var(--border-color)" }} />
        ))}
      </div>
    </div>
  )
}

function parseNum(s: string): number {
  if (!s) return 0
  const n = parseFloat(s.replace(/[^0-9.,]/g, "").replace(",", "."))
  return isNaN(n) ? 0 : n
}

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { nome: string; baseline: string; meta: string } }>
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: "#0D1F35",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 10, padding: "10px 14px",
      fontSize: 12, color: "var(--text-primary)",
    }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.nome}</p>
      <p style={{ color: "var(--text-secondary)" }}>Baseline: {d.baseline}</p>
      <p style={{ color: "#22C55E" }}>Meta: {d.meta}</p>
    </div>
  )
}

export default function MetricasPage() {
  const router = useRouter()
  const [metricas, setMetricas] = useState<Metrica[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [freqFiltro, setFreqFiltro] = useState<FrequenciaMetrica | null>(null)

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
        .select("metricas")
        .eq("user_id", user.id)
        .eq("status", "concluido")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!row) { router.replace("/onboarding"); return }

      setMetricas(row.metricas as unknown as Metrica[])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <Skeleton />

  const list = metricas ?? []
  const filtered = freqFiltro ? list.filter(m => m.frequencia === freqFiltro) : list

  const chartData = list.map((m, i) => ({
    nome: m.nome.length > 20 ? m.nome.slice(0, 18) + "…" : m.nome,
    baseline: m.baseline,
    meta: m.meta,
    baselineVal: parseNum(m.baseline),
    metaVal: parseNum(m.meta),
    color: CHART_COLORS[i % CHART_COLORS.length],
  })).filter(d => d.metaVal > 0)

  const freqs: FrequenciaMetrica[] = ["diária", "semanal", "mensal"]

  return (
    <div style={{ padding: "24px 28px" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
        .met-tab { cursor: pointer; transition: background 0.15s ease, border-color 0.15s ease; }
        .met-tab:hover { opacity: .85; }
      ` }} />

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
          Métricas de Acompanhamento
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {list.length} indicadores para monitorar o progresso do seu diagnóstico
        </p>
      </div>

      {/* Chart card */}
      {chartData.length > 0 && (
        <div
          className="dl-glass-card"
          style={{
            padding: "32px",
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 24 }}>
            Baseline vs Meta
          </p>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="nome"
                  tick={{ fill: "#8B9DB5", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#8B9DB5", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="baselineVal" name="Baseline" radius={[4, 4, 0, 0]} opacity={0.5}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
                <Bar dataKey="metaVal" name="Meta" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Frequency filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button
          className="met-tab"
          onClick={() => setFreqFiltro(null)}
          style={{
            background: freqFiltro === null ? "rgba(0,102,255,0.08)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${freqFiltro === null ? "rgba(0,102,255,0.3)" : "var(--border-color)"}`,
            borderRadius: 12, padding: "10px 20px",
            color: freqFiltro === null ? "var(--blue-primary)" : "var(--text-secondary)",
            fontSize: 14, fontWeight: freqFiltro === null ? 600 : 500, cursor: "pointer",
          }}
        >
          Todas
        </button>
        {freqs.map(f => {
          const st = FREQ_STYLE[f]
          const isActive = freqFiltro === f
          return (
            <button
              key={f}
              className="met-tab"
              onClick={() => setFreqFiltro(isActive ? null : f)}
              style={{
                background: isActive ? `rgba(0, 102, 255, 0.08)` : "rgba(255,255,255,0.02)",
                border: `1px solid ${isActive ? "rgba(0, 102, 255, 0.3)" : "var(--border-color)"}`,
                borderRadius: 12, padding: "10px 20px",
                color: isActive ? "var(--blue-primary)" : "var(--text-secondary)",
                fontSize: 14, fontWeight: isActive ? 600 : 500, cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          )
        })}
      </div>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24 }}>
        {filtered.map((m, i) => {
          const freq = FREQ_STYLE[m.frequencia] ?? { color: "#8B9DB5", bg: "rgba(139,157,181,0.1)" }
          const color = CHART_COLORS[i % CHART_COLORS.length]
          return (
            <div
              key={i}
              className="dl-glass-card"
              style={{
                borderTop: `3px solid ${color}`,
                padding: "24px",
              }}
            >
              {/* Name + frequency */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4, margin: 0 }}>{m.nome}</p>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: freq.color, background: freq.bg,
                  padding: "4px 10px", borderRadius: 9999, flexShrink: 0,
                  textTransform: "capitalize",
                }}>
                  {m.frequencia}
                </span>
              </div>

              {/* Baseline → Meta */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-color)",
                borderRadius: 12, padding: "16px",
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Baseline</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "var(--text-secondary)", margin: 0 }}>{m.baseline}</p>
                </div>
                <span style={{ fontSize: 24, color: color }}>→</span>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <p style={{ fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Meta</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color, margin: 0 }}>{m.meta}</p>
                </div>
              </div>

              {/* Como medir */}
              {m.como_medir && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                    Como medir
                  </p>
                  <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{m.como_medir}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
