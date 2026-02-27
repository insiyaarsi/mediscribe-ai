import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { formatConfidence } from '../lib/utils'
import {
  Search, Trash2, Download, Eye, Filter,
  FileText, AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import type { HistoryEntry } from '../types'

export default function HistoryPage() {
  const { history, deleteHistoryItem, clearHistory, setPage, setResult, setUploadState } = useAppStore()

  const [search,        setSearch]        = useState('')
  const [filterConf,    setFilterConf]    = useState('all')
  const [showDeleteAll, setShowDeleteAll] = useState(false)

  // ── Filtering ──────────────────────────────────────────
  const filtered = history.filter(entry => {
    const matchSearch =
      entry.patientId.toLowerCase().includes(search.toLowerCase()) ||
      entry.date.toLowerCase().includes(search.toLowerCase())

    const conf = entry.confidenceScore

    const matchConf =
      filterConf === 'all'    ? true :
      filterConf === 'high'   ? conf >= 80 :
      filterConf === 'medium' ? conf >= 60 && conf < 80 :
      conf < 60

    return matchSearch && matchConf
  })

  // ── View a past result on dashboard ───────────────────
  const handleView = (entry: HistoryEntry) => {
    if (!entry.result) {
      toast.error('Result data not available for this entry')
      return
    }
    setResult(entry.result)
    setUploadState('done')
    setPage('dashboard')
    toast.success('Loaded transcription result')
  }

  // ── Download SOAP note as .txt ─────────────────────────
  const handleDownload = (entry: HistoryEntry) => {
    if (!entry.result) {
      toast.error('No SOAP note available for this entry')
      return
    }
    const { soap_note } = entry.result
    const content = [
      `MediScribe AI — SOAP Note`,
      `Patient ID: ${entry.patientId}`,
      `Date: ${entry.date}`,
      `Confidence: ${formatConfidence(entry.confidenceScore)}`,
      '',
      'S — SUBJECTIVE',
      String(soap_note.subjective),
      '',
      'O — OBJECTIVE',
      String(soap_note.objective),
      '',
      'A — ASSESSMENT',
      String(soap_note.assessment),
      '',
      'P — PLAN',
      String(soap_note.plan),
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `SOAP_${entry.patientId}_${entry.date.split('·')[0].trim()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('SOAP note downloaded')
  }

  // ── Confidence badge styling ───────────────────────────
  const getConfBadge = (score: number) => {
  const pct = Math.round(score)
  if (pct >= 80) return { label: `${pct}%`, classes: 'bg-[#E6F7F2] text-[#065F46]' }
  if (pct >= 60) return { label: `${pct}%`, classes: 'bg-[#FEF3C7] text-[#92400E]' }
  return               { label: `${pct}%`, classes: 'bg-[#FEE2E2] text-[#991B1B]' }
}

  return (
    <div className="p-7">

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 max-w-[300px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search by patient ID or date..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-[8px] border border-[#E2E8F0] rounded-[10px] text-[13.5px] font-sans bg-white text-[#0D1B2A] placeholder:text-[#94A3B8] outline-none focus:border-[#1A56DB] transition-colors"
          />
        </div>

        {/* Confidence filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#94A3B8]" />
          <select
            value={filterConf}
            onChange={e => setFilterConf(e.target.value)}
            className="px-3 py-[8px] border border-[#E2E8F0] rounded-[10px] text-[13.5px] font-sans bg-white text-[#4A5568] outline-none focus:border-[#1A56DB] cursor-pointer transition-colors"
          >
            <option value="all">All Confidence</option>
            <option value="high">High (≥80%)</option>
            <option value="medium">Medium (60–80%)</option>
            <option value="low">Low (&lt;60%)</option>
          </select>
        </div>

        {/* Delete All — pushed to the right */}
        {history.length > 0 && (
          <button
            onClick={() => setShowDeleteAll(true)}
            className="ml-auto flex items-center gap-[6px] px-[13px] py-[7px] rounded-[10px] bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] text-[13px] font-medium hover:bg-[#FEE2E2] transition-all duration-[180ms]"
          >
            <Trash2 size={13} />
            Delete All
          </button>
        )}
      </div>

      {/* ── Empty state ──────────────────────────────────── */}
      {history.length === 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-16 text-center">
          <div className="w-[56px] h-[56px] rounded-full bg-[#F7FAFC] border border-[#E2E8F0] flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-[#94A3B8]" />
          </div>
          <h3 className="font-head text-[16px] font-semibold text-[#0D1B2A] mb-2">
            No transcriptions yet
          </h3>
          <p className="text-[13.5px] text-[#94A3B8] mb-6">
            Your transcription history will appear here after your first session
          </p>
          <button
            onClick={() => setPage('dashboard')}
            className="px-[20px] py-[9px] rounded-[10px] bg-[#1A56DB] text-white text-[13.5px] font-semibold hover:bg-[#1648C0] transition-all duration-[180ms]"
          >
            Start a Transcription
          </button>
        </div>
      )}

      {/* ── No search results ────────────────────────────── */}
      {history.length > 0 && filtered.length === 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-12 text-center">
          <p className="text-[14px] text-[#94A3B8]">
            No transcriptions match your search or filter.
          </p>
          <button
            onClick={() => { setSearch(''); setFilterConf('all') }}
            className="mt-4 text-[13px] text-[#1A56DB] underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── History table ────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-[14px] overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F7FAFC] border-b border-[#E2E8F0]">
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.05em] text-[#94A3B8]">
                  Date & Time
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.05em] text-[#94A3B8]">
                  Patient ID
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.05em] text-[#94A3B8]">
                  Entities
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.05em] text-[#94A3B8]">
                  Confidence
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.05em] text-[#94A3B8]">
                  Status
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.05em] text-[#94A3B8]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, index) => {
                const confBadge = getConfBadge(entry.confidenceScore)
                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F7FAFC] transition-colors duration-[150ms] ${
                      index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'
                    }`}
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-[12.5px] text-[#0D1B2A]">
                        {entry.date}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-[12px] text-[#94A3B8]">
                        {entry.patientId}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-[12px] text-[#4A5568]">
                        {entry.entityCount} entities
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`font-mono text-[12px] font-semibold px-[8px] py-[2px] rounded-[6px] ${confBadge.classes}`}>
                        {confBadge.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-[5px] px-[9px] py-[3px] rounded-[12px] text-[11.5px] font-semibold bg-[#E6F7F2] text-[#065F46]">
                        <span className="w-[6px] h-[6px] rounded-full bg-[#0BA871]" />
                        Complete
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {/* View */}
                        <button
                          onClick={() => handleView(entry)}
                          title="View result"
                          className="w-[28px] h-[28px] rounded-[6px] border border-[#E2E8F0] bg-white flex items-center justify-center text-[#94A3B8] hover:border-[#1A56DB] hover:text-[#1A56DB] transition-all duration-[180ms]"
                        >
                          <Eye size={13} />
                        </button>
                        {/* Download */}
                        <button
                          onClick={() => handleDownload(entry)}
                          title="Download SOAP note"
                          className="w-[28px] h-[28px] rounded-[6px] border border-[#E2E8F0] bg-white flex items-center justify-center text-[#94A3B8] hover:border-[#1A56DB] hover:text-[#1A56DB] transition-all duration-[180ms]"
                        >
                          <Download size={13} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => {
                            deleteHistoryItem(entry.id)
                            toast.success('Entry deleted')
                          }}
                          title="Delete entry"
                          className="w-[28px] h-[28px] rounded-[6px] border border-[#E2E8F0] bg-white flex items-center justify-center text-[#94A3B8] hover:border-red-400 hover:text-red-500 transition-all duration-[180ms]"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Row count footer */}
          <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F7FAFC]">
            <span className="text-[12px] text-[#94A3B8]">
              Showing {filtered.length} of {history.length} transcription{history.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* ── Delete All confirmation modal ─────────────────── */}
      {showDeleteAll && (
        <div
          className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteAll(false) }}
        >
          <div className="bg-white border border-[#E2E8F0] rounded-[14px] p-8 max-w-[400px] w-full mx-4 shadow-xl">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-[40px] h-[40px] rounded-full bg-[#FEF2F2] flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-[#B91C1C]" />
              </div>
              <div>
                <h3 className="font-head text-[17px] font-700 text-[#0D1B2A] mb-1">
                  Delete All History?
                </h3>
                <p className="text-[13.5px] text-[#4A5568] leading-[1.6]">
                  This will permanently delete all{' '}
                  <strong>{history.length} transcription{history.length !== 1 ? 's' : ''}</strong>{' '}
                  from your history. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteAll(false)}
                className="px-[16px] py-[8px] rounded-[10px] border border-[#E2E8F0] bg-white text-[#4A5568] text-[13px] font-medium hover:border-[#94A3B8] transition-all duration-[180ms]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearHistory()
                  setShowDeleteAll(false)
                  toast.success('All history deleted')
                }}
                className="px-[16px] py-[8px] rounded-[10px] bg-[#B91C1C] text-white text-[13px] font-semibold hover:bg-[#991B1B] transition-all duration-[180ms]"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}