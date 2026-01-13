function EntityList({ entities }) {
  if (!entities || !entities.categorized) return null

  const getCategoryColor = (category) => {
    const colors = {
      symptoms: 'bg-red-100 text-red-800 border-red-200',
      medications: 'bg-blue-100 text-blue-800 border-blue-200',
      conditions: 'bg-purple-100 text-purple-800 border-purple-200',
      procedures: 'bg-green-100 text-green-800 border-green-200',
      anatomical: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      modifiers: 'bg-pink-100 text-pink-800 border-pink-200',
      clinical_terms: 'bg-gray-100 text-gray-800 border-gray-200',
      unknown: 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return colors[category] || colors.unknown
  }

  const getCategoryDisplayName = (category) => {
    const names = {
      symptoms: 'Symptoms',
      medications: 'Medications',
      conditions: 'Conditions',
      procedures: 'Procedures',
      anatomical: 'Anatomical',
      modifiers: 'Modifiers',
      clinical_terms: 'Clinical Terms',
      unknown: 'Unknown'
    }
    return names[category] || category
  }

  // Tooltip descriptions for each category
  const getCategoryDescription = (category) => {
    const descriptions = {
      symptoms: 'Patient-reported complaints and clinical observations',
      medications: 'Pharmaceutical treatments and drugs prescribed or mentioned',
      conditions: 'Medical diagnoses and health conditions identified',
      procedures: 'Diagnostic tests and therapeutic interventions performed',
      anatomical: 'Body parts, organs, and anatomical structures referenced',
      modifiers: 'Descriptive terms that modify medical findings',
      clinical_terms: 'General medical terminology and clinical concepts',
      unknown: 'Terms that could not be categorized automatically'
    }
    return descriptions[category] || 'Medical entity extracted from transcription'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 transition-colors duration-300">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">
        Medical Entities
      </h2>

      {/* Entity Count Summary Badge */}
      <div className="mb-4 sm:mb-6 w-full sm:w-auto sm:inline-block">
        <div className="bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-300 dark:border-indigo-700 rounded-full px-4 sm:px-6 py-3 transition-colors">
          <div className="flex items-center justify-center space-x-3">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-indigo-900 dark:text-indigo-300">
                {entities.total || 0}
              </div>
              <div className="text-xs sm:text-sm text-indigo-700 dark:text-indigo-400 font-medium">
                Medical Entities Extracted
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {entities.breakdown && (
        <div className="mb-4 sm:mb-6 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4 transition-colors">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
            Category Breakdown
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
            {Object.entries(entities.breakdown).map(([category, count]) => (
              count > 0 && (
                <div 
                  key={category}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-2 sm:px-3 py-2 border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 capitalize truncate">
                    {getCategoryDisplayName(category)}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white ml-2">
                    {count}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Entities by Category */}
      <div className="space-y-3 sm:space-y-4">
        {Object.entries(entities.categorized).map(([category, items]) => {
          if (!items || items.length === 0) return null

          return (
            <div key={category} className="slide-in">
              <h3 
                className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 capitalize cursor-help"
                title={getCategoryDescription(category)}
              >
                {getCategoryDisplayName(category)} ({items.length})
              </h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {items.map((entity, index) => (
                  <span
                    key={index}
                    className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm border ${getCategoryColor(category)} stagger-fade-in hover:shadow-md transition-shadow cursor-default`}
                    title={getCategoryDescription(category)}
                  >
                    {entity.text || entity}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default EntityList