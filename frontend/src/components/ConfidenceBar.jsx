function ConfidenceBar({ score, darkMode }) {
  if (score === null || score === undefined) return null

  // Convert to percentage if it's a decimal (0-1 range)
  let percentage = score
  if (score <= 1) {
    percentage = Math.round(score * 100)
  }

  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  const getTextColor = () => {
    if (percentage >= 80) return 'text-green-800 dark:text-green-200'
    if (percentage >= 60) return 'text-yellow-800 dark:text-yellow-200'
    return 'text-orange-800 dark:text-orange-200'
  }

  const getLabel = () => {
    if (percentage >= 80) return 'High confidence - Strong medical content detected'
    if (percentage >= 60) return 'Moderate confidence - Medical content detected'
    return 'Low confidence - Limited medical content'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">
          Validation Confidence
        </h3>
        <span className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 sm:h-4 mb-2 overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Label */}
      <p className={`text-xs sm:text-sm ${getTextColor()} transition-colors`}>
        {getLabel()}
      </p>
    </div>
  )
}

export default ConfidenceBar