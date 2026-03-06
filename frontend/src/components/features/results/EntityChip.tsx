import { getEntityCategory, getEntityColors } from '../../../lib/utils'
import type { MedicalEntity } from '../../../types'
import { cn } from '../../../lib/utils'
import { useAppStore } from '../../../store/appStore'

interface Props {
  entity: MedicalEntity
}

export default function EntityChip({ entity }: Props) {
  const { preferences } = useAppStore()
  const category = getEntityCategory(entity.label)
  const colors   = getEntityColors(category, preferences.darkMode)

  return (
    <span
      className={cn(
        'inline-flex items-center px-[10px] py-[4px]',
        'rounded-[6px] text-[12px] font-medium',
        'cursor-default transition-transform duration-[140ms] hover:-translate-y-px',
        'border-l-[3px] border-l-transparent', // width always present; color via inline style
      )}
      style={{
        backgroundColor:  colors.bg,
        borderLeftColor:  colors.border,
        color:            colors.text,
      }}
    >
      {entity.text}
    </span>
  )
}