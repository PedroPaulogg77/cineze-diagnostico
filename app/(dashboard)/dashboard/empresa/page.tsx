"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import type { SobreEmpresa } from "@/types"

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconCheckCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)
const IconLink = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
)
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const IconZap = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)

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
        <div key={i} className="rx-pulse" style={{ height: 120, borderRadius: 16, background: "var(--border-color)", marginBottom: 16 }} />
      ))}
    </div>
  )
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  ativo: { color: "var(--blue-primary)", bg: "rgba(0, 102, 255, 0.12)" },
  ativo_bem: { color: "var(--blue-primary)", bg: "rgba(0, 102, 255, 0.12)" },
  ativo_basico: { color: "#EAB308", bg: "rgba(234, 179, 8, 0.12)" },
  basico: { color: "#EAB308", bg: "rgba(234, 179, 8, 0.12)" },
  inativo: { color: "var(--danger)", bg: "rgba(239, 68, 68, 0.12)" },
  ausente: { color: "var(--danger)", bg: "rgba(239, 68, 68, 0.12)" },
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
    const supabase = createBrowserSupabaseClient()
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

      if (!row) { router.replace("/onboarding"); return }

      setData(row.sobre_empresa as unknown as SobreEmpresa)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <Skeleton />

  const d = data!

  return (
    <div style={{ padding: "24px 28px" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes rx-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rx-pulse { animation: rx-pulse 1.6s ease-in-out infinite; }
      ` }} />

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
          Sobre sua Empresa
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Presença digital mapeada, canais identificados e perfil do cliente ideal
        </p>
      </div>

      {/* Canais Identificados */}
      <div
        className="dl-glass-card"
        style={{
          padding: "32px",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,102,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue-primary)" }}>
            <IconCheckCircle />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
            Canais Identificados ({d.canais_identificados?.length ?? 0})
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {d.canais_identificados?.map((c, i) => {
            const st = getStatusStyle(c.status)
            return (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 16,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{ background: "var(--bg-surface)", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", flexShrink: 0, boxShadow: "0 2px 4px rgba(0,0,0,.02)" }}>
                    <IconLink />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px" }}>{c.canal}</p>
                    {c.link && c.link !== "N/A" && c.link.toLowerCase() !== "n/a" && c.link.length > 5 && (
                      <p style={{ fontSize: 12, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
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
          className="dl-glass-card"
          style={{
            padding: "32px",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", border: "1px solid var(--border-color)" }}>
              <IconSearch />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Canais Não Explorados ({d.canais_ausentes.length})
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
            {d.canais_ausentes.map((c, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 16,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                }}
              >
                <div style={{ background: "rgba(0,102,255,0.1)", width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue-light)", flexShrink: 0 }}>
                  <IconZap />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: "0 0 6px" }}>{c.canal}</p>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{c.oportunidade}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Persona */}
      {d.persona && (
        <div
          className="dl-glass-card"
          style={{
            background: "linear-gradient(135deg, rgba(0,102,255,0.06) 0%, rgba(77,148,255,0.02) 100%)",
            border: "1px solid rgba(0,102,255,0.15)",
            padding: "32px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(0,102,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--blue-primary)" }}>
              <IconUser />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
              Perfil do Cliente Ideal (Persona)
            </h2>
          </div>

          <p style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.8, margin: "0 0 32px" }}>
            {d.persona.descricao}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 24 }}>
            {d.persona.tags && d.persona.tags.length > 0 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  Características
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {d.persona.tags.map((tag, i) => (
                    <span key={i} style={{
                      fontSize: 12, padding: "4px 10px", borderRadius: 20,
                      background: "rgba(0,102,255,0.1)",
                      border: "1px solid rgba(0,102,255,0.2)",
                      color: "var(--blue-light)",
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
                      background: "rgba(77,148,255,0.1)",
                      border: "1px solid rgba(77,148,255,0.2)",
                      color: "var(--blue-light)",
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
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--blue-primary)", flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{local}</span>
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
}
