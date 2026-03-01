"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TendenciaMes { mes: string; cpm: number; cpc: number }

interface AnaliseMercado {
  panorama: string
  desafios: { titulo: string; descricao: string }[]
  investimento_midia: {
    valor_recomendado_min: number
    valor_recomendado_max: number
    descricao: string
    cpm: { valor_min: number; valor_max: number; contexto: string }
    cpc: { valor_min: number; valor_max: number; contexto: string }
    tendencia_6_meses: TendenciaMes[]
  }
  maior_oportunidade: { descricao: string; foco_30_dias: string }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function brl(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function brl2(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Icons ────────────────────────────────────────────────────────────────────

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
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" /><path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
  </svg>
)

// ─── Bar Chart (CSS only) ─────────────────────────────────────────────────────

function BarChart({ items, color }: { items: { mes: string; val: number }[]; color: string }) {
  const max = Math.max(...items.map(d => d.val), 1)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {items.map(({ mes, val }) => (
        <div key={mes} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 26, fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", flexShrink: 0 }}>{mes}</span>
          <div style={{ flex: 1, height: 7, background: "var(--border-color)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${(val / max) * 100}%`, height: "100%", background: color, borderRadius: 4 }} />
          </div>
          <span style={{ width: 56, fontSize: 11, color: "var(--text-secondary)", textAlign: "right", flexShrink: 0 }}>
            R${brl2(val)}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mer-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .mer-sk { animation: mer-pulse 1.6s ease-in-out infinite; background: var(--border-color); border-radius: 12px; }
      ` }} />
      <div className="mer-sk" style={{ height: 140 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="mer-sk" style={{ height: 120 }} />)}
      </div>
      <div className="mer-sk" style={{ height: 220 }} />
      <div className="mer-sk" style={{ height: 140 }} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MercadoPage() {
  const router = useRouter()
  const [data, setData] = useState<AnaliseMercado | null>(null)
  const [loading, setLoading] = useState(true)
  const [sliderValue, setSliderValue] = useState(500)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
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

      const am = row.analise_mercado as unknown as AnaliseMercado
      setData(am)
      setSliderValue(am?.investimento_midia?.valor_recomendado_min ?? 500)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <Skeleton />

  const d = data!
  const im = d.investimento_midia
  const tendencia = im?.tendencia_6_meses ?? []
  const paragraphs = (d.panorama ?? "").split(/\n\n+/).filter(Boolean)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mer-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        .mer-page { padding: 16px; display: flex; flex-direction: column; gap: 20px; }
        @media (min-width: 768px) { .mer-page { padding: 24px 28px; gap: 24px; } }

        .mer-section-title {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 16px;
        }
        .mer-section-title h2 {
          font-size: 17px; font-weight: 600;
          color: var(--text-primary); margin: 0;
        }

        .mer-icon-wrap {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }

        /* Desafios grid */
        .mer-desafios-grid {
          display: grid; grid-template-columns: 1fr; gap: 12px;
        }
        @media (min-width: 640px) {
          .mer-desafios-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
        }

        /* Investment layout */
        .mer-invest-layout {
          display: flex; flex-direction: column; gap: 24px;
        }
        @media (min-width: 900px) {
          .mer-invest-layout { flex-direction: row; gap: 32px; }
          .mer-invest-left  { flex: 0 0 38%; }
          .mer-invest-right { flex: 1; }
        }

        /* Slider */
        .mer-slider {
          -webkit-appearance: none; appearance: none;
          width: 100%; height: 6px; border-radius: 3px;
          background: var(--border-color); outline: none; cursor: pointer;
        }
        .mer-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: #0066FF; cursor: pointer;
          box-shadow: 0 0 0 4px rgba(0,102,255,0.15);
        }
        .mer-slider::-moz-range-thumb {
          width: 20px; height: 20px; border-radius: 50%; border: none;
          background: #0066FF; cursor: pointer;
        }
      ` }} />

      <div className="mer-page">

        {/* ── SEÇÃO 1: PANORAMA ──────────────────────────────────────────── */}
        <div className="dl-glass-card" style={{ padding: "24px 28px" }}>
          <div className="mer-section-title">
            <div className="mer-icon-wrap" style={{ background: "var(--blue-transparent)", color: "var(--blue-primary)" }}>
              <IconGlobe />
            </div>
            <h2>Panorama do Mercado</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {paragraphs.length > 0
              ? paragraphs.map((p, i) => (
                  <p key={i} style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.8, margin: 0 }}>{p}</p>
                ))
              : <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.8, margin: 0 }}>{d.panorama}</p>
            }
          </div>
        </div>

        {/* ── SEÇÃO 2: DESAFIOS ──────────────────────────────────────────── */}
        <div>
          <div className="mer-section-title">
            <div className="mer-icon-wrap" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>
              <IconAlert />
            </div>
            <h2>Desafios do Segmento</h2>
          </div>

          <div className="mer-desafios-grid">
            {(d.desafios ?? []).map((item, i) => (
              <div
                key={i}
                className="dl-glass-card"
                style={{ padding: "20px 22px" }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "#EF4444",
                  }}>
                    {i + 1}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px", lineHeight: 1.3 }}>
                      {typeof item === "string" ? item : item.titulo}
                    </p>
                    {typeof item !== "string" && item.descricao && (
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                        {item.descricao}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SEÇÃO 3: INVESTIMENTO EM MÍDIA ─────────────────────────────── */}
        {im && (
          <div className="dl-glass-card" style={{ padding: "24px 28px" }}>
            <div className="mer-section-title">
              <div className="mer-icon-wrap" style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h2>Investimento em Mídia no Setor</h2>
            </div>

            <div className="mer-invest-layout">

              {/* Coluna esquerda */}
              <div className="mer-invest-left">
                {/* Valor simulado */}
                <p style={{ fontSize: 40, fontWeight: 700, color: "#0066FF", margin: "0 0 4px", lineHeight: 1, letterSpacing: "-1px" }}>
                  R$ {brl(sliderValue)}
                </p>
                <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: "0 0 6px" }}>
                  Recomendado: R$ {brl(im.valor_recomendado_min)} — R$ {brl(im.valor_recomendado_max)}
                </p>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 24px", lineHeight: 1.5 }}>
                  {im.descricao}
                </p>

                {/* Slider */}
                <input
                  type="range"
                  min={500}
                  max={10000}
                  step={100}
                  value={sliderValue}
                  onChange={e => setSliderValue(Number(e.target.value))}
                  className="mer-slider"
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>R$ 500</span>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>R$ 10.000</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 8, textAlign: "center" }}>
                  Arraste para simular seu investimento
                </p>
              </div>

              {/* Coluna direita */}
              <div className="mer-invest-right" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* CPM */}
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>CPM</span>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>6 meses</span>
                    <span style={{ marginLeft: "auto", fontSize: 18, fontWeight: 700, color: "#0066FF" }}>
                      R$ {brl2(im.cpm.valor_max)}
                    </span>
                  </div>
                  <BarChart
                    items={tendencia.map(t => ({ mes: t.mes, val: t.cpm }))}
                    color="#0066FF"
                  />
                </div>

                {/* Separator */}
                <div style={{ height: 1, background: "var(--border-color)" }} />

                {/* CPC */}
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>CPC</span>
                    <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>6 meses</span>
                    <span style={{ marginLeft: "auto", fontSize: 18, fontWeight: 700, color: "#22C55E" }}>
                      R$ {brl2(im.cpc.valor_max)}
                    </span>
                  </div>
                  <BarChart
                    items={tendencia.map(t => ({ mes: t.mes, val: t.cpc }))}
                    color="#22C55E"
                  />
                </div>

                {/* Contexto */}
                {im.cpm.contexto && (
                  <p style={{ fontSize: 12, color: "var(--text-tertiary)", margin: 0 }}>
                    Referência para: {im.cpm.contexto}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── SEÇÃO 4: MAIOR OPORTUNIDADE ────────────────────────────────── */}
        {d.maior_oportunidade && (
          <div
            className="dl-glass-card"
            style={{
              padding: "24px 28px",
              borderColor: "rgba(0,102,255,0.2)",
              background: "linear-gradient(135deg, rgba(0,102,255,0.05) 0%, rgba(77,148,255,0.02) 100%)",
            }}
          >
            <div className="mer-section-title">
              <div className="mer-icon-wrap" style={{ background: "rgba(0,102,255,0.1)", color: "var(--blue-primary)" }}>
                <IconArrowUp />
              </div>
              <h2>Maior Oportunidade</h2>
            </div>

            <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.8, margin: "0 0 20px" }}>
              {d.maior_oportunidade.descricao}
            </p>

            <div style={{
              padding: "16px 20px", borderRadius: 12,
              background: "rgba(0,102,255,0.08)", border: "1px solid rgba(0,102,255,0.2)",
              display: "flex", alignItems: "flex-start", gap: 12,
            }}>
              <span style={{ color: "var(--blue-primary)", flexShrink: 0, marginTop: 1 }}>
                <IconBulb />
              </span>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--blue-primary)", margin: 0, lineHeight: 1.5 }}>
                Foque aqui nos próximos 30 dias: {d.maior_oportunidade.foco_30_dias}
              </p>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
