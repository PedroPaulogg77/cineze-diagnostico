"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"

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
      { href: "/dashboard/raio-x", label: "Raio X do negócio", icon: IconRaiox },
      { href: "/dashboard/maturidade", label: "Maturidade Digital", icon: IconMaturidade },
      { href: "/dashboard/mercado", label: "Análise de mercado", icon: IconMercado },
      { href: "/dashboard/empresa", label: "Sobre sua empresa", icon: IconEmpresa },
      { href: "/dashboard/comunicacao", label: "Auditoria de comunic.", icon: IconComunicacao },
    ],
  },
  {
    label: "PLANO DE AÇÃO",
    items: [
      { href: "/dashboard/objetivos", label: "Objetivos", icon: IconObjetivos },
      { href: "/dashboard/plano", label: "Plano de ação", icon: IconPlano },
      { href: "/dashboard/metricas", label: "Métricas", icon: IconMetricas },
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
    const supabase = createBrowserSupabaseClient()
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
    const supabase = createBrowserSupabaseClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        :root {
          --blue-primary: #0066FF;
          --blue-light: #4D94FF;
          --blue-dark: #0047B3;
          --blue-transparent: rgba(0, 102, 255, 0.12);
          
          /* Dark Glass Theme */
          --bg-surface: rgba(15, 23, 42, 0.6);
          --bg-surface-hover: rgba(30, 41, 59, 0.7);
          --border-color: rgba(255, 255, 255, 0.08);
          --border-color-light: rgba(255, 255, 255, 0.12);
          --text-primary: #FFFFFF; 
          --text-secondary: #94A3B8; 
          --text-tertiary: #64748B;
          
          --danger: #EF4444; 
          --shadow-dropdown: 0 20px 40px -10px rgba(0,0,0,0.5);
          --sidebar-width: 260px; 
          --header-height: 76px;
        }
        :root[data-theme="light"] {
          /* Light Glass Theme */
          --bg-surface: rgba(255, 255, 255, 0.6);
          --bg-surface-hover: rgba(255, 255, 255, 0.8);
          --border-color: rgba(255, 255, 255, 0.4);
          --border-color-light: rgba(255, 255, 255, 0.6);
          --text-primary: #0F172A; 
          --text-secondary: #475569; 
          --text-tertiary: #94A3B8;
          --blue-transparent: rgba(0, 102, 255, 0.08);
          --shadow-dropdown: 0 20px 40px -10px rgba(0,0,0,0.08);
        }
        body { 
          font-family: var(--font-sora), system-ui, sans-serif; 
          color: var(--text-primary); 
          overflow: hidden; 
          -webkit-font-smoothing: antialiased; 
          background: #020617; /* Fallback */
        }
        :root[data-theme="light"] body {
          background: #F8FAFC;
        }
        /* Mesh Gradient Background */
        .dl-app { 
          display: flex; position: fixed; inset: 0; overflow: hidden;
        }
        .dl-app::before {
          content: "";
          position: absolute;
          inset: -50%;
          z-index: -1;
          background-image: 
            radial-gradient(circle at 15% 50%, rgba(0, 102, 255, 0.15), transparent 25%),
            radial-gradient(circle at 85% 30%, rgba(0, 102, 255, 0.12), transparent 25%);
          filter: blur(80px);
          animation: meshPulse 20s ease-in-out infinite alternate;
        }
        :root[data-theme="light"] .dl-app::before {
          background-image: 
            radial-gradient(circle at 15% 50%, rgba(0, 102, 255, 0.08), transparent 25%),
            radial-gradient(circle at 85% 30%, rgba(0, 102, 255, 0.05), transparent 25%);
        }
        @keyframes meshPulse {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.1) translate(-2%, 2%); }
        }

        /* Glassmorphism Classes - MOBILE FIRST BASE */
        .dl-sidebar { 
          position: fixed;
          top: 0;
          left: 0;
          height: 100%;
          width: var(--sidebar-width); 
          background-color: var(--bg-surface); 
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid var(--border-color); 
          display: flex; flex-direction: column; flex-shrink: 0; 
          z-index: 300; 
          transform: translateX(-100%); 
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
          box-shadow: none;
        }
        .dl-sidebar.open { transform: translateX(0); box-shadow: 10px 0 25px rgba(0,0,0,0.4); }
        .dl-sidebar-header { height: var(--header-height); display: flex; align-items: center; padding: 0 24px; }
        .dl-logo { font-weight: 700; font-size: 22px; color: var(--text-primary); letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;}
        .dl-logo-dot { color: var(--blue-primary); }
        .dl-sidebar-content { flex: 1; overflow-y: auto; padding: 24px 16px; }
        .dl-sidebar-content::-webkit-scrollbar { width: 4px; }
        .dl-sidebar-content::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
        .dl-sidebar-group { margin-bottom: 24px; }
        .dl-sidebar-label { color: var(--text-tertiary); font-size: 12px; font-weight: 700; margin-bottom: 16px; padding-left: 12px; text-transform: uppercase; letter-spacing: 0.1em;}
        .dl-menu { list-style: none; padding: 0; margin: 0; }
        .dl-menu-item { position: relative; display: flex; align-items: center; gap: 14px; padding: 14px; border-radius: 12px; color: var(--text-secondary); cursor: pointer; margin-bottom: 4px; text-decoration: none; transition: all 0.2s ease; font-weight: 500; border: 1px solid transparent; }
        .dl-menu-item:active { transform: scale(0.98); }
        .dl-menu-item:hover { color: var(--text-primary); background-color: var(--bg-surface-hover); border-color: var(--border-color); }
        .dl-menu-item:hover .dl-menu-icon { color: var(--text-primary); opacity: 1; transform: scale(1.05); }
        .dl-menu-item.active { color: var(--blue-primary); background-color: var(--blue-transparent); font-weight: 600; border-color: rgba(0,102,255,0.2); box-shadow: inset 0 0 12px rgba(0,102,255,0.05); }
        .dl-menu-item.active .dl-menu-icon { color: var(--blue-primary); opacity: 1; }
        .dl-menu-icon { color: var(--text-secondary); opacity: 0.8; transition: all 0.2s ease; }
        .dl-menu-text { font-size: 15px; }
        .dl-sidebar-footer { padding: 16px; border-top: 1px solid var(--border-color); }
        
        /* Mobile Theme Switcher */
        .dl-theme-switcher { display: flex; gap: 8px; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.1); padding: 6px; border-radius: 14px; border: 1px solid var(--border-color); }
        :root[data-theme="light"] .dl-theme-switcher { background: rgba(0,0,0,0.02); }
        .dl-theme-btn { background: transparent; border: 1px solid transparent; cursor: pointer; padding: 10px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex: 1; color: var(--text-secondary); transition: all 0.2s; }
        .dl-theme-btn:active { transform: scale(0.95); }
        .dl-theme-btn.active { background: var(--bg-surface); color: var(--blue-primary); border-color: var(--border-color); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        
        .dl-main-wrapper { flex: 1; display: flex; flex-direction: column; min-width: 0; background-color: transparent; }
        
        /* Mobile Top Header Base */
        .dl-top-header { 
          height: 64px; 
          background-color: var(--bg-surface); 
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-color); 
          display: flex; align-items: center; justify-content: space-between; padding: 0 16px; flex-shrink: 0; z-index: 90;
        }
        .dl-header-left { display: flex; align-items: center; gap: 16px; flex: 1; }
        .dl-mobile-btn { display: flex; background: none; border: none; color: var(--text-primary); cursor: pointer; padding: 12px; border-radius: 8px; margin-left: -12px;}
        .dl-mobile-btn:active { background: var(--bg-surface-hover); }
        
        /* Hidden on Mobile by default */
        .dl-search, .dl-icon-btn, .dl-divider { display: none; }
        .dl-profile .dl-business-name, .dl-profile .dl-chevron { display: none; }
        
        .dl-header-right { display: flex; align-items: center; gap: 12px; }
        .dl-profile { display: flex; align-items: center; gap: 0; cursor: pointer; padding: 2px; border-radius: 12px; position: relative; background: transparent; border: none; transition: all 0.2s; }
        .dl-avatar { width: 34px; height: 34px; border-radius: 10px; background: var(--blue-transparent); border: 1px solid rgba(0,102,255,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--blue-primary); }
        .dl-avatar-initials { font-size: 13px; font-weight: 700; }
        
        /* Main Content Base (Mobile) */
        .dl-main-content { flex: 1; overflow-y: auto; position: relative; }
        .dl-content-header { padding: 24px 16px 16px; }
        .dl-breadcrumb { display: none; }
        .dl-page-title { margin: 0; font-size: 22px; font-weight: 700; color: var(--text-primary); letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px; line-height: 1.2; }
        
        /* Glass Card Utilities - Mobile Base */
        .dl-glass-card {
           background: var(--bg-surface);
           backdrop-filter: blur(16px);
           -webkit-backdrop-filter: blur(16px);
           border: 1px solid var(--border-color);
           border-radius: 16px;
           box-shadow: 0 4px 24px -8px rgba(0,0,0,0.1);
        }
        .dl-content-area { padding: 0 16px 32px; margin-top: 12px; }
        .dl-overlay { display: none; position: fixed; inset: 0; background-color: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 200; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
        .dl-overlay.active { display: block; opacity: 1; pointer-events: auto; }
        
        .dl-dropdown { display: none; position: absolute; top: calc(100% + 12px); right: 0; background: var(--bg-surface); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--border-color); border-radius: 16px; min-width: 220px; box-shadow: var(--shadow-dropdown); padding: 8px 0; z-index: 200; }
        .dl-profile.open .dl-dropdown { display: block; animation: dlFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes dlFadeIn { from { opacity: 0; transform: translateY(-8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .dl-dropdown-item { padding: 12px 20px; font-size: 14px; font-weight: 500; color: var(--text-secondary); cursor: pointer; transition: background 0.15s, color 0.15s; }
        .dl-dropdown-item:active { background: var(--bg-surface-hover); color: var(--text-primary); }
        .dl-dropdown-sep { height: 1px; background-color: var(--border-color); margin: 8px 0; }
        .dl-dropdown-danger { color: var(--danger) !important; }

        /* DESKTOP SCALING (Tablets & Up) */
        @media (min-width: 768px) {
          .dl-sidebar {
            position: relative;
            transform: translateX(0);
            box-shadow: none;
            height: 100%;
          }
          .dl-sidebar-header { padding: 0 28px; }
          .dl-logo { font-size: 24px; }
          .dl-sidebar-content { padding: 28px 20px; }
          .dl-menu-item { padding: 12px 14px; }
          .dl-menu-item:hover { transform: none; }
          .dl-theme-btn:hover { transform: none; }
          
          .dl-top-header { height: var(--header-height); padding: 0 32px; }
          .dl-mobile-btn { display: none; }
          
          .dl-search, .dl-icon-btn, .dl-divider { display: flex; }
          .dl-search { align-items: center; width: 100%; max-width: 420px; background: rgba(0,0,0,0.1); padding: 12px 20px; border-radius: 16px; transition: all 0.2s; border: 1px solid var(--border-color); box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);}
          :root[data-theme="light"] .dl-search { background: rgba(255,255,255,0.4); }
          .dl-search:focus-within { border-color: var(--blue-primary); background: var(--bg-surface); box-shadow: 0 0 0 3px var(--blue-transparent); }
          .dl-search-icon { color: var(--text-tertiary); margin-right: 12px; flex-shrink: 0; }
          .dl-search-input { flex: 1; background: transparent; border: none; outline: none; color: var(--text-primary); font-size: 14px; font-family: inherit; }
          
          .dl-icon-btn { background: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-secondary); padding: 10px; border-radius: 12px; }
          .dl-icon-btn:hover { color: var(--text-primary); background: var(--bg-surface-hover); border-color: var(--border-color-light); transform: translateY(-1px); }
          .dl-badge { position: absolute; top: -4px; right: -4px; width: 10px; height: 10px; background-color: var(--danger); border-radius: 50%; border: 2px solid var(--border-color); }
          .dl-divider { width: 1px; height: 32px; background-color: var(--border-color); margin: 0 8px; }
          
          .dl-profile { gap: 14px; padding: 6px 16px 6px 6px; border-radius: 16px; background: var(--bg-surface); border: 1px solid var(--border-color); }
          .dl-profile:hover { background: var(--bg-surface-hover); border-color: var(--border-color-light); transform: translateY(-1px); }
          .dl-profile .dl-business-name, .dl-profile .dl-chevron { display: flex; }
          .dl-business-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
          .dl-chevron { color: var(--text-tertiary); }
          
          .dl-content-header { padding: 48px 40px 24px; display: flex; }
          .dl-content-area { padding: 0 40px 40px; margin-top: 16px; }
          .dl-glass-card { border-radius: 20px; }
          .dl-page-title { font-size: 26px; gap: 10px; line-height: 1.3; }
          .dl-dropdown-item:hover { background: var(--bg-surface-hover); color: var(--text-primary); }
        }
        
        /* LARGE DESKTOP SCALING */
        @media (min-width: 1024px) {
          .dl-content-header { padding: 48px 48px 24px; }
          .dl-content-area { padding: 0 48px 48px; }
          .dl-page-title { font-size: 28px; }
        }

        /* Prevent Text Break Layout Jumps */
        .dl-page-title-text { white-space: normal; word-break: break-word; line-height: 1.15; }
        .dl-content-header { min-height: 40px; }
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
            <div className="dl-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
              Plan<span className="dl-logo-dot">.</span>
            </div>
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
              {/* Default Theme */}
              <button
                className={`dl-theme-btn${theme === "default" ? " active" : ""}`}
                title="Glass Dark"
                onClick={() => setTheme("default")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
              {/* Light */}
              <button
                className={`dl-theme-btn${theme === "light" ? " active" : ""}`}
                title="Glass Light"
                onClick={() => setTheme("light")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            <div className="dl-content-header" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "32px 20px 0" }}>
              <h1 className="dl-page-title">
                <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>{group}</span>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--blue-primary)", flexShrink: 0, marginTop: "10px" }} />
                <span className="dl-page-title-text" style={{ paddingRight: "10px" }}>{label}</span>
              </h1>
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
