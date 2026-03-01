import Link from "next/link"

const navItems = [
  { href: "/dashboard/raio-x", label: "Raio-X do Negócio", icon: "📊" },
  { href: "/dashboard/maturidade", label: "Maturidade Digital", icon: "💻" },
  { href: "/dashboard/mercado", label: "Mercado e Concorrência", icon: "🏆" },
  { href: "/dashboard/empresa", label: "Empresa e Cultura", icon: "🏢" },
  { href: "/dashboard/comunicacao", label: "Comunicação", icon: "📣" },
  { href: "/dashboard/objetivos", label: "Objetivos", icon: "🎯" },
  { href: "/dashboard/plano", label: "Plano de Ação", icon: "🗺️" },
]

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">Cineze</h1>
        <p className="text-sm text-gray-500">Diagnóstico Empresarial</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* TODO: adicionar info do usuário e logout */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-700">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Usuário</p>
            <p className="text-xs text-gray-500 truncate">usuario@email.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
