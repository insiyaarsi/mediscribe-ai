/**
 * EntityList Component
 * Displays color-coded medical entities organized by category
 * 
 * Props:
 * - entities: Object containing entity breakdown and categorized entities
 */
function EntityList({ entities }) {
  if (!entities) return null;

  // Map categories to Tailwind color classes
  const getCategoryColor = (category) => {
    const colors = {
      symptoms: 'bg-red-100 text-red-800',
      medications: 'bg-blue-100 text-blue-800',
      conditions: 'bg-purple-100 text-purple-800',
      procedures: 'bg-green-100 text-green-800',
      anatomical: 'bg-yellow-100 text-yellow-800',
      modifiers: 'bg-pink-100 text-pink-800',
      clinical_terms: 'bg-gray-100 text-gray-800',
      unknown: 'bg-orange-100 text-orange-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Get display name for category
  const getCategoryDisplayName = (category) => {
    const names = {
      symptoms: 'Symptoms',
      medications: 'Medications',
      conditions: 'Conditions',
      procedures: 'Procedures',
      anatomical: 'Anatomical Terms',
      modifiers: 'Clinical Modifiers',
      clinical_terms: 'Clinical Terms',
      unknown: 'Unknown/Other',
    };
    return names[category] || category;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Medical Entities Extracted</h2>

      {/* Summary Statistics */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <p className="text-lg font-semibold text-blue-900">
          Total Entities: {entities.total || 0}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
          {Object.entries(entities.breakdown || {}).map(([category, count]) => (
            <div key={category} className="text-gray-700">
              <span className="font-medium">{getCategoryDisplayName(category)}:</span> {count}
            </div>
          ))}
        </div>
      </div>

      {/* Categorized Entities */}
      <div className="space-y-6">
        {Object.entries(entities.categorized || {}).map(([category, entityList]) => {
          if (!entityList || entityList.length === 0) return null;

          return (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {getCategoryDisplayName(category)} ({entityList.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {entityList.map((entity, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(category)}`}
                  >
                    {entity.text || entity}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EntityList;