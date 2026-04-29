"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type { AcaoPlano, PrioridadeAcao } from "@/types"
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA"

const PRIORIDADE_STYLE: Record<PrioridadeAcao, { color: string; bg: string; border: string }> = {
  Alta:  { color: "#EF4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)" },
  Média: { color: "#F97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)" },
  Baixa: { color: "#3B82F6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
}

const SEMANA_COLOR = ["#3B82F6", "#8B5CF6", "#06B7D8", "#22C55E"]

function Skeleton() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
      ` }} />
      <div className="rx-pulse" style={{ height: 28, width: 260, borderRadius: 8, background: "var(--border-color)", marginBottom: 8 }} />
      <div className="rx-pulse" style={{ height: 16, width: 340, borderRadius: 6, background: "var(--border-color)", marginBottom: 32 }} />
      {[1,2,3,4].map(i => (
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

      if (!row) { router.replace("/dashboard/raio-x"); return }

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
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
        .plano-tab { cursor: pointer; transition: background .15s, border-color .15s; }
        .plano-tab:hover { opacity: .85; }
        .plano-card { transition: box-shadow .2s ease; cursor: pointer; }
        .plano-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,.3); }
      ` }} />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          Plano de Ação
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Roadmap personalizado — {list.length} ações em 4 semanas, {altaCount} de alta prioridade
        </p>
      </div>

      {/* Semana filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          className="plano-tab"
          onClick={() => setSemanaAtiva(null)}
          style={{
            background: semanaAtiva === null ? "rgba(6,102,255,0.15)" : "var(--bg-surface)",
            border: `1px solid ${semanaAtiva === null ? "rgba(6,102,255,0.4)" : "var(--border-color)"}`,
            borderRadius: 10, padding: "8px 16px",
            color: semanaAtiva === null ? "#3B82F6" : "var(--text-secondary)",
            fontSize: 13, fontWeight: semanaAtiva === null ? 600 : 400, cursor: "pointer",
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
                background: isActive ? `${c}18` : "var(--bg-surface)",
                border: `1px solid ${isActive ? `${c}50` : "var(--border-color)"}`,
                borderRadius: 10, padding: "8px 16px",
                color: isActive ? c : "var(--text-secondary)",
                fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              Semana {s}
              <span style={{
                fontSize: 11, background: isActive ? `${c}20` : "rgba(255,255,255,0.06)",
                color: isActive ? c : "var(--text-tertiary)",
                padding: "1px 6px", borderRadius: 10,
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
              className="plano-card"
              onClick={() => setExpandedId(isOpen ? null : acao.numero)}
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                borderLeft: `3px solid ${semColor}`,
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              {/* Card header */}
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 14 }}>
                {/* Number badge */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${semColor}18`,
                  border: `1px solid ${semColor}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, fontWeight: 700, color: semColor,
                  flexShrink: 0,
                }}>
                  {acao.numero}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{acao.titulo}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: pr.color, background: pr.bg,
                      border: `1px solid ${pr.border}`,
                      padding: "2px 8px", borderRadius: 20,
                    }}>
                      {acao.prioridade} prioridade
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: semColor, background: `${semColor}12`,
                      border: `1px solid ${semColor}30`,
                      padding: "2px 8px", borderRadius: 20,
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
                <div style={{ padding: "0 20px 20px", borderTop: "1px solid var(--border-color)" }}>
                  <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* Meta */}
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Meta</p>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7 }}>{acao.meta}</p>
                    </div>

                    {/* Por que agora */}
                    {acao.por_que_agora && (
                      <div style={{
                        background: "rgba(6,183,216,0.06)",
                        border: "1px solid rgba(6,183,216,0.15)",
                        borderRadius: 10, padding: "10px 14px",
                        display: "flex", alignItems: "flex-start", gap: 8,
                      }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>⚡</span>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 600, color: "#06B7D8", marginBottom: 3 }}>Por que agora?</p>
                          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{acao.por_que_agora}</p>
                        </div>
                      </div>
                    )}

                    {/* Passos */}
                    {acao.passos && acao.passos.length > 0 && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                          Passos de execução
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {acao.passos.map((passo, pi) => (
                            <div key={pi} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                              <div style={{
                                width: 20, height: 20, borderRadius: 6,
                                border: "1.5px solid var(--border-color)",
                                flexShrink: 0, marginTop: 1,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)",
                              }}>
                                {pi + 1}
                              </div>
                              <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{passo}</span>
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

      <WhatsAppCTA
        headline="Você tem o plano — falta quem execute"
        body="A Cineze coloca esse plano em prática com anúncios, conteúdo e estratégia. Sem você precisar aprender marketing do zero."
        buttonLabel="Quero que a Cineze execute"
        waMessage="Olá! Vi meu plano de ação no diagnóstico e quero que a Cineze me ajude a executar essas ações."
      />
    </div>
  )
}
