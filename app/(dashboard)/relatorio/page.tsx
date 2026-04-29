"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type {
  NivelDiagnostico, Pilares, MaturidadeCanal, AnaliseMercado,
  SobreEmpresa, Comunicacao, ObjetivoSMART, AcaoPlano, Metrica,
  NivelProblema, PrioridadeAcao,
} from "@/types"

// ─── Color helpers ────────────────────────────────────────────────────────────

function scoreColor(s: number): string {
  if (s < 4) return "#DC2626"
  if (s < 6) return "#EA580C"
  if (s < 7.5) return "#D97706"
  return "#2563EB"
}

function scoreColorMat(s: number): string {
  if (s < 4) return "#DC2626"
  if (s < 6) return "#EA580C"
  if (s < 7.5) return "#D97706"
  return "#2563EB"
}

function nivelStyle(nivel: NivelDiagnostico): { bg: string; color: string; border: string } {
  const m: Record<string, { bg: string; color: string; border: string }> = {
    "Presença Crítica":     { color: "#DC2626", bg: "#FEF2F2", border: "#FECACA" },
    "Em Construção":        { color: "#EA580C", bg: "#FFF7ED", border: "#FED7AA" },
    "Em Crescimento":       { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
    "Presença Sólida":      { color: "#2563EB", bg: "#EFF6FF", border: "#BFDBFE" },
    "Referência na região": { color: "#16A34A", bg: "#F0FDF4", border: "#BBF7D0" },
  }
  return m[nivel] ?? { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" }
}

function nivelStyleMat(status: string): { bg: string; color: string } {
  const m: Record<string, { bg: string; color: string }> = {
    "Inexistente":    { color: "#DC2626", bg: "#FEF2F2" },
    "Básico":         { color: "#EA580C", bg: "#FFF7ED" },
    "Intermediário":  { color: "#D97706", bg: "#FFFBEB" },
    "Ativo":          { color: "#2563EB", bg: "#EFF6FF" },
    "Avançado":       { color: "#16A34A", bg: "#F0FDF4" },
  }
  return m[status] ?? { color: "#6B7280", bg: "#F9FAFB" }
}

function nivelProblemaStyle(nivel: NivelProblema): { color: string; bg: string; label: string } {
  const m: Record<NivelProblema, { color: string; bg: string; label: string }> = {
    critico:  { color: "#DC2626", bg: "#FEF2F2", label: "Crítico" },
    moderado: { color: "#EA580C", bg: "#FFF7ED", label: "Moderado" },
    leve:     { color: "#D97706", bg: "#FFFBEB", label: "Leve" },
  }
  return m[nivel] ?? m.leve
}

function prioStyle(p: PrioridadeAcao): { color: string; bg: string } {
  const m: Record<PrioridadeAcao, { color: string; bg: string }> = {
    Alta:  { color: "#DC2626", bg: "#FEF2F2" },
    Média: { color: "#EA580C", bg: "#FFF7ED" },
    Baixa: { color: "#2563EB", bg: "#EFF6FF" },
  }
  return m[p] ?? m.Baixa
}

function semanaColor(s: number): string {
  return ["#2563EB", "#7C3AED", "#06B7D8", "#16A34A"][s - 1] ?? "#2563EB"
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—"
  try {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  } catch { return "—" }
}

function fmtMoney(v: number): string {
  if (!v) return "—"
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

// ─── SVG Score Arc ────────────────────────────────────────────────────────────

function ScoreArc({ score, size = 88 }: { score: number; size?: number }) {
  const cx = size / 2
  const r = size * 0.37
  const C = 2 * Math.PI * r
  const offset = C * (1 - score / 10)
  const color = scoreColor(score)
  const sw = size * 0.1

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#E5E7EB" strokeWidth={sw} />
      <circle
        cx={cx} cy={cx} r={r} fill="none"
        stroke={color} strokeWidth={sw} strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <text x={cx} y={cx - 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.24} fontWeight="700" fill="#111827" fontFamily="system-ui,sans-serif">
        {score.toFixed(1)}
      </text>
      <text x={cx} y={cx + size * 0.18} textAnchor="middle" dominantBaseline="middle"
        fontSize={size * 0.11} fill="#6B7280" fontFamily="system-ui,sans-serif">
        de 10
      </text>
    </svg>
  )
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score * 10}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 28, textAlign: "right" }}>
        {score.toFixed(1)}
      </span>
    </div>
  )
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4, fontFamily: "system-ui,sans-serif" }}>
        {num}
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 10px", fontFamily: "system-ui,sans-serif" }}>
        {title}
      </h2>
      <div style={{ height: 3, width: 48, background: "linear-gradient(90deg, #0066FF, #06B7D8)", borderRadius: 2 }} />
    </div>
  )
}

// ─── Data type ─────────────────────────────────────────────────────────────────

interface RelatData {
  nome_negocio: string
  nome_responsavel: string
  concluido_at: string | null
  score_geral: number
  score_visibilidade: number
  score_captacao: number
  score_conversao: number
  score_posicionamento: number
  score_comunicacao: number
  nivel: NivelDiagnostico
  resumo_executivo: string
  pilares: Pilares
  maturidade: MaturidadeCanal[]
  analise_mercado: AnaliseMercado | null
  sobre_empresa: SobreEmpresa | null
  comunicacao: Comunicacao | null
  objetivos_smart: ObjetivoSMART[]
  plano_acao: AcaoPlano[]
  metricas: Metrica[]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PRINT_CSS = `
  @page { size: A4 portrait; margin: 18mm 16mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  @media print {
    .no-print { display: none !important; }
    body { background: white !important; margin: 0; padding: 0; }
    .pdf-break { break-before: page; page-break-before: always; }
    .pdf-avoid { break-inside: avoid; page-break-inside: avoid; }
  }
  @media screen {
    body { background: #F0F2F5; }
  }
`

export default function RelatorioPage() {
  const router = useRouter()
  const [data, setData] = useState<RelatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }

      const [{ data: profile }, { data: diag }] = await Promise.all([
        supabase
          .from("profiles")
          .select("nome_negocio, nome_responsavel")
          .eq("id", user.id)
          .single(),
        supabase
          .from("diagnosticos")
          .select("score_geral, score_visibilidade, score_captacao, score_conversao, score_posicionamento, score_comunicacao, nivel, resumo_executivo, raio_x, maturidade, analise_mercado, sobre_empresa, comunicacao, objetivos_smart, plano_acao, metricas, concluido_at")
          .eq("user_id", user.id)
          .eq("status", "concluido")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      if (!diag) { setError(true); setLoading(false); return }

      setData({
        nome_negocio:      profile?.nome_negocio     ?? "Meu Negócio",
        nome_responsavel:  profile?.nome_responsavel ?? "",
        concluido_at:      diag.concluido_at,
        score_geral:       diag.score_geral       ?? 0,
        score_visibilidade:diag.score_visibilidade ?? 0,
        score_captacao:    diag.score_captacao     ?? 0,
        score_conversao:   diag.score_conversao    ?? 0,
        score_posicionamento: diag.score_posicionamento ?? 0,
        score_comunicacao: diag.score_comunicacao  ?? 0,
        nivel:             (diag.nivel ?? "Em Construção") as NivelDiagnostico,
        resumo_executivo:  diag.resumo_executivo   ?? "",
        pilares:           (diag.raio_x            as unknown as Pilares)           ?? {} as Pilares,
        maturidade:        (diag.maturidade        as unknown as MaturidadeCanal[]) ?? [],
        analise_mercado:   (diag.analise_mercado   as unknown as AnaliseMercado)    ?? null,
        sobre_empresa:     (diag.sobre_empresa     as unknown as SobreEmpresa)      ?? null,
        comunicacao:       (diag.comunicacao       as unknown as Comunicacao)       ?? null,
        objetivos_smart:   (diag.objetivos_smart   as unknown as ObjetivoSMART[])   ?? [],
        plano_acao:        (diag.plano_acao        as unknown as AcaoPlano[])       ?? [],
        metricas:          (diag.metricas          as unknown as Metrica[])         ?? [],
      })
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F0F2F5", fontFamily: "system-ui,sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #E5E7EB", borderTopColor: "#0066FF", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: "#6B7280", fontSize: 14 }}>Carregando relatório…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F0F2F5", fontFamily: "system-ui,sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#DC2626", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Diagnóstico não encontrado</p>
          <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 24 }}>Gere um diagnóstico primeiro para exportar o relatório.</p>
          <button onClick={() => router.push("/dashboard/raio-x")} style={{ background: "#0066FF", color: "#fff", padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    )
  }

  const {
    nome_negocio, nome_responsavel, concluido_at, score_geral,
    score_visibilidade, score_captacao, score_conversao, score_posicionamento,
    nivel, resumo_executivo, pilares, maturidade, analise_mercado,
    sobre_empresa, comunicacao, objetivos_smart, plano_acao, metricas,
  } = data

  const nsty = nivelStyle(nivel)

  const pilaresArr = [
    { label: "Visibilidade",   score: score_visibilidade,   pilar: pilares?.visibilidade },
    { label: "Captação",       score: score_captacao,       pilar: pilares?.captacao },
    { label: "Conversão",      score: score_conversao,      pilar: pilares?.conversao },
    { label: "Posicionamento", score: score_posicionamento, pilar: pilares?.posicionamento },
  ]

  const matSorted = [...maturidade].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))

  const planoByWeek: Record<number, AcaoPlano[]> = {}
  for (const a of plano_acao) {
    if (!planoByWeek[a.semana]) planoByWeek[a.semana] = []
    planoByWeek[a.semana].push(a)
  }

  const S: React.CSSProperties = {
    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
    fontSize: 14,
    lineHeight: 1.6,
    color: "#111827",
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* ── Floating toolbar (screen only) ─────────────────────────────────── */}
      <div
        className="no-print"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "white", borderBottom: "1px solid #E5E7EB",
          padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => router.back()}
            style={{ background: "none", border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Voltar
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
            Relatório · {nome_negocio}
          </span>
        </div>
        <button
          onClick={() => window.print()}
          style={{
            background: "linear-gradient(135deg, #0066FF, #06B7D8)",
            color: "white", border: "none", borderRadius: 8,
            padding: "9px 20px", cursor: "pointer",
            fontSize: 14, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 2px 8px rgba(0,102,255,0.3)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Salvar como PDF
        </button>
      </div>

      {/* ── Report body ────────────────────────────────────────────────────── */}
      <div style={{ paddingTop: 64, background: "#F0F2F5", minHeight: "100vh" }} className="no-print-bg">
        <style dangerouslySetInnerHTML={{ __html: `@media print { .no-print-bg { padding-top: 0 !important; background: white !important; } }` }} />

        <div style={{
          ...S,
          maxWidth: 820,
          margin: "0 auto",
          background: "white",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}>

          {/* ── CAPA ─────────────────────────────────────────────────────── */}
          <div className="pdf-avoid" style={{ minHeight: 680, padding: "0 0 48px", display: "flex", flexDirection: "column" }}>

            {/* Top gradient bar */}
            <div style={{ height: 8, background: "linear-gradient(135deg, #0066FF 0%, #06B7D8 100%)" }} />

            {/* Logo row */}
            <div style={{ padding: "32px 48px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px" }}>
                cineze<span style={{ color: "#0066FF" }}>.</span>
              </span>
              <span style={{ fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                Diagnóstico de Presença Digital
              </span>
            </div>

            {/* Business + date */}
            <div style={{ padding: "48px 48px 0", flex: 1 }}>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "#9CA3AF", marginBottom: 8 }}>
                Relatório gerado para
              </p>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: "#111827", marginBottom: 6, letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                {nome_negocio}
              </h1>
              {nome_responsavel && (
                <p style={{ fontSize: 15, color: "#6B7280", marginBottom: 4 }}>{nome_responsavel}</p>
              )}
              <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 48 }}>
                Gerado em {fmtDate(concluido_at)}
              </p>

              {/* Score hero */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 40 }}>
                <div style={{ flexShrink: 0 }}>
                  <ScoreArc score={score_geral} size={140} />
                  <p style={{ fontSize: 11, color: "#9CA3AF", textAlign: "center", marginTop: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Índice Geral
                  </p>
                </div>

                <div style={{ flex: 1, paddingTop: 8 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: nsty.bg, border: `1px solid ${nsty.border}`, borderRadius: 20, padding: "5px 14px", marginBottom: 20 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: nsty.color }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: nsty.color }}>{nivel}</span>
                  </div>

                  <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, marginBottom: 24 }}>
                    {resumo_executivo}
                  </p>

                  {/* Mini pillar bars */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {pilaresArr.map(p => (
                      <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 100, fontSize: 12, color: "#6B7280", flexShrink: 0 }}>{p.label}</span>
                        <ScoreBar score={p.score} color={scoreColor(p.score)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cover footer */}
            <div style={{ padding: "40px 48px 0", borderTop: "1px solid #F3F4F6", marginTop: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>cineze.com.br · assessoria de marketing digital</span>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>Página 1</span>
            </div>
          </div>

          {/* ── 01. DIAGNÓSTICO POR PILAR ─────────────────────────────────── */}
          <div className="pdf-break" style={{ padding: "48px 48px 40px" }}>
            <SectionHeader num="01" title="Diagnóstico por Pilar" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {pilaresArr.map(({ label, score, pilar }) => {
                const color = scoreColor(score)
                return (
                  <div
                    key={label}
                    className="pdf-avoid"
                    style={{
                      border: "1px solid #E5E7EB",
                      borderLeft: `4px solid ${color}`,
                      borderRadius: 10,
                      padding: "20px",
                      background: "white",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                      <ScoreArc score={score} size={64} />
                      <div>
                        <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{label}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ height: 4, width: 80, background: "#E5E7EB", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${score * 10}%`, background: color, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontSize: 11, color, fontWeight: 600 }}>{score.toFixed(1)}/10</span>
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.65, marginBottom: pilar?.recomendacoes?.length ? 14 : 0 }}>
                      {pilar?.diagnostico ?? ""}
                    </p>

                    {pilar?.recomendacoes && pilar.recomendacoes.length > 0 && (
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: 8 }}>
                          Recomendações
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {pilar.recomendacoes.slice(0, 3).map((rec, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                              <div style={{ width: 16, height: 16, borderRadius: 4, background: `${color}15`, border: `1px solid ${color}30`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              </div>
                              <span style={{ fontSize: 11, color: "#4B5563", lineHeight: 1.5 }}>{rec}</span>
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

          {/* ── 02. MATURIDADE DIGITAL ───────────────────────────────────── */}
          {matSorted.length > 0 && (
            <div className="pdf-break" style={{ padding: "48px 48px 40px" }}>
              <SectionHeader num="02" title="Maturidade Digital por Canal" />

              {/* Summary row */}
              {(() => {
                const avg = matSorted.length > 0
                  ? Math.round((matSorted.reduce((s, c) => s + (c.score ?? 0), 0) / matSorted.length) * 10) / 10
                  : 0
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 32, padding: "14px 20px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, marginBottom: 24 }}>
                    <div style={{ textAlign: "center" }}>
                      <p style={{ fontSize: 24, fontWeight: 800, color: scoreColorMat(avg), lineHeight: 1 }}>{avg}</p>
                      <p style={{ fontSize: 10, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>Score médio</p>
                    </div>
                    <div style={{ width: 1, height: 36, background: "#E5E7EB" }} />
                    <div style={{ display: "flex", gap: 20 }}>
                      {["Inexistente", "Básico", "Intermediário", "Ativo", "Avançado"].map(st => {
                        const cnt = matSorted.filter(c => c.status === st).length
                        if (!cnt) return null
                        const col = nivelStyleMat(st)
                        return (
                          <div key={st} style={{ textAlign: "center" }}>
                            <p style={{ fontSize: 18, fontWeight: 800, color: col.color, lineHeight: 1 }}>{cnt}</p>
                            <p style={{ fontSize: 10, color: "#9CA3AF" }}>{st}</p>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ marginLeft: "auto", textAlign: "right" }}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: "#111827", lineHeight: 1 }}>{matSorted.length}</p>
                      <p style={{ fontSize: 10, color: "#9CA3AF" }}>canais</p>
                    </div>
                  </div>
                )
              })()}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {matSorted.map((canal, i) => {
                  const color = scoreColorMat(canal.score ?? 0)
                  const sty = nivelStyleMat(canal.status)
                  return (
                    <div
                      key={i}
                      className="pdf-avoid"
                      style={{ border: "1px solid #E5E7EB", borderTop: `3px solid ${color}`, borderRadius: 10, padding: "14px 16px" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{canal.canal}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: sty.color, background: sty.bg, padding: "2px 8px", borderRadius: 20 }}>
                            {canal.status}
                          </span>
                          <span style={{ fontSize: 14, fontWeight: 800, color }}>
                            {canal.score ?? 0}/10
                          </span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: "#E5E7EB", borderRadius: 2, marginBottom: 10, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(canal.score ?? 0) * 10}%`, background: color, borderRadius: 2 }} />
                      </div>
                      {canal.diagnostico && (
                        <p style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5, marginBottom: canal.o_que_falta?.length ? 8 : 0 }}>
                          {canal.diagnostico}
                        </p>
                      )}
                      {canal.o_que_falta && canal.o_que_falta.length > 0 && (
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: 4 }}>
                            Próximos passos
                          </p>
                          {canal.o_que_falta.slice(0, 2).map((item, j) => (
                            <div key={j} style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                              <span style={{ fontSize: 10, color: color, fontWeight: 700, flexShrink: 0 }}>{j + 1}.</span>
                              <span style={{ fontSize: 10, color: "#6B7280", lineHeight: 1.4 }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 03. COMUNICAÇÃO ──────────────────────────────────────────── */}
          {comunicacao && (
            <div className="pdf-break" style={{ padding: "48px 48px 40px" }}>
              <SectionHeader num="03" title="Auditoria de Comunicação" />

              {/* Score + análise geral */}
              <div className="pdf-avoid" style={{ display: "flex", gap: 24, marginBottom: 24 }}>
                <ScoreArc score={(comunicacao.score ?? 0) / 10} size={80} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: 6 }}>Análise geral</p>
                  <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{comunicacao.analise_geral}</p>
                </div>
              </div>

              {/* Brand identity grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
                {[
                  { label: "Proposta de Valor", text: comunicacao.proposta_de_valor },
                  { label: "Tom de Voz", text: comunicacao.tom_de_voz },
                  { label: "CTA Principal", text: comunicacao.cta },
                ].filter(i => i.text).map(item => (
                  <div key={item.label} className="pdf-avoid" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px" }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF", marginBottom: 8 }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{item.text}</p>
                  </div>
                ))}
              </div>

              {/* Problems */}
              {comunicacao.problemas && comunicacao.problemas.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Problemas Identificados</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[...comunicacao.problemas]
                      .sort((a, b) => ({ critico: 0, moderado: 1, leve: 2 }[a.nivel] - { critico: 0, moderado: 1, leve: 2 }[b.nivel]))
                      .map((p, i) => {
                        const ps = nivelProblemaStyle(p.nivel)
                        return (
                          <div key={i} className="pdf-avoid" style={{ border: "1px solid #E5E7EB", borderLeft: `3px solid ${ps.color}`, borderRadius: 8, padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{p.problema}</p>
                              <span style={{ fontSize: 10, fontWeight: 700, color: ps.color, background: ps.bg, padding: "2px 8px", borderRadius: 20, flexShrink: 0, marginLeft: 8 }}>
                                {ps.label}
                              </span>
                            </div>
                            <p style={{ fontSize: 12, color: "#4B5563", lineHeight: 1.55 }}>✓ {p.solucao}</p>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── 04. MERCADO & EMPRESA ────────────────────────────────────── */}
          {(analise_mercado || sobre_empresa) && (
            <div className="pdf-break" style={{ padding: "48px 48px 40px" }}>
              <SectionHeader num="04" title="Mercado & Empresa" />

              {analise_mercado && (
                <div className="pdf-avoid" style={{ marginBottom: 28 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #E5E7EB" }}>
                    Análise de Mercado
                  </p>
                  <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7, marginBottom: 16 }}>
                    {analise_mercado.panorama}
                  </p>

                  {/* KPIs de mercado */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
                    {[
                      { label: "Investimento recomendado/mês", value: fmtMoney(analise_mercado.investimento_mensal_recomendado) },
                      { label: "CPM estimado (por 1000 impressões)", value: fmtMoney(analise_mercado.cpm_estimado) },
                      { label: "CPC estimado (por clique)", value: fmtMoney(analise_mercado.cpc_estimado) },
                    ].map(k => (
                      <div key={k.label} style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "12px 14px" }}>
                        <p style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 4 }}>{k.label}</p>
                        <p style={{ fontSize: 16, fontWeight: 700, color: "#2563EB" }}>{k.value}</p>
                      </div>
                    ))}
                  </div>

                  {analise_mercado.oportunidade && (
                    <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "12px 16px" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                        Maior Oportunidade Identificada
                      </p>
                      <p style={{ fontSize: 13, color: "#1E40AF", lineHeight: 1.65 }}>{analise_mercado.oportunidade}</p>
                    </div>
                  )}
                </div>
              )}

              {sobre_empresa?.persona && (
                <div className="pdf-avoid">
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid #E5E7EB" }}>
                    Perfil do Cliente Ideal
                  </p>
                  <p style={{ fontSize: 13, color: "#4B5563", lineHeight: 1.7, marginBottom: 14 }}>
                    {sobre_empresa.persona.descricao}
                  </p>
                  {sobre_empresa.persona.tags?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {sobre_empresa.persona.tags.map((t, i) => (
                        <span key={i} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#2563EB", fontWeight: 500 }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── 05. PLANO DE AÇÃO ────────────────────────────────────────── */}
          {plano_acao.length > 0 && (
            <div className="pdf-break" style={{ padding: "48px 48px 40px" }}>
              <SectionHeader num="05" title="Plano de Ação — 30 dias" />

              {[1, 2, 3, 4].map(semana => {
                const acoes = planoByWeek[semana]
                if (!acoes?.length) return null
                const sc = semanaColor(semana)
                return (
                  <div key={semana} style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: `${sc}15`, border: `1.5px solid ${sc}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: sc }}>{semana}</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>Semana {semana}</p>
                      <div style={{ flex: 1, height: 1, background: "#E5E7EB" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {acoes.map(acao => {
                        const pr = prioStyle(acao.prioridade)
                        return (
                          <div
                            key={acao.numero}
                            className="pdf-avoid"
                            style={{ border: "1px solid #E5E7EB", borderLeft: `3px solid ${sc}`, borderRadius: 8, padding: "14px 16px" }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: acao.meta ? 8 : 0 }}>
                              <div style={{ width: 24, height: 24, borderRadius: 6, background: `${sc}12`, border: `1px solid ${sc}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, color: sc }}>
                                {acao.numero}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{acao.titulo}</p>
                                  <span style={{ fontSize: 10, fontWeight: 700, color: pr.color, background: pr.bg, padding: "1px 7px", borderRadius: 20 }}>
                                    {acao.prioridade}
                                  </span>
                                </div>
                                {acao.meta && (
                                  <p style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5, marginBottom: acao.por_que_agora ? 6 : 0 }}>
                                    <strong style={{ color: "#374151" }}>Meta:</strong> {acao.meta}
                                  </p>
                                )}
                                {acao.por_que_agora && (
                                  <p style={{ fontSize: 11, color: "#0369A1", lineHeight: 1.5, background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 6, padding: "6px 10px", marginTop: 6 }}>
                                    <strong>Por que agora:</strong> {acao.por_que_agora}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── 06. OBJETIVOS SMART ──────────────────────────────────────── */}
          {objetivos_smart.length > 0 && (
            <div className="pdf-break" style={{ padding: "48px 48px 40px" }}>
              <SectionHeader num="06" title="Objetivos SMART" />

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {objetivos_smart.map((obj, i) => (
                  <div key={i} className="pdf-avoid" style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ background: "#F0F7FF", borderBottom: "1px solid #E5E7EB", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#DBEAFE", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#2563EB" }}>{i + 1}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{obj.titulo}</p>
                        <p style={{ fontSize: 12, color: "#6B7280" }}>{obj.meta}</p>
                      </div>
                    </div>
                    <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                      {[
                        { key: "especifico" as const, label: "Específico",  color: "#2563EB" },
                        { key: "mensuravel" as const, label: "Mensurável",  color: "#7C3AED" },
                        { key: "atingivel"  as const, label: "Atingível",   color: "#16A34A" },
                        { key: "relevante"  as const, label: "Relevante",   color: "#D97706" },
                        { key: "temporal"   as const, label: "Temporal",    color: "#0891B2" },
                      ].filter(s => obj[s.key]).map(s => (
                        <div key={s.key} style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderTop: `2px solid ${s.color}`, borderRadius: 8, padding: "10px 12px" }}>
                          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: s.color, marginBottom: 4 }}>
                            {s.label}
                          </p>
                          <p style={{ fontSize: 11, color: "#4B5563", lineHeight: 1.55 }}>{obj[s.key]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 07. MÉTRICAS ─────────────────────────────────────────────── */}
          {metricas.length > 0 && (
            <div className="pdf-break" style={{ padding: "48px 48px 48px" }}>
              <SectionHeader num="07" title="Métricas de Acompanhamento" />

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", borderBottom: "2px solid #E5E7EB" }}>
                      Métrica
                    </th>
                    <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", borderBottom: "2px solid #E5E7EB" }}>
                      Baseline
                    </th>
                    <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", borderBottom: "2px solid #E5E7EB" }}>
                      Meta
                    </th>
                    <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", borderBottom: "2px solid #E5E7EB" }}>
                      Frequência
                    </th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", borderBottom: "2px solid #E5E7EB" }}>
                      Como medir
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.map((m, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F3F4F6", background: i % 2 === 0 ? "white" : "#FAFAFA" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>{m.nome}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#6B7280" }}>{m.baseline}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center", color: "#2563EB", fontWeight: 700 }}>{m.meta}</td>
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, textTransform: "capitalize",
                          color: m.frequencia === "diária" ? "#16A34A" : m.frequencia === "semanal" ? "#2563EB" : "#7C3AED",
                          background: m.frequencia === "diária" ? "#F0FDF4" : m.frequencia === "semanal" ? "#EFF6FF" : "#F5F3FF",
                          padding: "2px 8px", borderRadius: 20,
                        }}>
                          {m.frequencia}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#4B5563", fontSize: 11 }}>{m.como_medir}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Back cover / Footer ───────────────────────────────────────── */}
          <div className="pdf-break pdf-avoid" style={{ background: "linear-gradient(135deg, #0066FF 0%, #06B7D8 100%)", padding: "48px", textAlign: "center" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: "white", marginBottom: 8, letterSpacing: "-0.5px" }}>
              cineze<span style={{ color: "rgba(255,255,255,0.6)" }}>.</span>
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 24 }}>
              assessoria de marketing digital
            </p>
            <div style={{ width: 48, height: 2, background: "rgba(255,255,255,0.4)", margin: "0 auto 24px" }} />
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.9)", fontWeight: 500, marginBottom: 6 }}>
              Pronto para transformar esse diagnóstico em resultado?
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 28 }}>
              Fale com a Cineze e vamos montar juntos a estratégia certa para o seu negócio.
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "10px 20px" }}>
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M16 3C8.83 3 3 8.83 3 16c0 2.38.65 4.6 1.79 6.5L3 29l6.76-1.77A13 13 0 0 0 16 29c7.17 0 13-5.83 13-13S23.17 3 16 3Z" fill="white" fillOpacity="0.9"/>
              </svg>
              <span style={{ fontSize: 14, fontWeight: 600, color: "white" }}>
                (31) 99514-7425
              </span>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
