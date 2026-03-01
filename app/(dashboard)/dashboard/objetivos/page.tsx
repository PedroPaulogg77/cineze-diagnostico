"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Objetivo {
  numero?: number
  titulo: string
  meta_resumida?: string
  meta?: string           // campo legado
  especifico: string
  mensuravel: string
  atingivel: string
  relevante: string
  temporal: string
}

// ─── SMART Config ─────────────────────────────────────────────────────────────

const SMART = [
  { key: "especifico" as const, letra: "E", label: "Específico", color: "#0066FF", bg: "rgba(0,102,255,0.08)" },
  { key: "mensuravel" as const, letra: "M", label: "Mensurável", color: "#06B7D8", bg: "rgba(6,183,216,0.08)" },
  { key: "atingivel"  as const, letra: "A", label: "Atingível",  color: "#22C55E", bg: "rgba(34,197,94,0.08)"  },
  { key: "relevante"  as const, letra: "R", label: "Relevante",  color: "#EAB308", bg: "rgba(234,179,8,0.08)"  },
  { key: "temporal"   as const, letra: "T", label: "Temporal",   color: "#F97316", bg: "rgba(249,115,22,0.08)" },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

function ChevronIcon({ up, color }: { up: boolean; color: string }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, transition: "transform 300ms ease", transform: up ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes obj-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .obj-sk { animation: obj-pulse 1.6s ease-in-out infinite; background: #1A3050; }
      ` }} />

      <div className="obj-sk" style={{ height: 28, width: 180, borderRadius: 8, marginBottom: 8 }} />
      <div className="obj-sk" style={{ height: 16, width: 320, borderRadius: 6, marginBottom: 10 }} />
      <div className="obj-sk" style={{ height: 30, width: 190, borderRadius: 9999, marginBottom: 28 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="obj-sk" style={{
            height: 72, borderRadius: 16,
            borderLeft: "4px solid #1E3A5A",
          }} />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ObjetivosPage() {
  const router = useRouter()
  const [objetivos, setObjetivos] = useState<Objetivo[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }

      const { data: row } = await supabase
        .from("diagnosticos")
        .select("objetivos_smart")
        .eq("user_id", user.id)
        .eq("status", "concluido")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!row) { router.replace("/onboarding"); return }

      setObjetivos(row.objetivos_smart as unknown as Objetivo[])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <Skeleton />

  const list = objetivos ?? []

  function toggle(i: number) {
    setOpenIdx(prev => (prev === i ? null : i))
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes obj-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        .obj-page { padding: 16px; }
        @media (min-width: 768px) { .obj-page { padding: 24px 28px; } }

        .obj-card {
          background: #0D1F35;
          border: 1px solid #1A3050;
          border-left: 4px solid #0066FF;
          border-radius: 16px;
          overflow: hidden;
          transition: background 200ms;
        }
        .obj-card.is-open { background: #0A1628; }

        .obj-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 24px;
          cursor: pointer;
          user-select: none;
        }
        .obj-card-header:hover { background: #0A1628; }

        .obj-expand {
          max-height: 0;
          overflow: hidden;
          transition: max-height 300ms ease;
        }
        .obj-expand.is-open { max-height: 2000px; }
      ` }} />

      <div className="obj-page">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF", margin: "0 0 6px" }}>
          Objetivos
        </h1>
        <p style={{ fontSize: 15, color: "#8B9DB5", margin: "0 0 12px" }}>
          5 objetivos concretos definidos com base no seu diagnóstico.
        </p>
        <span style={{
          display: "inline-flex", alignItems: "center",
          background: "rgba(0,102,255,0.08)", border: "1px solid #0066FF",
          color: "#0066FF", fontSize: 13, fontWeight: 600,
          padding: "6px 16px", borderRadius: 9999, marginBottom: 24,
        }}>
          {list.length} objetivo{list.length !== 1 ? "s" : ""} identificado{list.length !== 1 ? "s" : ""}
        </span>

        {/* ── Cards ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {list.map((obj, i) => {
            const isOpen = openIdx === i
            const numero = obj.numero ?? i + 1
            const metaText = obj.meta_resumida ?? obj.meta ?? ""

            return (
              <div key={i} className={`obj-card${isOpen ? " is-open" : ""}`}>

                {/* Card header */}
                <div className="obj-card-header" onClick={() => toggle(i)}>

                  {/* Left: number badge + text */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "#0066FF", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700, color: "#FFFFFF",
                    }}>
                      {numero}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 16, fontWeight: 600, color: "#FFFFFF", margin: 0, lineHeight: 1.4 }}>
                        {obj.titulo}
                      </p>
                      {metaText && (
                        <p style={{
                          fontSize: 14, color: "#8B9DB5", margin: "2px 0 0", lineHeight: 1.4,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {metaText}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: label + chevron */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: isOpen ? "#8B9DB5" : "#0066FF" }}>
                      {isOpen ? "Fechar" : "Ver detalhes"}
                    </span>
                    <ChevronIcon up={isOpen} color={isOpen ? "#8B9DB5" : "#0066FF"} />
                  </div>
                </div>

                {/* Expandable content */}
                <div className={`obj-expand${isOpen ? " is-open" : ""}`}>
                  <div style={{ height: 1, background: "#1A3050", margin: "0 24px" }} />

                  <div style={{ padding: "4px 24px 24px" }}>
                    {SMART.map((s, si) => {
                      const text = obj[s.key]
                      return (
                        <div key={s.key}>
                          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 0" }}>
                            {/* Letter badge */}
                            <div style={{
                              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                              background: s.bg,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 14, fontWeight: 700, color: s.color,
                            }}>
                              {s.letra}
                            </div>

                            {/* Label + text */}
                            <div style={{ flex: 1 }}>
                              <p style={{
                                fontSize: 11, fontWeight: 700, color: s.color,
                                textTransform: "uppercase", letterSpacing: "0.08em",
                                margin: "0 0 4px",
                              }}>
                                {s.label}
                              </p>
                              <p style={{ fontSize: 14, color: "#FFFFFF", lineHeight: 1.6, margin: 0 }}>
                                {text || "—"}
                              </p>
                            </div>
                          </div>

                          {si < SMART.length - 1 && (
                            <div style={{ height: 1, background: "#1A3050" }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
