"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

interface PedidoAdmin {
  id: string
  created_at: string
  status: string
  email: string
  transaction_nsu: string
  order_nsu: string
  resgate_url: string
  is_placeholder: boolean
  ultimo_login: string | null
  ultima_atividade: string | null
  tem_conta: boolean
}

function AdminContent() {
  const [pedidos, setPedidos] = useState<PedidoAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copiedId, setCopiedId] = useState("")

  useEffect(() => {
    async function fetchPedidos() {
      try {
        const res = await fetch(`/api/admin/pedidos`)
        if (!res.ok) {
          throw new Error("Acesso negado ou erro no servidor.")
        }
        const data = await res.json()
        setPedidos(data.pedidos || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPedidos()
  }, [])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(""), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <p className="animate-pulse">Carregando radar de pedidos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Radar de Pedidos</h1>
            <p className="text-gray-400">
              Monitoramento em tempo real de vendas e ativação de contas.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-6 py-3 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Pago</span>
              <span className="text-2xl font-bold text-white">{pedidos.length}</span>
            </div>
            <div className="w-px h-10 bg-gray-800" />
            <div className="flex flex-col">
              <span className="text-xs text-red-500 uppercase tracking-wider font-semibold">Sem Acesso</span>
              <span className="text-2xl font-bold text-red-400">{pedidos.filter(p => !p.tem_conta).length}</span>
            </div>
          </div>
        </div>

        {pedidos.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Nenhum pedido encontrado</h3>
            <p className="text-gray-400">As vendas ainda não começaram a cair.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800/50 border-b border-gray-800">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente / Email</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status de Acesso</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Última Atividade</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {pedidos.map((pedido) => {
                    const emRisco = !pedido.tem_conta || (!pedido.ultimo_login && !pedido.ultima_atividade)
                    
                    return (
                      <tr key={pedido.id} className={`hover:bg-gray-800/20 transition-colors ${emRisco ? "bg-red-500/[0.02]" : ""}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                          <br />
                          <span className="text-xs">{new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            {pedido.is_placeholder ? (
                              <span className="text-sm font-medium text-red-400">Email não informado</span>
                            ) : (
                              <span className="text-sm font-medium text-gray-200">{pedido.email}</span>
                            )}
                            <span className="text-[10px] text-gray-500 font-mono uppercase">NSU: {pedido.order_nsu}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {pedido.tem_conta ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                              Conta Ativa
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 w-fit">
                                Sem Acesso
                              </span>
                              <span className="text-[10px] text-red-500 font-bold uppercase animate-pulse">EM RISCO DE REEMBOLSO</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {pedido.ultima_atividade || pedido.ultimo_login ? (
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-300">
                                {new Date(pedido.ultima_atividade || pedido.ultimo_login!).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-600">Nunca acessou</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => copyToClipboard(pedido.resgate_url, pedido.id)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                              copiedId === pedido.id 
                                ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                                : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30"
                            }`}
                          >
                            {copiedId === pedido.id ? "Copiado!" : "Link de Resgate"}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
            <div className="bg-gray-800/30 px-6 py-4 border-t border-gray-800 text-sm text-gray-400">
              <strong>Como resolver:</strong> Pegue o <code>Order NSU</code> acima, busque no painel da InfinitePay quem foi o cliente que pagou, chame-o no WhatsApp e envie o <strong>Link de Resgate</strong> copiado.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Carregando painel...</div>}>
      <AdminContent />
    </Suspense>
  )
}
