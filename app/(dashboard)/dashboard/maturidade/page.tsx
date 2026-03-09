"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import type { MaturidadeCanal } from "@/types"
import WhatsappCTA from "@/components/dashboard/WhatsappCTA"

// ─── Platform Icons ───────────────────────────────────────────────────────────

const PLATFORM_ICONS: [string, string][] = [
  ["whatsapp",   "https://cdn.simpleicons.org/whatsapp/25D366"],
  ["instagram",  "https://cdn.simpleicons.org/instagram/E4405F"],
  ["google",     "https://cdn.simpleicons.org/google/4285F4"],
  ["facebook",   "https://cdn.simpleicons.org/facebook/1877F2"],
  ["linkedin",   "https://cdn.simpleicons.org/linkedin/0A66C2"],
  ["tiktok",     "https://cdn.simpleicons.org/tiktok/010101"],
  ["youtube",    "https://cdn.simpleicons.org/youtube/FF0000"],
  ["twitter",    "https://cdn.simpleicons.org/x/000000"],
  ["/x",         "https://cdn.simpleicons.org/x/000000"],
]

function getPlatformIcon(name: string): string | null {
  const lower = name.toLowerCase()
  for (const [key, url] of PLATFORM_ICONS) {
    if (lower.includes(key)) return url
  }
  return null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NIVEIS = ["Inexistente", "Básico", "Intermediário", "Ativo", "Avançado"] as const

const NIVEL_COLOR: Record<string, string> = {
  Inexistente: "#EF4444",
  Básico:      "#F97316",
  Intermediário: "#EAB308",
  Ativo:       "#0066FF",
  Avançado:    "#22C55E",
}

const NIVEL_BG: Record<string, string> = {
  Inexistente:   "rgba(239,68,68,0.12)",
  Básico:        "rgba(249,115,22,0.12)",
  Intermediário: "rgba(234,179,8,0.12)",
  Ativo:         "rgba(0,102,255,0.12)",
  Avançado:      "rgba(34,197,94,0.12)",
}

function scoreColor(s: number) {
  if (s < 4) return "#EF4444"
  if (s < 6) return "#F97316"
  if (s < 8) return "#EAB308"
  return "#22C55E"
}

function avgLevel(avg: number): string {
  if (avg < 4) return "Crítico"
  if (avg < 6) return "Básico"
  if (avg < 7.5) return "Intermediário"
  if (avg < 9) return "Ativo"
  return "Avançado"
}

const LEVEL_DESCRIPTION: Record<string, string> = {
  Crítico: "Sua presença digital praticamente não existe. Clientes em potencial não encontram seu negócio online, o que limita diretamente o crescimento. A prioridade agora é criar as estruturas básicas — começando pelos canais de maior retorno para o seu segmento.",
  Básico: "Você tem o básico no digital, mas ainda sem consistência ou estratégia. O resultado é uma presença fraca que não converte visitantes em clientes. Com ajustes prioritários é possível ampliar o alcance orgânico em 60–90 dias.",
  Intermediário: "Você já tem uma base digital funcionando. O foco agora é refinamento: melhorar o que já existe, fechar as lacunas identificadas e começar a medir resultados com mais precisão para escalar o que funciona.",
  Ativo: "Sua presença digital está acima da média do segmento. O próximo passo é otimização contínua, testes e expansão para novos canais ou formatos que ainda não são explorados.",
  Avançado: "Sua presença digital é referência no segmento. O desafio agora é manter a consistência, inovar nos formatos e transformar sua audiência em uma comunidade fiel.",
}

// retorna o texto e os passos independente do nome do campo (legado vs atual)
function getCanalTexts(c: MaturidadeCanal) {
  const texto = c.o_que_esta_faltando || c.diagnostico || ""
  const passos = c.proximos_passos?.length
    ? c.proximos_passos
    : c.o_que_falta?.length
    ? c.o_que_falta
    : []
  return { texto, passos }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: "16px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mat-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .mat-sk { animation: mat-pulse 1.6s ease-in-out infinite; background: var(--border-color); border-radius: 10px; }
      ` }} />
      <div className="mat-sk" style={{ height: 160, marginBottom: 20 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[1,2,3].map(i => <div key={i} className="mat-sk" style={{ height: 180 }} />)}
      </div>
    </div>
  )
}

// ─── Canal Card ───────────────────────────────────────────────────────────────

function CanalCard({ canal, animated }: { canal: MaturidadeCanal; animated: boolean }) {
  const color = scoreColor(canal.score ?? 0)
  const statusColor = NIVEL_COLOR[canal.status] ?? "#8B9DB5"
  const statusBg = NIVEL_BG[canal.status] ?? "rgba(139,157,181,0.12)"
  const pct = ((canal.score ?? 0) / 10) * 100
  const { texto, passos } = getCanalTexts(canal)
  const iconUrl = getPlatformIcon(canal.canal)

  return (
    <div className="dl-glass-card mat-card">
      {/* Header */}
      <div className="mat-card-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: statusBg, border: `1px solid ${statusColor}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 700, color: statusColor,
          }}>
            {iconUrl
              ? <img src={iconUrl} width={22} height={22} alt={canal.canal} style={{ display: "block" }} />
              : canal.canal.charAt(0).toUpperCase()
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {canal.canal}
            </p>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 600, color: statusColor,
              background: statusBg, padding: "3px 9px", borderRadius: 9999,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
              {canal.status}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{canal.score ?? 0}</span>
          <span style={{ fontSize: 11, color: "var(--text-tertiary)", display: "block" }}>/10</span>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ margin: "14px 0" }}>
        <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            width: animated ? `${pct}%` : "0%",
            transition: "width 1s cubic-bezier(.4,0,.2,1)",
          }} />
        </div>
      </div>

      {/* Texto explicativo */}
      {texto && (
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, margin: "0 0 14px" }}>
          {texto}
        </p>
      )}

      {/* Próximos passos */}
      {passos.length > 0 && (
        <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "0 0 8px" }}>
            Recomendações
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {passos.slice(0, 3).map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                  background: "var(--blue-transparent)", border: "1px solid rgba(0,102,255,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, fontWeight: 700, color: "var(--blue-primary)",
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const avg = canais && canais.length > 0
    ? Math.round((canais.reduce((s, c) => s + (c.score ?? 0), 0) / canais.length) * 10) / 10
    : 0

  const nivel = avgLevel(avg)
  const avgColor = scoreColor(avg)

  // Contagem por nível
  const countByNivel = NIVEIS.reduce<Record<string, number>>((acc, n) => {
    acc[n] = canais?.filter(c => c.status === n).length ?? 0
    return acc
  }, {})
  const total = canais?.length ?? 0

  if (loading) return <Skeleton />

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .mat-card {
          padding: 18px 16px;
        }
        .mat-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }
        .mat-summary-row {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px;
          margin-bottom: 20px;
        }
        .mat-dist-bar {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .mat-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 640px) {
          .mat-card { padding: 22px 24px; }
          .mat-summary-row { flex-direction: row; align-items: flex-start; gap: 28px; padding: 24px 28px; margin-bottom: 24px; }
          .mat-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        }
        @media (min-width: 1024px) {
          .mat-grid { grid-template-columns: repeat(2, 1fr); }
        }
      ` }} />

      <div style={{ padding: "0 0 32px" }}>

        {/* ── SUMMARY CARD ─────────────────────────────────────────────── */}
        <div className="dl-glass-card mat-summary-row">

          {/* Score + Nível */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
              background: `${avgColor}18`,
              border: `2px solid ${avgColor}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: avgColor }}>{avg}</span>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
                Score médio geral
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color: avgColor, margin: 0, letterSpacing: "-0.5px" }}>
                {nivel}
              </p>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Descrição do nível */}
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, margin: "0 0 18px" }}>
              {LEVEL_DESCRIPTION[nivel]}
            </p>

            {/* Distribuição dos níveis */}
            <div className="mat-dist-bar">
              {NIVEIS.filter(n => countByNivel[n] > 0).map(n => {
                const pct = total > 0 ? (countByNivel[n] / total) * 100 : 0
                return (
                  <div key={n} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: NIVEL_COLOR[n],
                      minWidth: 90, flexShrink: 0,
                    }}>{n}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: NIVEL_COLOR[n] }} />
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: NIVEL_COLOR[n],
                      background: NIVEL_BG[n], padding: "2px 8px", borderRadius: 9999,
                      flexShrink: 0,
                    }}>
                      {countByNivel[n]} canal{countByNivel[n] !== 1 ? "is" : ""}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── CANAIS GRID ──────────────────────────────────────────────── */}
        <div className="mat-grid">
          {canais?.map((canal, idx) => (
            <CanalCard key={idx} canal={canal} animated={animated} />
          ))}
        </div>

        <WhatsappCTA
          title="Precisa de ajuda para evoluir esses canais?"
          message="Olá! Vi a análise de maturidade dos meus canais no diagnóstico Cineze e quero entender como evoluí-los."
          subtitle="Sem compromisso — só uma conversa sobre o seu negócio."
        />

      </div>
    </>
  )
}
