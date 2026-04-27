"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"

interface PedidoAnomalo {
  id: string
  created_at: string
  status: string
  email: string
  transaction_nsu: string
  order_nsu: string
  resgate_url: string
}

function AdminContent() {
  const searchParams = useSearchParams()
  const secret = searchParams.get("secret")
  
  const [pedidos, setPedidos] = useState<PedidoAnomalo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copiedId, setCopiedId] = useState("")

  useEffect(() => {
    if (!secret) {
      setError("Senha ausente na URL.")
      setLoading(false)
      return
    }

    async function fetchPedidos() {
      try {
        const res = await fetch(`/api/admin/pedidos?secret=${secret}`)
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
  }, [secret])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(""), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
        <p>Carregando...</p>
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Painel de Resgate</h1>
            <p className="text-gray-400">
              Pedidos que foram <strong className="text-green-400">PAGOS</strong>, mas o cliente <strong className="text-red-400">fechou a tela</strong> antes de informar o email.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 flex items-center gap-3">
            <span className="text-sm text-gray-400">Total de Anomalias:</span>
            <span className="text-xl font-bold text-cyan-400">{pedidos.length}</span>
          </div>
        </div>

        {pedidos.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Tudo limpo!</h3>
            <p className="text-gray-400">Nenhum cliente fugiu sem preencher o email hoje.</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800/50 border-b border-gray-800">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data do Pagamento</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Order NSU (InfinitePay)</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(pedido.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-mono text-cyan-400">{pedido.order_nsu}</span>
                          <span className="text-xs text-gray-500">Transação: {pedido.transaction_nsu}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          Aguardando Resgate
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => copyToClipboard(pedido.resgate_url, pedido.id)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            copiedId === pedido.id 
                              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                              : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30"
                          }`}
                        >
                          {copiedId === pedido.id ? (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Copiado!
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                              Copiar Link de Resgate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
