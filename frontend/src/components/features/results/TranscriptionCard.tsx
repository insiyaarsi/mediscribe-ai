import { useState, useEffect } from 'react'
import { useAppStore } from '../../../store/appStore'
import { formatConfidence } from '../../../lib/utils'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../../lib/utils'

interface TranscriptionCardProps {
  compact?: boolean
}

export default function TranscriptionCard({ compact: _compact = false }: TranscriptionCardProps) {
  const { transcriptionResult, preferences } = useAppStore()
  const [copied, setCopied] = useState(false)
  const dark = preferences.darkMode
  const transcription = transcriptionResult?.transcription ?? ''
  const confidence_score = transcriptionResult?.confidence_score ?? 0
  const confidence = confidence_score > 1 ? confidence_score : confidence_score * 100

  // Auto-copy when preference is enabled
  useEffect(() => {
    if (transcriptionResult && preferences.autoCopy && transcription) {
      navigator.clipboard.writeText(transcription).then(() => {
        toast.success('Transcription auto-copied to clipboard')
      })
    }
  }, [transcriptionResult, transcription, preferences.autoCopy])

  if (!transcriptionResult) return null

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcription)
    setCopied(true)
    toast.success('Transcription copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const renderTranscription = () => {
    const lines = transcription.split('\n').filter(Boolean)
    if (lines.length === 0) return (
      <p className={cn('font-mono text-[12.5px] leading-[1.85]', dark ? 'text-[#94A3B8]' : 'text-[#4A5568]')}>
        {transcription}
      </p>
    )

    return lines.map((line, i) => {
      const doctorMatch  = line.match(/^(Doctor:|Physician:|Dr\.\s*\w+:)/i)
      const patientMatch = line.match(/^(Patient:|Patient\s*\w*:)/i)

      if (doctorMatch) return (
        <p key={i} className="font-mono text-[12.5px] leading-[1.85] mb-2">
          <span className={cn(
            'inline-block rounded-[3px] px-[5px] py-[1px] text-[11px] font-semibold mr-2',
            dark ? 'bg-[#1E3A5F] text-[#93C5FD]' : 'bg-[#EBF3FF] text-[#1A56DB]'
          )}>
            {doctorMatch[0].replace(':', '')}
          </span>
          <span className={dark ? 'text-[#94A3B8]' : 'text-[#4A5568]'}>
            {line.replace(doctorMatch[0], '').trim()}
          </span>
        </p>
      )

      if (patientMatch) return (
        <p key={i} className="font-mono text-[12.5px] leading-[1.85] mb-2">
          <span className={cn(
            'inline-block rounded-[3px] px-[5px] py-[1px] text-[11px] font-semibold mr-2',
            dark ? 'bg-[#2E1065] text-[#C4B5FD]' : 'bg-[#F3F0FF] text-[#7C3AED]'
          )}>
            {patientMatch[0].replace(':', '')}
          </span>
          <span className={dark ? 'text-[#94A3B8]' : 'text-[#4A5568]'}>
            {line.replace(patientMatch[0], '').trim()}
          </span>
        </p>
      )

      return (
        <p key={i} className={cn('font-mono text-[12.5px] leading-[1.85] mb-2', dark ? 'text-[#94A3B8]' : 'text-[#4A5568]')}>
          {line}
        </p>
      )
    })
  }

  return (
    <div className={cn(
      'border rounded-[14px] overflow-hidden',
      dark ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
    )}>
      <div className={cn(
        'flex items-center justify-between px-[18px] py-[13px] border-b',
        dark ? 'border-[#334155]' : 'border-[#E2E8F0]'
      )}>
        <div className={cn(
          'flex items-center gap-2 font-head text-[13px] font-semibold',
          dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]'
        )}>
          <div className="w-[8px] h-[8px] rounded-full bg-[#1A56DB]" />
          Transcription
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-[6px] px-[12px] py-[5px] rounded-[8px] border',
            'text-[12.5px] font-medium hover:border-[#1A56DB] hover:text-[#1A56DB] transition-all duration-[180ms]',
            dark
              ? 'bg-[#1E293B] border-[#334155] text-[#94A3B8]'
              : 'bg-white border-[#E2E8F0] text-[#4A5568]'
          )}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="px-[18px] py-[16px]">
        <div className="max-h-[220px] overflow-y-auto pr-1">
          {renderTranscription()}
        </div>

        {preferences.showConfidence && (
          <div className={cn(
            'flex items-center gap-3 mt-4 pt-4 border-t',
            dark ? 'border-[#334155]' : 'border-[#E2E8F0]'
          )}>
            <span className="text-[11.5px] text-[#94A3B8] flex-shrink-0">AI Confidence</span>
            <div className={cn(
              'flex-1 h-[5px] rounded-full overflow-hidden',
              dark ? 'bg-[#334155]' : 'bg-[#E2E8F0]'
            )}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0BA871] to-[#38BDF8]"
                style={{ width: `${confidence}%` }}
              />
            </div>
            <span className="font-mono text-[12px] font-semibold text-[#0BA871] flex-shrink-0">
              {formatConfidence(confidence_score)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
