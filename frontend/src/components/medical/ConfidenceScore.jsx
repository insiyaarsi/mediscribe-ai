import { motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

/**
 * Get confidence level based on score
 */
function getConfidenceLevel(score) {
  if (score >= 80) {
    return {
      level: 'high',
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      label: 'High Confidence',
      icon: CheckCircle2
    }
  } else if (score >= 60) {
    return {
      level: 'medium',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500',
      label: 'Medium Confidence',
      icon: AlertTriangle
    }
  } else {
    return {
      level: 'low',
      color: 'text-red-600',
      bgColor: 'bg-red-500',
      label: 'Low Confidence',
      icon: XCircle
    }
  }
}

/**
 * ConfidenceScore - Display AI confidence scores
 */
export function ConfidenceScore({
  score,
  variant = 'bar',
  size = 'md',
  showLabel = true,
  showIcon = false,
  className,
  label
}) {
  const { level, color, bgColor, label: defaultLabel, icon: Icon } = getConfidenceLevel(score)
  
  const displayLabel = label || defaultLabel

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  // Bar variant
  if (variant === 'bar') {
    return (
      <div className={cn('space-y-2', className)}>
        {showLabel && (
          <div className="flex items-center justify-between">
            <span className={cn('font-medium', sizeClasses[size])}>
              {displayLabel}
            </span>
            <span className={cn('font-mono font-semibold', color, sizeClasses[size])}>
              {score}%
            </span>
          </div>
        )}
        
        <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full', bgColor)}
          />
        </div>
      </div>
    )
  }

  // Ring variant
  if (variant === 'ring') {
    const circumference = 2 * Math.PI * 40
    const strokeDashoffset = circumference - (score / 100) * circumference

    const ringSize = {
      sm: 'h-16 w-16',
      md: 'h-24 w-24',
      lg: 'h-32 w-32'
    }

    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div className={cn('relative', ringSize[size])}>
          <svg className="transform -rotate-90 w-full h-full">
            <circle
              cx="50%"
              cy="50%"
              r="40"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-gray-200"
            />
            <motion.circle
              cx="50%"
              cy="50%"
              r="40"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              className={color}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{
                strokeDasharray: circumference
              }}
            />
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-bold', color, {
              'text-xl': size === 'sm',
              'text-2xl': size === 'md',
              'text-3xl': size === 'lg'
            })}>
              {score}%
            </span>
          </div>
        </div>
        
        {showLabel && (
          <span className={cn('font-medium', sizeClasses[size])}>
            {displayLabel}
          </span>
        )}
      </div>
    )
  }

  // Badge variant
  if (variant === 'badge') {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2',
          color,
          'bg-white',
          className
        )}
      >
        {showIcon && <Icon className="h-4 w-4" />}
        <span className={cn('font-mono font-semibold', sizeClasses[size])}>
          {score}%
        </span>
        {showLabel && (
          <span className={cn('font-medium', sizeClasses[size])}>
            Confidence
          </span>
        )}
      </motion.div>
    )
  }

  // Detailed variant
  if (variant === 'detailed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'flex items-center gap-4 p-4 rounded-lg border-2',
          'bg-white shadow-sm',
          className
        )}
      >
        <div className={cn('p-3 rounded-full', bgColor, 'bg-opacity-10')}>
          <Icon className={cn('h-6 w-6', color)} />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              {displayLabel}
            </span>
            <span className={cn('font-mono font-bold text-lg', color)}>
              {score}%
            </span>
          </div>
          
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={cn('h-full', bgColor)}
            />
          </div>
        </div>
      </motion.div>
    )
  }

  return null
}

/**
 * ConfidenceScoreList - Display multiple confidence scores
 */
export function ConfidenceScoreList({
  scores,
  variant = 'bar',
  className
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {scores.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <ConfidenceScore
            score={item.score}
            label={item.label}
            variant={variant}
            showLabel
          />
        </motion.div>
      ))}
    </div>
  )
}