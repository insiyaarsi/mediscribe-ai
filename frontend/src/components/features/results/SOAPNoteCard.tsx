import { useState } from 'react'
import { useAppStore } from '../../../store/appStore'
import { Download, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../../../lib/utils'

interface SOAPSection {
  key:        'subjective' | 'objective' | 'assessment' | 'plan'
  label:      string
  letter:     string
  lightBg:    string
  darkBg:     string
  lightHeader:string
  darkHeader: string
  lightText:  string
  darkText:   string
}

const SOAP_SECTIONS: SOAPSection[] = [
  {
    key: 'subjective',  label: 'Subjective',  letter: 'S',
    lightBg: 'bg-[#DBEAFE]', darkBg: 'bg-[#172554]',
    lightHeader: 'text-[#1E40AF]', darkHeader: 'text-[#93C5FD]',
    lightText: 'text-[#1E3A8A]',   darkText: 'text-[#DBEAFE]',
  },
  {
    key: 'objective',   label: 'Objective',   letter: 'O',
    lightBg: 'bg-[#D1FAE5]', darkBg: 'bg-[#052E16]',
    lightHeader: 'text-[#065F46]', darkHeader: 'text-[#86EFAC]',
    lightText: 'text-[#064E3B]',   darkText: 'text-[#DCFCE7]',
  },
  {
    key: 'assessment',  label: 'Assessment',  letter: 'A',
    lightBg: 'bg-[#EDE9FE]', darkBg: 'bg-[#2E1065]',
    lightHeader: 'text-[#4C1D95]', darkHeader: 'text-[#C4B5FD]',
    lightText: 'text-[#3B0764]',   darkText: 'text-[#E9D5FF]',
  },
  {
    key: 'plan',        label: 'Plan',        letter: 'P',
    lightBg: 'bg-[#FEF3C7]', darkBg: 'bg-[#451A03]',
    lightHeader: 'text-[#92400E]', darkHeader: 'text-[#FCD34D]',
    lightText: 'text-[#78350F]',   darkText: 'text-[#FEF3C7]',
  },
]

// Converts the backend SOAP value to a plain string.
// Backend may return a string, array, or nested object.
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
  const { transcriptionResult, preferences } = useAppStore()
  const [copied, setCopied]   = useState(false)
  const [editing, setEditing] = useState<Record<string, string>>({})

  if (!transcriptionResult) return null

  const dark = preferences.darkMode
  const soap = transcriptionResult.soap_note

  const getText = (key: SOAPSection['key']) =>
    editing[key] !== undefined ? editing[key] : toPlainText(soap[key])

  const handleEdit = (key: string, value: string) =>
    setEditing(prev => ({ ...prev, [key]: value }))

  const buildFullNote = () =>
    SOAP_SECTIONS.map(s => `${s.letter} — ${s.label}\n${getText(s.key)}`).join('\n\n')

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

  const actionBtnClass = cn(
    'flex items-center gap-[6px] px-[12px] py-[5px] rounded-[8px] border',
    'text-[12.5px] font-medium hover:border-[#1A56DB] hover:text-[#1A56DB] transition-all duration-[180ms]',
    dark
      ? 'bg-[#1E293B] border-[#334155] text-[#94A3B8]'
      : 'bg-white border-[#E2E8F0] text-[#4A5568]'
  )

  return (
    <div className={cn(
      'border rounded-[14px] overflow-hidden',
      dark ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-[18px] py-[13px] border-b',
        dark ? 'border-[#334155]' : 'border-[#E2E8F0]'
      )}>
        <div className={cn(
          'flex items-center gap-2 font-head text-[13px] font-semibold',
          dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]'
        )}>
          <div className="w-[8px] h-[8px] rounded-full bg-[#888]" />
          SOAP Note
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopyAll} className={actionBtnClass}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy All'}
          </button>
          <button onClick={handleDownload} className={actionBtnClass}>
            <Download size={12} />
            Download
          </button>
        </div>
      </div>

      {/* Body — 2×2 grid */}
      <div className="p-[18px]">
        <div className="grid grid-cols-2 gap-3">
          {SOAP_SECTIONS.map(section => (
            <div
              key={section.key}
              className={cn(
                'rounded-[10px] border overflow-hidden',
                dark ? 'border-[#334155]' : 'border-[#E2E8F0]'
              )}
            >
              {/* Section header */}
              <div className={cn(
                'px-[13px] py-[8px] flex items-center gap-2',
                dark ? section.darkBg : section.lightBg
              )}>
                <span className={cn(
                  'text-[16px] font-light',
                  dark ? section.darkHeader : section.lightHeader
                )}>
                  {section.letter}
                </span>
                <span className={cn(
                  'text-[11px] font-bold uppercase tracking-[0.06em]',
                  dark ? section.darkHeader : section.lightHeader
                )}>
                  {section.label}
                </span>
              </div>
              {/* Editable textarea */}
              <textarea
                value={getText(section.key)}
                onChange={e => handleEdit(section.key, e.target.value)}
                rows={4}
                className={cn(
                  'w-full px-[13px] py-[10px] text-[12.5px] leading-[1.7] resize-none outline-none font-sans',
                  dark
                    ? 'bg-[#1E293B] text-[#94A3B8]'
                    : 'bg-white text-[#4A5568]'
                )}
              />
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setEditing({})}
            className={cn(
              'flex-1 py-[8px] rounded-[10px] border text-[13px] font-medium',
              'hover:border-[#94A3B8] transition-all duration-[180ms]',
              dark
                ? 'bg-[#1E293B] border-[#334155] text-[#94A3B8]'
                : 'bg-white border-[#E2E8F0] text-[#4A5568]'
            )}
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