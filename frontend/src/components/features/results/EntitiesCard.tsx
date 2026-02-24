import { useAppStore } from '../../../store/appStore'
import { groupEntities, getEntityStyles, getEntityCategory } from '../../../lib/utils'
import EntityChip from './EntityChip'
import type { EntityCategory } from '../../../types'

const CATEGORY_LABELS: Record<EntityCategory, string> = {
  SYMPTOM:    'Symptoms',
  MEDICATION: 'Medications',
  CONDITION:  'Conditions',
  PROCEDURE:  'Procedures',
  TEST:       'Tests & Diagnostics',
  OTHER:      'Other',
}

const CATEGORY_ORDER: EntityCategory[] = [
  'SYMPTOM', 'MEDICATION', 'CONDITION', 'PROCEDURE', 'TEST', 'OTHER'
]

export default function EntitiesCard() {
  const { transcriptionResult } = useAppStore()

  if (!transcriptionResult) return null

  const grouped = groupEntities(transcriptionResult.entities)
  const totalCount = transcriptionResult.entities.length

  const groupMap: Record<EntityCategory, typeof grouped.symptoms> = {
    SYMPTOM:    grouped.symptoms,
    MEDICATION: grouped.medications,
    CONDITION:  grouped.conditions,
    PROCEDURE:  grouped.procedures,
    TEST:       grouped.tests,
    OTHER:      grouped.other,
  }

  // Only render categories that have at least one entity
  const activeCategories = CATEGORY_ORDER.filter(cat => groupMap[cat].length > 0)

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-[18px] py-[13px] border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2 font-head text-[13px] font-semibold text-[#0D1B2A]">
          <div className="w-[8px] h-[8px] rounded-full bg-[#0BA871]" />
          Medical Entities
          <span className="text-[11px] bg-[#F7FAFC] border border-[#E2E8F0] px-[7px] py-[2px] rounded-[10px] text-[#94A3B8] font-mono ml-1">
            {totalCount}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-[18px] py-[16px]">
        {totalCount === 0 ? (
          <p className="text-[13px] text-[#94A3B8] italic">
            No medical entities were extracted from this transcription.
          </p>
        ) : (
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            {activeCategories.map(cat => {
              const styles = getEntityStyles(cat)
              return (
                <div key={cat} className="min-w-[140px]">
                  {/* Category header */}
                  <div className="flex items-center gap-[6px] mb-2">
                    <div className={`w-[7px] h-[7px] rounded-full flex-shrink-0 ${styles.dot}`} />
                    <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-[#94A3B8]">
                      {CATEGORY_LABELS[cat]}
                    </span>
                  </div>
                  {/* Chips */}
                  <div className="flex flex-wrap gap-[5px]">
                    {groupMap[cat].map((entity, i) => (
                      <EntityChip key={`${entity.text}-${i}`} entity={entity} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
