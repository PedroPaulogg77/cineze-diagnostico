"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type { SobreEmpresa } from "@/types"
import { WhatsAppCTA } from "@/components/ui/WhatsAppCTA"

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconCheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const IconLink = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconZap = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
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
        <div key={i} className="rx-pulse" style={{ height: 120, borderRadius: 16, background: "var(--border-color)", marginBottom: 16 }} />
      ))}
    </div>
  )
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  ativo:       { color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  ativo_bem:   { color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  ativo_basico:{ color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  basico:      { color: "#F97316", bg: "rgba(249,115,22,0.12)" },
  inativo:     { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  ausente:     { color: "#6B7280", bg: "rgba(107,114,128,0.12)" },
}

function getStatusStyle(status: string) {
  const key = status.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z_]/g, "")
  return STATUS_STYLE[key] ?? { color: "#8B9DB5", bg: "rgba(139,157,181,0.12)" }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EmpresaPage() {
  const router = useRouter()
  const [data, setData] = useState<SobreEmpresa | null>(null)
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
        .select("sobre_empresa")
        .eq("user_id", user.id)
        .eq("status", "concluido")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!row) { router.replace("/dashboard/raio-x"); return }

      setData(row.sobre_empresa as unknown as SobreEmpresa)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <Skeleton />

  const d = data!

  return (
    <div style={{ padding: "24px 28px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
        .emp-card { transition: transform .2s ease; }
        .emp-card:hover { transform: translateY(-2px); }
      ` }} />

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          Sobre sua Empresa
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Presença digital mapeada, canais identificados e perfil do cliente ideal
        </p>
      </div>

      {/* Canais Identificados */}
      <div
        className="emp-card"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-color)",
          borderRadius: 16,
          padding: "22px 24px",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span style={{ color: "#22C55E" }}><IconCheckCircle /></span>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
            Canais Identificados ({d.canais_identificados?.length ?? 0})
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
          {d.canais_identificados?.map((c, i) => {
            const st = getStatusStyle(c.status)
            return (
              <div
                key={i}
                style={{
                  background: "var(--bg-surface-hover)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  <span style={{ color: "var(--text-tertiary)", flexShrink: 0 }}><IconLink /></span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{c.canal}</p>
                    {c.link && c.link !== "N/A" && c.link !== "n/a" && (
                      <p style={{ fontSize: 11, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.link}
                      </p>
                    )}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  color: st.color, background: st.bg,
                  padding: "3px 10px", borderRadius: 20, flexShrink: 0,
                }}>
                  {c.status}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Canais Ausentes */}
      {d.canais_ausentes && d.canais_ausentes.length > 0 && (
        <div
          className="emp-card"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-color)",
            borderRadius: 16,
            padding: "22px 24px",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span style={{ color: "var(--text-secondary)" }}><IconSearch /></span>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              Canais Não Explorados ({d.canais_ausentes.length})
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {d.canais_ausentes.map((c, i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-surface-hover)",
                  border: "1px solid rgba(234,179,8,0.2)",
                  borderLeft: "3px solid #EAB308",
                  borderRadius: 12,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <span style={{ color: "#EAB308", flexShrink: 0, marginTop: 1 }}><IconZap /></span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#EAB308", marginBottom: 4 }}>{c.canal}</p>
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{c.oportunidade}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Persona */}
      {d.persona && (
        <div
          className="emp-card"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(6,102,255,0.06) 100%)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: 16,
            padding: "22px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ color: "#A78BFA" }}><IconUser /></span>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              Perfil do Cliente Ideal (Persona)
            </h2>
          </div>

          <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8, marginBottom: 20 }}>
            {d.persona.descricao}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
            {d.persona.tags && d.persona.tags.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Características
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {d.persona.tags.map((tag, i) => (
                    <span key={i} style={{
                      fontSize: 12, padding: "4px 10px", borderRadius: 20,
                      background: "rgba(139,92,246,0.12)",
                      border: "1px solid rgba(139,92,246,0.25)",
                      color: "#A78BFA",
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {d.persona.interesses && d.persona.interesses.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Interesses
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {d.persona.interesses.map((item, i) => (
                    <span key={i} style={{
                      fontSize: 12, padding: "4px 10px", borderRadius: 20,
                      background: "rgba(6,183,216,0.10)",
                      border: "1px solid rgba(6,183,216,0.2)",
                      color: "#06B7D8",
                    }}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {d.persona.onde_encontrar && d.persona.onde_encontrar.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Onde encontrar
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {d.persona.onde_encontrar.map((local, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{local}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <WhatsAppCTA
        headline="Seu negócio tem pontos fortes — a Cineze amplifica isso"
        body="Com base no perfil da sua empresa e dos seus clientes ideais, criamos estratégias que realmente conectam com quem compra de você."
        waMessage="Olá! Vi a análise do meu negócio no diagnóstico e quero entender como a Cineze pode ajudar a escalar meus resultados."
      />
    </div>
  )
}
