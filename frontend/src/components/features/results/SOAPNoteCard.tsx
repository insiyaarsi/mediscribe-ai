import { useState } from 'react'
import { useAppStore } from '../../../store/appStore'
import { Download, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../../lib/utils'

interface SOAPSection {
  key:    'subjective' | 'objective' | 'assessment' | 'plan'
  label:  string
  letter: string
  bg:     string
  header: string
  text:   string
}

const SOAP_SECTIONS: SOAPSection[] = [
  { key: 'subjective',  label: 'Subjective',  letter: 'S', bg: 'bg-[#DBEAFE]', header: 'text-[#1E40AF]', text: 'text-[#1E3A8A]' },
  { key: 'objective',   label: 'Objective',   letter: 'O', bg: 'bg-[#D1FAE5]', header: 'text-[#065F46]', text: 'text-[#064E3B]' },
  { key: 'assessment',  label: 'Assessment',  letter: 'A', bg: 'bg-[#EDE9FE]', header: 'text-[#4C1D95]', text: 'text-[#3B0764]' },
  { key: 'plan',        label: 'Plan',        letter: 'P', bg: 'bg-[#FEF3C7]', header: 'text-[#92400E]', text: 'text-[#78350F]' },
]

// Converts the backend SOAP value to a plain string
// Backend may return a string, array, or nested object
function toPlainText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value))     return value.map(toPlainText).join('\n')
  if (value && typeof value === 'object') {
    return Object.values(value).map(toPlainText).join('\n')
  }
  return String(value ?? '')
}

interface SOAPNoteCardProps {
  compact?: boolean
}

export default function SOAPNoteCard({ compact: _compact = false }: SOAPNoteCardProps) {
  const { transcriptionResult } = useAppStore()
  const [copied, setCopied]     = useState(false)
  const [editing, setEditing]   = useState<Record<string, string>>({})

  if (!transcriptionResult) return null

  const soap = transcriptionResult.soap_note

  const getText = (key: SOAPSection['key']) =>
    editing[key] !== undefined ? editing[key] : toPlainText(soap[key])

  const handleEdit = (key: string, value: string) =>
    setEditing(prev => ({ ...prev, [key]: value }))

  const buildFullNote = () =>
    SOAP_SECTIONS.map(s =>
      `${s.letter} — ${s.label}\n${getText(s.key)}`
    ).join('\n\n')

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(buildFullNote())
    setCopied(true)
    toast.success('SOAP note copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([buildFullNote()], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `SOAP_Note_${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('SOAP note downloaded')
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-[18px] py-[13px] border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2 font-head text-[13px] font-semibold text-[#0D1B2A]">
          <div className="w-[8px] h-[8px] rounded-full bg-[#888]" />
          SOAP Note
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-[6px] px-[12px] py-[5px] rounded-[8px] border border-[#E2E8F0] bg-white text-[#4A5568] text-[12.5px] font-medium hover:border-[#1A56DB] hover:text-[#1A56DB] transition-all duration-[180ms]"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy All'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-[6px] px-[12px] py-[5px] rounded-[8px] border border-[#E2E8F0] bg-white text-[#4A5568] text-[12.5px] font-medium hover:border-[#1A56DB] hover:text-[#1A56DB] transition-all duration-[180ms]"
          >
            <Download size={12} />
            Download
          </button>
        </div>
      </div>

      {/* Body — 2×2 grid for the four sections */}
      <div className="p-[18px]">
        <div className="grid grid-cols-2 gap-3">
          {SOAP_SECTIONS.map(section => (
            <div
              key={section.key}
              className="rounded-[10px] border border-[#E2E8F0] overflow-hidden"
            >
              <div className={cn('px-[13px] py-[8px] flex items-center gap-2', section.bg)}>
                <span className={cn('text-[16px] font-light', section.header)}>
                  {section.letter}
                </span>
                <span className={cn('text-[11px] font-bold uppercase tracking-[0.06em]', section.header)}>
                  {section.label}
                </span>
              </div>
              <textarea
                value={getText(section.key)}
                onChange={e => handleEdit(section.key, e.target.value)}
                rows={4}
                className="w-full px-[13px] py-[10px] text-[12.5px] leading-[1.7] text-[#4A5568] bg-white resize-none outline-none font-sans"
              />
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setEditing({})}
            className="flex-1 py-[8px] rounded-[10px] border border-[#E2E8F0] bg-white text-[#4A5568] text-[13px] font-medium hover:border-[#94A3B8] transition-all duration-[180ms]"
          >
            Reset Edits
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 py-[8px] rounded-[10px] bg-[#1A56DB] text-white text-[13px] font-semibold hover:bg-[#1648C0] hover:shadow-[0_4px_14px_rgba(26,86,219,0.35)] transition-all duration-[180ms]"
          >
            Save to Record
          </button>
        </div>
      </div>
    </div>
  )
}