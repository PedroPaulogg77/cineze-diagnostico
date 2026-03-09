"use client"

import { useState } from "react"

export default function AdminPage() {
  const [senha, setSenha] = useState("")
  const [email, setEmail] = useState("")
  const [autenticado, setAutenticado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<{ tipo: "sucesso" | "erro"; mensagem: string } | null>(null)

  function handleAutenticar(e: React.FormEvent) {
    e.preventDefault()
    if (!senha.trim()) return
    setAutenticado(true)
  }

  async function handleRevogar(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setResultado(null)

    try {
      const res = await fetch("/api/admin/revogar-acesso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${senha}`,
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (res.ok) {
        setResultado({ tipo: "sucesso", mensagem: `Acesso revogado com sucesso para ${data.email}` })
        setEmail("")
      } else {
        setResultado({ tipo: "erro", mensagem: data.error || "Erro desconhecido" })
      }
    } catch {
      setResultado({ tipo: "erro", mensagem: "Erro de rede — verifique a conexão" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md">
        <h1 className="text-xl font-semibold text-white mb-6">Painel Admin — Cineze</h1>

        {!autenticado ? (
          <form onSubmit={handleAutenticar} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Senha admin</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite a senha"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Entrar
            </button>
          </form>
        ) : (
          <form onSubmit={handleRevogar} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email do usuário</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {loading ? "Revogando..." : "Revogar Acesso"}
            </button>

            {resultado && (
              <div
                className={`rounded-lg px-4 py-3 text-sm font-medium ${
                  resultado.tipo === "sucesso"
                    ? "bg-green-900/50 border border-green-700 text-green-300"
                    : "bg-red-900/50 border border-red-700 text-red-300"
                }`}
              >
                {resultado.mensagem}
              </div>
            )}

            <button
              type="button"
              onClick={() => { setAutenticado(false); setSenha(""); setResultado(null) }}
              className="w-full text-sm text-gray-500 hover:text-gray-400 py-1"
            >
              Sair
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
