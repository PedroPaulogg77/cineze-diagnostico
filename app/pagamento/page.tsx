export default function PagamentoPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg p-8 bg-white rounded-2xl shadow-lg text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">📊</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Desbloqueie seu Diagnóstico Empresarial
        </h1>
        <p className="text-gray-500 mb-8">
          Acesso completo ao diagnóstico personalizado da sua empresa gerado por inteligência artificial.
        </p>

        <ul className="text-left space-y-3 mb-8">
          {[
            "Raio-X completo do seu negócio",
            "Análise de maturidade digital",
            "Posicionamento de mercado",
            "Plano de ação personalizado",
            "Objetivos SMART",
            "Métricas e KPIs recomendados",
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
              <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>

        {/* TODO: conectar ao InfinitePay via /api/pagamento/webhook */}
        <button
          type="button"
          className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-base"
        >
          Comprar agora
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Pagamento seguro. Acesso imediato após confirmação.
        </p>
      </div>
    </main>
  )
}
