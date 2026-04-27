"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

// ─── Types ────────────────────────────────────────────────────────────────────

type Theme = "default" | "dark-gray" | "light"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface NavGroup {
  label: string
  items: NavItem[]
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────

const IconRaiox = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3h7v9H3z" /><path d="M14 3h7v5h-7z" /><path d="M14 12h7v9h-7z" /><path d="M3 16h7v5H3z" />
  </svg>
)
const IconMaturidade = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
)
const IconMercado = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)
const IconEmpresa = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><path d="M9 22v-4h6v4" />
    <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
    <path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" />
    <path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
  </svg>
)
const IconComunicacao = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
  </svg>
)
const IconObjetivos = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
  </svg>
)
const IconPlano = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)
const IconMetricas = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
)

// ─── Navigation config ────────────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    label: "DIAGNÓSTICO",
    items: [
      { href: "/dashboard/raio-x",      label: "Raio X do negócio",    icon: IconRaiox },
      { href: "/dashboard/maturidade",  label: "Maturidade Digital",   icon: IconMaturidade },
      { href: "/dashboard/mercado",     label: "Análise de mercado",   icon: IconMercado },
      { href: "/dashboard/empresa",     label: "Sobre sua empresa",    icon: IconEmpresa },
      { href: "/dashboard/comunicacao", label: "Auditoria de comunic.", icon: IconComunicacao },
    ],
  },
  {
    label: "PLANO DE AÇÃO",
    items: [
      { href: "/dashboard/objetivos", label: "Objetivos",    icon: IconObjetivos },
      { href: "/dashboard/plano",     label: "Plano de ação", icon: IconPlano },
      { href: "/dashboard/metricas",  label: "Métricas",     icon: IconMetricas },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getActiveInfo(pathname: string): { group: string; label: string } {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (pathname.startsWith(item.href)) {
        return {
          group: group.label.charAt(0) + group.label.slice(1).toLowerCase(),
          label: item.label,
        }
      }
    }
  }
  return { group: "Diagnóstico", label: "Raio X do negócio" }
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("") || "?"
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [theme, setTheme] = useState<Theme>("light")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [businessName, setBusinessName] = useState("Meu Negócio")
  const [initials, setInitials] = useState("ME")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { group, label } = getActiveInfo(pathname)

  // Load theme from localStorage
  useEffect(() => {
    const saved = (localStorage.getItem("cineze-theme") as Theme) || "light"
    setTheme(saved)
  }, [])

  // Apply theme to <html>
  useEffect(() => {
    if (theme === "default") {
      document.documentElement.removeAttribute("data-theme")
    } else {
      document.documentElement.setAttribute("data-theme", theme)
    }
    localStorage.setItem("cineze-theme", theme)
  }, [theme])

  // Fetch user profile
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from("profiles")
        .select("nome_negocio, nome_responsavel")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.nome_negocio) setBusinessName(data.nome_negocio)
          const nameForInitials = data?.nome_negocio || data?.nome_responsavel || user.email || ""
          setInitials(getInitials(nameForInitials))
        })
    })
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
    document.body.style.overflow = ""
  }, [])

  const openSidebar = useCallback(() => {
    setSidebarOpen(true)
    document.body.style.overflow = "hidden"
  }, [])

  async function handleSignOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg-main: #060D1A; --bg-surface: #080F1E; --bg-surface-hover: #0B162C;
          --border-color: #1A3050; --border-color-light: #254067;
          --text-primary: #FFFFFF; --text-secondary: #8B9DB5; --text-tertiary: #5C7392;
          --blue: #0066FF; --blue-light: #3385FF; --blue-transparent: rgba(0,102,255,0.1);
          --danger: #EF4444; --shadow-dropdown: 0 10px 25px -5px rgba(0,0,0,0.4);
          --sidebar-width: 250px; --header-height: 72px;
        }
        :root[data-theme="dark-gray"] {
          --bg-main: #0A0A0A; --bg-surface: #141414; --bg-surface-hover: #1F1F1F;
          --border-color: #2A2A2A; --border-color-light: #3A3A3A;
          --text-primary: #FAFAFA; --text-secondary: #A1A1AA; --text-tertiary: #71717A;
          --blue-transparent: rgba(0,102,255,0.15); --shadow-dropdown: 0 10px 25px -5px rgba(0,0,0,0.6);
        }
        :root[data-theme="light"] {
          --bg-main: #F4F5F7; --bg-surface: #FFFFFF; --bg-surface-hover: #F8F9FA;
          --border-color: #E2E8F0; --border-color-light: #CBD5E1;
          --text-primary: #0F172A; --text-secondary: #475569; --text-tertiary: #94A3B8;
          --blue: #0066FF; --blue-light: #3385FF; --blue-transparent: rgba(0,102,255,0.07);
          --danger: #EF4444; --shadow-dropdown: 0 10px 25px -5px rgba(0,0,0,0.1);
        }
        body { font-family: 'Inter', system-ui, sans-serif; background-color: var(--bg-main); color: var(--text-primary); overflow: hidden; -webkit-font-smoothing: antialiased; }
        body, .dl-sidebar, .dl-top-header { transition: background-color 0.3s ease, border-color 0.3s ease; }
        .dl-app { display: flex; height: 100vh; width: 100vw; overflow: hidden; }
        .dl-sidebar { width: var(--sidebar-width); background-color: var(--bg-surface); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; flex-shrink: 0; z-index: 100; }
        .dl-sidebar-header { height: var(--header-height); display: flex; align-items: center; padding: 0 24px; }
        .dl-logo { font-weight: 700; font-size: 20px; color: var(--text-primary); letter-spacing: -0.5px; }
        .dl-logo-dot { color: #0066FF; }
        .dl-sidebar-content { flex: 1; overflow-y: auto; padding: 24px 16px; }
        .dl-sidebar-content::-webkit-scrollbar { width: 4px; }
        .dl-sidebar-content::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
        .dl-sidebar-group { margin-bottom: 32px; }
        .dl-sidebar-label { color: var(--text-tertiary); font-size: 11px; text-transform: uppercase; font-weight: 600; margin-bottom: 12px; padding-left: 12px; letter-spacing: 0.5px; }
        .dl-menu { list-style: none; }
        .dl-menu-item { position: relative; display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 6px; color: var(--text-secondary); cursor: pointer; margin-bottom: 4px; text-decoration: none; transition: background-color 0.15s, color 0.15s; }
        .dl-menu-item:hover { color: var(--text-primary); background-color: var(--bg-surface-hover); }
        .dl-menu-item:hover .dl-menu-icon { color: var(--text-primary); opacity: 1; }
        .dl-menu-item.active { color: var(--text-primary); background-color: var(--blue-transparent); font-weight: 600; }
        .dl-menu-item.active .dl-menu-icon { color: var(--text-primary); opacity: 1; }
        .dl-menu-item.active .dl-active-bar { transform: translateY(-50%) scaleY(1); }
        .dl-active-bar { position: absolute; left: -16px; top: 50%; transform: translateY(-50%) scaleY(0); width: 4px; height: 20px; background-color: var(--blue); border-radius: 0 4px 4px 0; transition: transform 0.2s ease; }
        :root[data-theme="dark-gray"] .dl-active-bar { background-color: var(--text-primary); }
        .dl-menu-icon { color: var(--text-secondary); opacity: 0.8; transition: color 0.15s, opacity 0.15s; }
        .dl-menu-text { font-size: 14px; font-weight: 500; }
        .dl-sidebar-footer { padding: 16px; background-color: var(--bg-surface); }
        .dl-theme-switcher { display: flex; gap: 8px; align-items: center; justify-content: space-between; background: var(--bg-surface-hover); padding: 6px; border-radius: 8px; border: 1px solid var(--border-color); }
        .dl-theme-btn { background: transparent; border: 1px solid transparent; cursor: pointer; padding: 8px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex: 1; color: var(--text-secondary); transition: color 0.15s, background-color 0.15s; }
        .dl-theme-btn:hover { color: var(--text-primary); }
        .dl-theme-btn.active { background: var(--bg-surface); color: var(--text-primary); border-color: var(--border-color); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .dl-main-wrapper { flex: 1; display: flex; flex-direction: column; min-width: 0; background-color: var(--bg-main); }
        .dl-top-header { height: var(--header-height); background-color: var(--bg-surface); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; padding: 0 32px; flex-shrink: 0; }
        .dl-header-left { display: flex; align-items: center; gap: 16px; flex: 1; }
        .dl-mobile-btn { display: none; background: none; border: none; color: var(--text-primary); cursor: pointer; padding: 4px; border-radius: 6px; }
        .dl-mobile-btn:hover { background: var(--bg-surface-hover); }
        .dl-search { display: flex; align-items: center; width: 100%; max-width: 400px; }
        .dl-search-icon { color: var(--text-tertiary); margin-right: 12px; flex-shrink: 0; }
        .dl-search-input { flex: 1; background: transparent; border: none; outline: none; color: var(--text-primary); font-size: 14px; font-family: inherit; }
        .dl-search-input::placeholder { color: var(--text-tertiary); }
        .dl-header-right { display: flex; align-items: center; gap: 16px; }
        .dl-icon-btn { background: none; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 6px; border-radius: 6px; position: relative; transition: all 0.2s; }
        .dl-icon-btn:hover { color: var(--text-primary); background: var(--bg-surface-hover); }
        .dl-badge { position: absolute; top: 4px; right: 6px; width: 6px; height: 6px; background-color: var(--danger); border-radius: 50%; }
        .dl-divider { width: 1px; height: 24px; background-color: var(--border-color); margin: 0 8px; }
        .dl-profile { display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 4px 8px 4px 4px; border-radius: 8px; position: relative; border: 1px solid transparent; transition: background-color 0.15s; }
        .dl-profile:hover { background: var(--bg-surface-hover); }
        .dl-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--bg-surface-hover); border: 1px solid var(--border-color-light); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .dl-avatar-initials { font-size: 11px; font-weight: 600; color: var(--text-primary); }
        .dl-business-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
        .dl-chevron { color: var(--text-tertiary); }
        .dl-dropdown { display: none; position: absolute; top: calc(100% + 4px); right: 0; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; min-width: 220px; box-shadow: var(--shadow-dropdown); padding: 8px 0; z-index: 200; }
        .dl-profile.open .dl-dropdown { display: block; animation: dlFadeIn 0.15s ease-out; }
        @keyframes dlFadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .dl-dropdown-item { padding: 8px 16px; font-size: 13px; font-weight: 500; color: var(--text-secondary); cursor: pointer; }
        .dl-dropdown-item:hover { background: var(--bg-surface-hover); color: var(--text-primary); }
        .dl-dropdown-sep { height: 1px; background-color: var(--border-color); margin: 8px 0; }
        .dl-dropdown-danger { color: var(--danger) !important; }
        .dl-dropdown-danger:hover { color: #DC2626 !important; }
        .dl-main-content { flex: 1; overflow-y: auto; position: relative; }
        .dl-content-header { padding: 40px 48px 24px; }
        .dl-breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .dl-breadcrumb-item { color: var(--text-tertiary); font-size: 13px; font-weight: 500; }
        .dl-breadcrumb-sep { color: var(--text-tertiary); display: flex; align-items: center; opacity: 0.5; }
        .dl-breadcrumb-current { color: var(--text-secondary); font-size: 13px; font-weight: 500; }
        .dl-page-title { font-size: 28px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.5px; }
        .dl-content-area { padding: 0 48px 48px; }
        .dl-overlay { display: none; position: fixed; inset: 0; background-color: rgba(0,0,0,0.4); backdrop-filter: blur(2px); z-index: 200; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
        .dl-overlay.active { display: block; opacity: 1; pointer-events: auto; }
        @media (max-width: 1024px) { .dl-content-header { padding: 32px 32px 24px; } .dl-content-area { padding: 0 32px 32px; } }
        @media (max-width: 768px) {
          .dl-top-header { padding: 0 16px; }
          .dl-mobile-btn { display: flex; }
          .dl-search, .dl-icon-btn, .dl-divider { display: none; }
          .dl-profile .dl-business-name, .dl-profile .dl-chevron { display: none; }
          .dl-sidebar { position: fixed; top: 0; left: 0; height: 100vh; z-index: 300; transform: translateX(-100%); transition: transform 0.3s ease; box-shadow: 10px 0 25px rgba(0,0,0,0.5); }
          .dl-sidebar.open { transform: translateX(0); }
          .dl-content-header { padding: 24px 16px 16px; }
          .dl-content-area { padding: 0 16px 24px; }
          .dl-page-title { font-size: 22px; }
        }
      ` }} />

      {/* Mobile overlay */}
      <div
        className={`dl-overlay${sidebarOpen ? " active" : ""}`}
        onClick={closeSidebar}
      />

      <div className="dl-app">
        {/* Sidebar */}
        <aside className={`dl-sidebar${sidebarOpen ? " open" : ""}`}>
          <div className="dl-sidebar-header">
            <div className="dl-logo">cineze<span className="dl-logo-dot">.</span></div>
          </div>

          <div className="dl-sidebar-content">
            {NAV_GROUPS.map(group => (
              <div key={group.label} className="dl-sidebar-group">
                <h3 className="dl-sidebar-label">{group.label}</h3>
                <ul className="dl-menu">
                  {group.items.map(item => {
                    const isActive = pathname.startsWith(item.href)
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`dl-menu-item${isActive ? " active" : ""}`}
                          onClick={() => { if (window.innerWidth <= 768) closeSidebar() }}
                        >
                          <span className="dl-active-bar" />
                          <span className="dl-menu-icon">{item.icon}</span>
                          <span className="dl-menu-text">{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="dl-sidebar-footer">
            <div className="dl-theme-switcher">
              {/* Cineze Dark */}
              <button
                className={`dl-theme-btn${theme === "default" ? " active" : ""}`}
                title="Cineze Dark"
                onClick={() => setTheme("default")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
              {/* Dark Gray */}
              <button
                className={`dl-theme-btn${theme === "dark-gray" ? " active" : ""}`}
                title="Dark Gray"
                onClick={() => setTheme("dark-gray")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 0 20z" />
                </svg>
              </button>
              {/* Light */}
              <button
                className={`dl-theme-btn${theme === "light" ? " active" : ""}`}
                title="Light"
                onClick={() => setTheme("light")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* Main wrapper */}
        <div className="dl-main-wrapper">
          {/* Top header */}
          <header className="dl-top-header">
            <div className="dl-header-left">
              <button className="dl-mobile-btn" onClick={openSidebar} aria-label="Abrir menu">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12H21M3 6H21M3 18H21" />
                </svg>
              </button>
              <div className="dl-search">
                <svg className="dl-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" placeholder="Buscar ou digitar um comando..." className="dl-search-input" />
              </div>
            </div>

            <div className="dl-header-right">
              <button className="dl-icon-btn" aria-label="Notificações">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="dl-badge" />
              </button>

              <div className="dl-divider" />

              {/* User / business dropdown */}
              <div
                ref={dropdownRef}
                className={`dl-profile${dropdownOpen ? " open" : ""}`}
                onClick={e => { e.stopPropagation(); setDropdownOpen(v => !v) }}
              >
                <div className="dl-avatar">
                  <span className="dl-avatar-initials">{initials}</span>
                </div>
                <div>
                  <span className="dl-business-name">{businessName}</span>
                </div>
                <svg className="dl-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>

                <div className="dl-dropdown">
                  <div className="dl-dropdown-sep" />
                  <div className="dl-dropdown-item" onClick={() => router.push("/onboarding")}>
                    Refazer diagnóstico
                  </div>
                  <div className="dl-dropdown-sep" />
                  <div className="dl-dropdown-item dl-dropdown-danger" onClick={handleSignOut}>
                    Sair
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable content */}
          <main className="dl-main-content">
            <div className="dl-content-header">
              <div className="dl-breadcrumb">
                <span className="dl-breadcrumb-item">{group}</span>
                <span className="dl-breadcrumb-sep">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </span>
                <span className="dl-breadcrumb-current">{label}</span>
              </div>
              <h1 className="dl-page-title">{label}</h1>
            </div>

            <div className="dl-content-area">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}
