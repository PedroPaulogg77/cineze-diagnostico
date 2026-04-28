"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import type { MaturidadeCanal } from "@/types"

// ─── Platform Brand Icons ──────────────────────────────────────────────────────

function IconInstagram({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="ig-g" x1="0" y1="32" x2="32" y2="0">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="25%" stopColor="#FCAF45" />
          <stop offset="50%" stopColor="#F77737" />
          <stop offset="75%" stopColor="#E1306C" />
          <stop offset="100%" stopColor="#833AB4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#ig-g)" />
      <rect x="9" y="9" width="14" height="14" rx="4" fill="none" stroke="white" strokeWidth="1.8" />
      <circle cx="16" cy="16" r="4" fill="none" stroke="white" strokeWidth="1.8" />
      <circle cx="21.5" cy="10.5" r="1.2" fill="white" />
    </svg>
  )
}

function IconWhatsApp({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#25D366" />
      <path
        d="M16 6C10.48 6 6 10.48 6 16c0 1.98.57 3.83 1.56 5.4L6 26l4.76-1.52A9.94 9.94 0 0 0 16 26c5.52 0 10-4.48 10-10S21.52 6 16 6Z"
        fill="white"
      />
      <path
        d="M12.7 13.7c.2-.4.8-1.5 1-1.63.2-.16.4-.16.54-.1l1.06.49c.14.07.27.2.13.47l-.6 1.13c-.07.13 0 .27.13.4.67.8 1.47 1.4 2.34 1.73.13.07.27 0 .33-.13l.53-.93c.1-.2.27-.27.47-.2l1.07.4c.2.07.27.27.2.47-.2.66-.8 1.46-1.46 1.6-1.2.27-2.67-.27-4-1.2-.87-.6-1.54-1.4-1.74-2.5Z"
        fill="#25D366"
      />
    </svg>
  )
}

function IconFacebook({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#1877F2" />
      <path
        d="M17.6 26V17.2H20.4L20.8 14H17.6V12c0-.93.26-1.6 1.6-1.6H20.8V7.4c-.27-.04-1.34-.13-2.54-.13C15.7 7.27 14 8.83 14 11.67V14h-2.8v3.2H14V26h3.6Z"
        fill="white"
      />
    </svg>
  )
}

function IconGoogle({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="white" stroke="#E5E7EB" strokeWidth="1" />
      <path
        d="M27.2 16.27c0-.85-.08-1.67-.21-2.46H16v4.64h6.45a5.51 5.51 0 0 1-2.39 3.62v3H23c1.93-1.78 3.2-4.4 3.2-5.8h1Z"
        fill="#4285F4"
      />
      <path
        d="M16 28c3.24 0 5.96-1.07 7.94-2.93l-3.13-3A8 8 0 0 1 16 23.2c-4.07 0-7.32-2.75-8.07-6.27v-3.1H4.68A12 12 0 0 0 16 28Z"
        fill="#34A853"
      />
      <path
        d="M7.93 16.93A7.2 7.2 0 0 1 7.93 12v-3.1H4.68A12 12 0 0 0 4 16c0 1.93.46 3.76 1.28 5.38l3.25-2.52-.6-1.93Z"
        fill="#FBBC04"
      />
      <path
        d="M16 8.8c1.77 0 3.35.61 4.6 1.79L23.47 7.5A12 12 0 0 0 16 4 12 12 0 0 0 4.68 10.9l3.25 2.52C8.68 10.15 12.07 8.8 16 8.8Z"
        fill="#EA4335"
      />
    </svg>
  )
}

function IconYouTube({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#FF0000" />
      <path
        d="M26.13 11.27a2.67 2.67 0 0 0-1.87-1.87C22.4 9 16 9 16 9s-6.4 0-8.26.4A2.67 2.67 0 0 0 5.87 11.27C5.47 13.13 5.47 16 5.47 16s0 2.87.4 4.73a2.67 2.67 0 0 0 1.87 1.87c1.86.4 8.26.4 8.26.4s6.4 0 8.26-.4a2.67 2.67 0 0 0 1.87-1.87c.4-1.86.4-4.73.4-4.73s0-2.87-.4-4.73Z"
        fill="white"
      />
      <path d="M13.47 19.73V12.27L19.73 16l-6.26 3.73Z" fill="#FF0000" />
    </svg>
  )
}

function IconTikTok({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#010101" />
      <path
        d="M22.27 7.47c-.53-.67-.93-1.47-.93-2.4H18.13V20c0 1.2-.93 2.13-2.13 2.13s-2.13-.93-2.13-2.13.93-2.13 2.13-2.13c.27 0 .53.07.8.13V14.8c-.27-.07-.53-.07-.8-.07C12.8 14.73 10.67 16.87 10.67 20s2.13 5.27 5.33 5.27 5.33-2.4 5.33-5.27V13.33c1.07.67 2.27 1.07 3.6 1.07v-3.2c-.93 0-1.87-.27-2.66-.73Z"
        fill="white"
      />
    </svg>
  )
}

function IconLinkedIn({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0A66C2" />
      <path
        d="M9.47 13.07H6.67V25.33h2.8V13.07ZM8.07 11.73a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2ZM25.33 17.6c0-2.53-.53-4.53-3.6-4.53-1.47 0-2.4.8-2.8 1.6h-.07v-1.6H16v13.26h2.93V18.4c0-1.2.27-2.4 1.74-2.4s1.6 1.33 1.6 2.4v6.93h2.93V17.6h.13Z"
        fill="white"
      />
    </svg>
  )
}

function IconX({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#000000" />
      <path
        d="M17.47 14.8 22.93 8h-1.46l-4.8 5.6L12.93 8H8l5.73 8.4L8 24h1.46l5.07-5.87 4 5.87H24l-6.53-9.2Zm-1.8 2.13-.6-.8-4.67-6.67H12l3.73 5.33.6.8 4.8 6.8H19.2l-3.53-5.46Z"
        fill="white"
      />
    </svg>
  )
}

function IconWebsite({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#6366F1" />
      <circle cx="16" cy="16" r="8.5" fill="none" stroke="white" strokeWidth="1.8" />
      <path d="M16 7.5c-2 2.67-3.33 5.33-3.33 8.5s1.33 5.83 3.33 8.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M16 7.5c2 2.67 3.33 5.33 3.33 8.5S18 21.83 16 24.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M7.5 16h17" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 11.5h15M8.5 20.5h15" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.6" />
    </svg>
  )
}

function IconEmail({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#EA4335" />
      <rect x="6" y="9" width="20" height="14" rx="2" fill="white" />
      <path d="M6 11l10 7 10-7" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconGoogleMaps({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#34A853" />
      <path
        d="M16 6C12.13 6 9 9.13 9 13c0 6.75 7 13 7 13s7-6.25 7-13c0-3.87-3.13-7-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z"
        fill="white"
      />
    </svg>
  )
}

function IconPinterest({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#E60023" />
      <path
        d="M16 5.33C10.11 5.33 5.33 10.11 5.33 16c0 4.53 2.8 8.4 6.8 10-.07-.67-.13-1.73 0-2.4l1.34-5.6s-.34-.67-.34-1.67c0-1.6.93-2.8 2.13-2.8 1 0 1.47.73 1.47 1.67 0 1-.67 2.53-1 3.87-.27 1.13.6 2.13 1.73 2.13 2.07 0 3.67-2.13 3.67-5.33 0-2.8-2-4.73-4.93-4.73-3.33 0-5.27 2.53-5.27 5.07 0 1 .4 2.07.87 2.67.1.13.1.2.07.33l-.33 1.33c-.07.2-.2.27-.4.13-1.47-.67-2.4-2.8-2.4-4.53 0-3.67 2.67-7.07 7.73-7.07 4.07 0 7.2 2.93 7.2 6.8 0 4.07-2.53 7.33-6.07 7.33-1.2 0-2.27-.6-2.67-1.33l-.73 2.73c-.27 1-.93 2.27-1.4 3 1.07.33 2.13.53 3.33.53 5.87 0 10.67-4.8 10.67-10.67S21.87 5.33 16 5.33Z"
        fill="white"
      />
    </svg>
  )
}

function IconTelegram({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#2AABEE" />
      <path
        d="M6.93 15.53l15.74-6.07c.73-.27 1.4.18 1.13 1.27l-2.67 12.54c-.2.87-.73 1.07-1.47.67l-4-3.07-1.93 1.87c-.2.2-.4.33-.8.33l.27-4.07 7.07-6.4c.3-.27 0-.4-.47-.13L9.8 18.4l-4-1.2c-.87-.27-.9-.87.13-1.2.14 0 .14 0 1 .33Z"
        fill="white"
      />
    </svg>
  )
}

function IconGenericChannel({ size = 32, canal }: { size?: number; canal: string }) {
  const initial = canal.charAt(0).toUpperCase()
  const colors = ["#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#F59E0B", "#EF4444"]
  const color = colors[canal.charCodeAt(0) % colors.length]
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill={color} />
      <text x="16" y="21" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="system-ui, sans-serif">
        {initial}
      </text>
    </svg>
  )
}

function PlatformIcon({ canal, size = 32 }: { canal: string; size?: number }) {
  const n = canal.toLowerCase()
  if (n.includes("instagram")) return <IconInstagram size={size} />
  if (n.includes("whatsapp") || n.includes("whats")) return <IconWhatsApp size={size} />
  if (n.includes("facebook") || n === "fb") return <IconFacebook size={size} />
  if (n.includes("youtube")) return <IconYouTube size={size} />
  if (n.includes("tiktok") || n.includes("tik tok")) return <IconTikTok size={size} />
  if (n.includes("linkedin")) return <IconLinkedIn size={size} />
  if (n.includes("twitter") || n.includes("x ") || n === "x") return <IconX size={size} />
  if (n.includes("pinterest")) return <IconPinterest size={size} />
  if (n.includes("telegram")) return <IconTelegram size={size} />
  if (n.includes("e-mail") || n.includes("email")) return <IconEmail size={size} />
  if (n.includes("maps") || n.includes("google meu negócio") || n.includes("google business") || n.includes("gmb")) return <IconGoogleMaps size={size} />
  if (n.includes("google")) return <IconGoogle size={size} />
  if (n.includes("site") || n.includes("website") || n.includes("www") || n.includes("blog")) return <IconWebsite size={size} />
  return <IconGenericChannel size={size} canal={canal} />
}

// ─── Status & Score utils ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  Inexistente:   { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  Básico:        { color: "#F97316", bg: "rgba(249,115,22,0.12)" },
  Intermediário: { color: "#EAB308", bg: "rgba(234,179,8,0.12)" },
  Ativo:         { color: "#3B82F6", bg: "rgba(59,130,246,0.12)" },
  Avançado:      { color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
}

const STATUS_ORDER = ["Inexistente", "Básico", "Intermediário", "Ativo", "Avançado"]

function scoreColor(s: number) {
  if (s < 4) return "#EF4444"
  if (s < 6) return "#F97316"
  if (s < 7.5) return "#EAB308"
  return "#22C55E"
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes mat-pulse{0%,100%{opacity:1}50%{opacity:.4}}.mat-pulse{animation:mat-pulse 1.6s ease-in-out infinite}` }} />
      <div className="mat-pulse" style={{ height: 28, width: 240, borderRadius: 8, background: "var(--border-color)", marginBottom: 8 }} />
      <div className="mat-pulse" style={{ height: 16, width: 320, borderRadius: 6, background: "var(--border-color)", marginBottom: 32 }} />
      {[1, 2, 3].map(i => (
        <div key={i} style={{ background: "var(--bg-surface)", borderRadius: 16, border: "1px solid var(--border-color)", padding: 24, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <div className="mat-pulse" style={{ width: 48, height: 48, borderRadius: 10, background: "var(--border-color)" }} />
            <div>
              <div className="mat-pulse" style={{ height: 18, width: 140, borderRadius: 6, background: "var(--border-color)", marginBottom: 8 }} />
              <div className="mat-pulse" style={{ height: 14, width: 80, borderRadius: 20, background: "var(--border-color)" }} />
            </div>
          </div>
          <div className="mat-pulse" style={{ height: 60, borderRadius: 8, background: "var(--border-color)", marginBottom: 16 }} />
          <div className="mat-pulse" style={{ height: 40, borderRadius: 8, background: "var(--border-color)" }} />
        </div>
      ))}
    </div>
  )
}

// ─── Channel Card ──────────────────────────────────────────────────────────────

function ChannelCard({ canal, animated }: { canal: MaturidadeCanal; animated: boolean }) {
  const color = scoreColor(canal.score ?? 0)
  const statusCfg = STATUS_CONFIG[canal.status] ?? { color: "#8B9DB5", bg: "rgba(139,157,181,0.12)" }
  const pct = ((canal.score ?? 0) / 10) * 100

  return (
    <div style={{
      background: "var(--bg-surface)",
      border: "1px solid var(--border-color)",
      borderRadius: 16,
      overflow: "hidden",
    }}>
      {/* Card header */}
      <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <PlatformIcon canal={canal.canal} size={44} />
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, lineHeight: 1.2 }}>
              {canal.canal}
            </p>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: statusCfg.color, background: statusCfg.bg,
              padding: "3px 10px", borderRadius: 20, letterSpacing: "0.04em",
            }}>
              {canal.status}
            </span>
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: `${color}18`,
            border: `2px solid ${color}60`,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{canal.score ?? 0}</span>
            <span style={{ fontSize: 9, color: "var(--text-tertiary)", lineHeight: 1 }}>/10</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: "0 24px 16px" }}>
        <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: 3,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            width: animated ? `${pct}%` : "0%",
            transition: "width 1s cubic-bezier(.4,0,.2,1)",
          }} />
        </div>
      </div>

      {/* Diagnóstico */}
      {canal.diagnostico && (
        <div style={{ padding: "0 24px 16px" }}>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
            {canal.diagnostico}
          </p>
        </div>
      )}

      {/* Impacto */}
      {canal.impacto && (
        <div style={{
          margin: "0 24px 16px",
          padding: "12px 14px",
          background: "rgba(249,115,22,0.08)",
          border: "1px solid rgba(249,115,22,0.2)",
          borderRadius: 10,
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p style={{ fontSize: 12, color: "#F97316", lineHeight: 1.6, margin: 0 }}>
            <strong style={{ fontWeight: 700 }}>O que você está perdendo: </strong>
            {canal.impacto}
          </p>
        </div>
      )}

      {/* Próximos passos */}
      {canal.o_que_falta && canal.o_que_falta.length > 0 && (
        <div style={{ padding: "0 24px 20px" }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10,
          }}>
            Próximos passos
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {canal.o_que_falta.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 5,
                  border: "1.5px solid var(--border-color)",
                  flexShrink: 0, marginTop: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)" }}>{i + 1}</span>
                </div>
                <span style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MaturidadePage() {
  const router = useRouter()
  const [canais, setCanais] = useState<MaturidadeCanal[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
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

      if (!data) { router.replace("/dashboard/raio-x"); return }

      setCanais((data.maturidade as unknown as MaturidadeCanal[]) ?? [])
      setLoading(false)
      setTimeout(() => setAnimated(true), 100)
    }
    load()
  }, [router])

  if (loading) return <Skeleton />

  const sorted = [...(canais ?? [])].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))

  const avg = canais && canais.length > 0
    ? Math.round((canais.reduce((s, c) => s + (c.score ?? 0), 0) / canais.length) * 10) / 10
    : 0

  const avgColor = scoreColor(avg)
  const avgLabel = avg < 4 ? "Crítico" : avg < 6 ? "Básico" : avg < 7.5 ? "Intermediário" : "Avançado"

  const statusCounts = STATUS_ORDER.map(s => ({
    status: s,
    count: canais?.filter(c => c.status === s).length ?? 0,
    ...STATUS_CONFIG[s],
  })).filter(s => s.count > 0)

  return (
    <div style={{ padding: "24px 28px" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          Maturidade Digital
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Análise detalhada da presença e performance em cada canal digital
        </p>
      </div>

      {/* Summary */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-color)",
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 32,
        flexWrap: "wrap",
      }}>
        {/* Score médio */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 160 }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%",
            background: `${avgColor}18`,
            border: `2.5px solid ${avgColor}`,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: avgColor, lineHeight: 1 }}>{avg}</span>
            <span style={{ fontSize: 9, color: "var(--text-tertiary)" }}>/10</span>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>Score médio</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: avgColor }}>{avgLabel}</p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 44, background: "var(--border-color)", flexShrink: 0 }} />

        {/* Distribuição de status */}
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {statusCounts.map(({ status, count, color }) => (
            <div key={status} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{count}</p>
              <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{status}</p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 3 }}>Canais analisados</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{canais?.length ?? 0}</p>
        </div>
      </div>

      {/* Canal cards — ordenados do pior para o melhor */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))", gap: 16 }}>
        {sorted.map((canal, idx) => (
          <ChannelCard key={idx} canal={canal} animated={animated} />
        ))}
      </div>
    </div>
  )
}
