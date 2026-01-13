function ConfidenceBar({ score, darkMode }) {
  if (!score && score !== 0) return null

  const percentage = Math.round(score * 100)
  
  // Determine color based on confidence level
  const getColorClasses = () => {
    if (percentage >= 80) {
      return {
        bg: 'bg-green-500 dark:bg-green-400',
        text: 'text-green-900 dark:text-green-100',
        border: 'border-green-300 dark:border-green-600',
        bgLight: 'bg-green-50 dark:bg-green-900/40'
      }
    } else if (percentage >= 60) {
      return {
        bg: 'bg-yellow-500 dark:bg-yellow-400',
        text: 'text-yellow-900 dark:text-yellow-100',
        border: 'border-yellow-300 dark:border-yellow-600',
        bgLight: 'bg-yellow-50 dark:bg-yellow-900/40'
      }
    } else {
      return {
        bg: 'bg-orange-500 dark:bg-orange-400',
        text: 'text-orange-900 dark:text-orange-100',
        border: 'border-orange-300 dark:border-orange-600',
        bgLight: 'bg-orange-50 dark:bg-orange-900/40'
      }
    }
  }

  const colors = getColorClasses()

  return (
    <div className={`${colors.bgLight} border ${colors.border} rounded-lg p-4 mt-4 mb-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-semibold ${colors.text}`}>
          Validation Confidence
        </span>
        <span className={`text-sm font-bold ${colors.text}`}>
          {percentage}%
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div 
          className={`${colors.bg} h-3 rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-700 dark:text-gray-300 mt-2">
        {percentage >= 80 && 'High confidence - Strong medical content detected'}
        {percentage >= 60 && percentage < 80 && 'Moderate confidence - Some medical content detected'}
        {percentage < 60 && 'Low confidence - Limited medical content detected'}
      </p>
    </div>
  )
}

export default ConfidenceBar