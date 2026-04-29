"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type { Metrica, FrequenciaMetrica } from "@/types"
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts"

const FREQ_STYLE: Record<FrequenciaMetrica, { color: string; bg: string }> = {
  "diária":  { color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  "semanal": { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  "mensal":  { color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
}

const CHART_COLORS = ["#3B82F6", "#8B5CF6", "#06B7D8", "#22C55E", "#F97316", "#EAB308", "#EF4444"]

function Skeleton() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
      ` }} />
      <div className="rx-pulse" style={{ height: 28, width: 260, borderRadius: 8, background: "var(--border-color)", marginBottom: 8 }} />
      <div className="rx-pulse" style={{ height: 16, width: 340, borderRadius: 6, background: "var(--border-color)", marginBottom: 32 }} />
      <div className="rx-pulse" style={{ height: 220, borderRadius: 16, background: "var(--border-color)", marginBottom: 16 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {[1,2,3].map(i => (
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

      if (!row) { router.replace("/dashboard/raio-x"); return }

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
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
        .met-card { transition: transform .2s ease; }
        .met-card:hover { transform: translateY(-2px); }
        .met-tab { cursor: pointer; transition: background .15s, border-color .15s; }
      ` }} />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          Métricas de Acompanhamento
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          {list.length} indicadores para monitorar o progresso do seu diagnóstico
        </p>
      </div>

      {/* Chart card */}
      {chartData.length > 0 && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: 16,
            padding: "22px 24px",
            marginBottom: 20,
          }}
        >
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 20 }}>
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
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          className="met-tab"
          onClick={() => setFreqFiltro(null)}
          style={{
            background: freqFiltro === null ? "rgba(6,102,255,0.15)" : "var(--bg-surface)",
            border: `1px solid ${freqFiltro === null ? "rgba(6,102,255,0.4)" : "var(--border-color)"}`,
            borderRadius: 10, padding: "7px 14px",
            color: freqFiltro === null ? "#3B82F6" : "var(--text-secondary)",
            fontSize: 13, fontWeight: freqFiltro === null ? 600 : 400, cursor: "pointer",
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
                background: isActive ? st.bg : "var(--bg-surface)",
                border: `1px solid ${isActive ? st.color + "50" : "var(--border-color)"}`,
                borderRadius: 10, padding: "7px 14px",
                color: isActive ? st.color : "var(--text-secondary)",
                fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {f}
            </button>
          )
        })}
      </div>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {filtered.map((m, i) => {
          const freq = FREQ_STYLE[m.frequencia] ?? { color: "#8B9DB5", bg: "rgba(139,157,181,0.1)" }
          const color = CHART_COLORS[i % CHART_COLORS.length]

          return (
            <div
              key={i}
              className="met-card"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderTop: `2px solid ${color}`,
                borderRadius: 16,
                padding: "18px 20px",
              }}
            >
              {/* Name + frequency */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 14 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>{m.nome}</p>
                <span style={{
                  fontSize: 10, fontWeight: 600,
                  color: freq.color, background: freq.bg,
                  padding: "3px 8px", borderRadius: 20, flexShrink: 0,
                  textTransform: "capitalize",
                }}>
                  {m.frequencia}
                </span>
              </div>

              {/* Baseline → Meta */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-color)",
                borderRadius: 10, padding: "10px 12px",
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 2 }}>Baseline</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text-secondary)" }}>{m.baseline}</p>
                </div>
                <span style={{ fontSize: 20, color: color }}>→</span>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <p style={{ fontSize: 10, color: "var(--text-tertiary)", marginBottom: 2 }}>Meta</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color }}>{m.meta}</p>
                </div>
              </div>

              {/* Como medir */}
              {m.como_medir && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                    Como medir
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{m.como_medir}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <WhatsAppCTA
        headline="Métricas sem acompanhamento são só números"
        body="A Cineze monitora esses indicadores, otimiza o que não está performando e garante que você sempre saiba onde investir."
        waMessage="Olá! Vi as métricas do meu diagnóstico e quero entender como a Cineze pode me ajudar a acompanhar e melhorar esses resultados."
      />
    </div>
  )
}
