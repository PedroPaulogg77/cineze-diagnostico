"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type { AcaoPlano, PrioridadeAcao } from "@/types"

const PRIORIDADE_STYLE: Record<PrioridadeAcao, { color: string; bg: string; border: string }> = {
  Alta: { color: "var(--danger)", bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)" },
  Média: { color: "#EAB308", bg: "rgba(234, 179, 8, 0.12)", border: "rgba(234, 179, 8, 0.3)" },
  Baixa: { color: "var(--blue-primary)", bg: "rgba(0, 102, 255, 0.12)", border: "rgba(0, 102, 255, 0.3)" },
}

const SEMANA_COLOR = ["var(--blue-dark)", "var(--blue-primary)", "var(--blue-light)", "var(--text-tertiary)"]

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
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="rx-pulse" style={{ height: 120, borderRadius: 16, background: "var(--border-color)", marginBottom: 16 }} />
      ))}
    </div>
  )
}

export default function PlanoPage() {
  const router = useRouter()
  const [acoes, setAcoes] = useState<AcaoPlano[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [semanaAtiva, setSemanaAtiva] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

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
        .select("plano_acao")
        .eq("user_id", user.id)
        .eq("status", "concluido")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!row) { router.replace("/onboarding"); return }

      setAcoes(row.plano_acao as unknown as AcaoPlano[])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <Skeleton />

  const list = acoes ?? []
  const semanas = [1, 2, 3, 4] as const
  const filtered = semanaAtiva ? list.filter(a => a.semana === semanaAtiva) : list
  const altaCount = list.filter(a => a.prioridade === "Alta").length

  return (
    <div style={{ padding: "24px 28px" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
        .plano-tab { cursor: pointer; transition: background 0.15s ease, border-color 0.15s ease; }
        .plano-tab:hover { opacity: .85; }
      ` }} />

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
          Plano de Ação
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Roadmap personalizado — {list.length} ações em 4 semanas, {altaCount} de alta prioridade
        </p>
      </div>

      {/* Semana filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <button
          className="plano-tab"
          onClick={() => setSemanaAtiva(null)}
          style={{
            background: semanaAtiva === null ? "rgba(0,102,255,0.08)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${semanaAtiva === null ? "rgba(0,102,255,0.3)" : "var(--border-color)"}`,
            borderRadius: 12, padding: "10px 20px",
            color: semanaAtiva === null ? "var(--blue-primary)" : "var(--text-secondary)",
            fontSize: 14, fontWeight: semanaAtiva === null ? 600 : 500, cursor: "pointer",
          }}
        >
          Todas
        </button>
        {semanas.map(s => {
          const cnt = list.filter(a => a.semana === s).length
          const c = SEMANA_COLOR[s - 1]
          const isActive = semanaAtiva === s
          return (
            <button
              key={s}
              className="plano-tab"
              onClick={() => setSemanaAtiva(isActive ? null : s)}
              style={{
                background: isActive ? `rgba(0, 102, 255, 0.08)` : "rgba(255, 255, 255, 0.02)",
                border: `1px solid ${isActive ? `rgba(0, 102, 255, 0.3)` : "var(--border-color)"}`,
                borderRadius: 12, padding: "10px 20px",
                color: isActive ? "var(--blue-primary)" : "var(--text-secondary)",
                fontSize: 14, fontWeight: isActive ? 600 : 500, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              Semana {s}
              <span style={{
                fontSize: 12, background: isActive ? `rgba(0, 102, 255, 0.15)` : "rgba(255,255,255,0.06)",
                color: isActive ? "var(--blue-primary)" : "var(--text-tertiary)",
                padding: "2px 8px", borderRadius: 12,
              }}>
                {cnt}
              </span>
            </button>
          )
        })}
      </div>

      {/* Actions list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((acao) => {
          const pr = PRIORIDADE_STYLE[acao.prioridade] ?? PRIORIDADE_STYLE.Baixa
          const semColor = SEMANA_COLOR[(acao.semana ?? 1) - 1]
          const isOpen = expandedId === acao.numero

          return (
            <div
              key={acao.numero}
              className="dl-glass-card"
              onClick={() => setExpandedId(isOpen ? null : acao.numero)}
              style={{
                borderLeft: `3px solid ${semColor}`,
                overflow: "hidden",
                cursor: "pointer",
              }}
            >
              {/* Card header */}
              <div style={{ padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 16 }}>
                {/* Number badge */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `rgba(0, 102, 255, 0.1)`,
                  border: `1px solid rgba(0, 102, 255, 0.2)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: semColor,
                  flexShrink: 0,
                }}>
                  {acao.numero}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{acao.titulo}</p>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: pr.color, background: pr.bg,
                      padding: "4px 12px", borderRadius: 9999,
                    }}>
                      {acao.prioridade} prioridade
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 600,
                      color: semColor, background: `rgba(255, 255, 255, 0.05)`,
                      border: `1px solid rgba(255, 255, 255, 0.1)`,
                      padding: "4px 12px", borderRadius: 9999,
                    }}>
                      Semana {acao.semana}
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <span style={{
                  color: "var(--text-tertiary)", fontSize: 14, flexShrink: 0, marginTop: 2,
                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform .2s ease",
                }}>
                  ▼
                </span>
              </div>

              {/* Expanded content */}
              {isOpen && (
                <div style={{ padding: "0 24px 24px", borderTop: "1px solid var(--border-color)" }}>
                  <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 20 }}>

                    {/* Meta */}
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Meta</p>
                      <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>{acao.meta}</p>
                    </div>

                    {/* Por que agora */}
                    {acao.por_que_agora && (
                      <div style={{
                        background: "rgba(0,102,255,0.04)",
                        border: "1px solid rgba(0,102,255,0.15)",
                        borderRadius: 12, padding: "16px 20px",
                        display: "flex", alignItems: "flex-start", gap: 12,
                      }}>
                        <span style={{ fontSize: 16, flexShrink: 0, marginTop: 2 }}>⚡</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--blue-primary)", margin: "0 0 6px" }}>Por que agora?</p>
                          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{acao.por_que_agora}</p>
                        </div>
                      </div>
                    )}

                    {/* Passos */}
                    {acao.passos && acao.passos.length > 0 && (
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                          Passos de execução
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {acao.passos.map((passo, pi) => (
                            <div key={pi} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                              <div style={{
                                width: 24, height: 24, borderRadius: 8,
                                border: "1px solid var(--border-color)",
                                background: "var(--bg-main)",
                                flexShrink: 0, marginTop: 2,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 12, fontWeight: 700, color: "var(--text-tertiary)",
                              }}>
                                {pi + 1}
                              </div>
                              <span style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, flex: 1 }}>{passo}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
