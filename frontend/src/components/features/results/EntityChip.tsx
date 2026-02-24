import { getEntityCategory, getEntityStyles } from '../../../lib/utils'
import type { MedicalEntity } from '../../../types'
import { cn } from '../../../lib/utils'

interface Props {
  entity: MedicalEntity
}

export default function EntityChip({ entity }: Props) {
  const category = getEntityCategory(entity.label)
  const styles   = getEntityStyles(category)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-[10px] py-[4px]',
        'rounded-[6px] text-[12px] font-medium border-l-[3px]',
        'cursor-default transition-transform duration-[140ms] hover:-translate-y-px',
        styles.bg, styles.border, styles.text
      )}
    >
      {entity.text}
    </span>
  )
}
