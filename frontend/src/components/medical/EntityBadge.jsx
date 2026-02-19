import { motion } from 'framer-motion'
import { 
  AlertCircle, 
  Pill, 
  Stethoscope, 
  Activity, 
  FlaskConical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

// Icon mapping for each category
const categoryIcons = {
  symptom: AlertCircle,
  medication: Pill,
  condition: Stethoscope,
  procedure: Activity,
  test: FlaskConical,
}

// Color classes for each category
const categoryColors = {
  symptom: 'bg-medical-symptom-light text-medical-symptom-dark border-medical-symptom hover:bg-medical-symptom/10',
  medication: 'bg-medical-medication-light text-medical-medication-dark border-medical-medication hover:bg-medical-medication/10',
  condition: 'bg-medical-condition-light text-medical-condition-dark border-medical-condition hover:bg-medical-condition/10',
  procedure: 'bg-medical-procedure-light text-medical-procedure-dark border-medical-procedure hover:bg-medical-procedure/10',
  test: 'bg-medical-test-light text-medical-test-dark border-medical-test hover:bg-medical-test/10',
}

// Label mapping
const categoryLabels = {
  symptom: 'Symptom',
  medication: 'Medication',
  condition: 'Condition',
  procedure: 'Procedure',
  test: 'Test',
}

/**
 * EntityBadge - A color-coded badge for medical entities
 */
export function EntityBadge({
  text,
  category,
  confidence,
  onClick,
  className,
  showIcon = true,
  showConfidence = false,
  variant = 'default'
}) {
  const Icon = categoryIcons[category]
  const colorClass = categoryColors[category]
  
  // Confidence color based on score
  const getConfidenceColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <motion.span
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border',
          colorClass,
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        {showIcon && <Icon className="h-3 w-3" />}
        <span>{text}</span>
      </motion.span>
    )
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        className={cn(
          'flex flex-col gap-1 p-3 rounded-lg border-2 transition-all',
          colorClass,
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          {showIcon && <Icon className="h-4 w-4" />}
          <span className="text-xs uppercase font-semibold tracking-wide opacity-70">
            {categoryLabels[category]}
          </span>
        </div>
        
        <div className="font-semibold text-base">{text}</div>
        
        {showConfidence && confidence !== undefined && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-white/50 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={cn(
                  'h-full',
                  getConfidenceColor(confidence).replace('text-', 'bg-')
                )}
              />
            </div>
            <span className={cn('text-xs font-mono', getConfidenceColor(confidence))}>
              {confidence}%
            </span>
          </div>
        )}
      </motion.div>
    )
  }

  // Default variant
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium border transition-all',
        colorClass,
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {showIcon && <Icon className="h-4 w-4" />}
      
      <span className="text-sm">{text}</span>
      
      {showConfidence && confidence !== undefined && (
        <span className={cn('text-xs font-mono ml-1', getConfidenceColor(confidence))}>
          ({confidence}%)
        </span>
      )}
    </motion.div>
  )
}

/**
 * EntityBadgeList - Displays a list of entity badges
 */
export function EntityBadgeList({
  entities,
  variant = 'default',
  showIcons = true,
  showConfidence = false,
  onEntityClick,
  className
}) {
  return (
    <div className={cn(
      'flex flex-wrap gap-2',
      variant === 'detailed' && 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      className
    )}>
      {entities.map((entity, index) => (
        <EntityBadge
          key={`${entity.category}-${entity.text}-${index}`}
          text={entity.text}
          category={entity.category}
          confidence={entity.confidence}
          variant={variant}
          showIcon={showIcons}
          showConfidence={showConfidence}
          onClick={() => onEntityClick?.(entity)}
        />
      ))}
    </div>
  )
}

/**
 * EntityCategorySummary - Shows count of entities by category
 */
export function EntityCategorySummary({ entities, className }) {
  const categoryCounts = entities.reduce((acc, entity) => {
    acc[entity.category] = (acc[entity.category] || 0) + 1
    return acc
  }, {})

  const categories = ['symptom', 'medication', 'condition', 'procedure', 'test']

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4', className)}>
      {categories.map((category) => {
        const count = categoryCounts[category] || 0
        const Icon = categoryIcons[category]
        
        return (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-lg border-2',
              categoryColors[category]
            )}
          >
            <Icon className="h-6 w-6" />
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-xs uppercase font-semibold tracking-wide">
              {categoryLabels[category]}s
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}