interface FormStepProps {
  title: string
  description?: string
  stepNumber: number
  totalSteps: number
  children: React.ReactNode
  onNext?: () => void
  onBack?: () => void
  loading?: boolean
}

export function FormStep({
  title,
  description,
  stepNumber,
  totalSteps,
  children,
  onNext,
  onBack,
  loading = false,
}: FormStepProps) {
  const progress = (stepNumber / totalSteps) * 100

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progresso */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            Etapa {stepNumber} de {totalSteps}
          </span>
          <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Cabeçalho */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {description && <p className="text-gray-500 mt-1">{description}</p>}
      </div>

      {/* Conteúdo */}
      <div className="space-y-4 mb-8">{children}</div>

      {/* Ações */}
      <div className="flex justify-between">
        {onBack && stepNumber > 1 ? (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Voltar
          </button>
        ) : (
          <div />
        )}
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={loading}
            className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {stepNumber === totalSteps ? "Finalizar" : "Próximo"}
          </button>
        )}
      </div>
    </div>
  )
}
