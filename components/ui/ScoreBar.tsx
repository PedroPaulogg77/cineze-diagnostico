interface ScoreBarProps {
  score: number
  label?: string
  showValue?: boolean
  className?: string
}

export function ScoreBar({ score, label, showValue = true, className = "" }: ScoreBarProps) {
  const clampedScore = Math.min(100, Math.max(0, score))

  const getColor = (value: number) => {
    if (value >= 75) return "bg-green-500"
    if (value >= 50) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
          {showValue && (
            <span className="text-sm font-semibold text-gray-900">{clampedScore}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${getColor(clampedScore)}`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  )
}
