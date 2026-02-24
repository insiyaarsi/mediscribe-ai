import { useEffect, useRef } from 'react'
import { useAppStore } from '../../../store/appStore'
import TranscriptionCard from './TranscriptionCard'
import EntitiesCard from './EntitiesCard'
import SOAPNoteCard from './SOAPNoteCard'

export default function ResultsPanel() {
  const { uploadState, transcriptionResult } = useAppStore()
  const panelRef = useRef<HTMLDivElement>(null)

  const isVisible = uploadState === 'done' && transcriptionResult !== null

  // Auto-scroll to results when they appear
  useEffect(() => {
    if (isVisible && panelRef.current) {
      setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div
      ref={panelRef}
      className="flex flex-col gap-4 animate-fade-up"
    >
      <TranscriptionCard />
      <EntitiesCard />
      <SOAPNoteCard />
    </div>
  )
}