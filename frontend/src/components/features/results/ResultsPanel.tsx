import { useEffect, useRef } from 'react'
import { useAppStore } from '../../../store/appStore'
import { cn } from '../../../lib/utils'
import TranscriptionCard from './TranscriptionCard'
import EntitiesCard from './EntitiesCard'
import SOAPNoteCard from './SOAPNoteCard'

export default function ResultsPanel() {
  const { uploadState, transcriptionResult, preferences } = useAppStore()
  const panelRef = useRef<HTMLDivElement>(null)

  const isVisible = uploadState === 'done' && transcriptionResult !== null

  useEffect(() => {
    if (isVisible && preferences.autoScroll && panelRef.current) {
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [isVisible, preferences.autoScroll])

  if (!isVisible) return null

  return (
    <div
      ref={panelRef}
      className={cn(
        'flex flex-col animate-fade-up',
        preferences.compactView ? 'gap-2' : 'gap-4'
      )}
    >
      {/* Compact view banner */}
      {preferences.compactView && (
        <div className="text-[11px] text-[#94A3B8] font-medium px-1">
          Compact view enabled — switch off in Settings → Preferences
        </div>
      )}
      <TranscriptionCard compact={preferences.compactView} />
      <EntitiesCard      compact={preferences.compactView} />
      <SOAPNoteCard      compact={preferences.compactView} />
    </div>
  )
}