import { useAppStore } from '../../store/appStore'
import { Bell, Plus } from 'lucide-react'
import type { AppPage } from '../../types'

const PAGE_TITLES: Record<AppPage, string> = {
  dashboard: 'Dashboard',
  history:   'Transcription History',
  settings:  'Settings',
}

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
})

export default function TopBar() {
  const { currentPage, setPage } = useAppStore()

  return (
    <header className="sticky top-0 z-40 h-[54px] w-full bg-white border-b border-[#E2E8F0] flex items-center justify-between px-7">
      <h1 className="font-head text-[15px] font-semibold text-[#0D1B2A]">
        {PAGE_TITLES[currentPage]}
      </h1>

      <div className="flex items-center gap-3">
        <span className="text-[12px] text-[#94A3B8] font-mono hidden sm:block">
          {TODAY}
        </span>

        {/* Alerts button — ghost style with visible text */}
        <button className="flex items-center gap-[6px] px-[13px] py-[6px] rounded-[10px] border border-[#E2E8F0] bg-white text-[#4A5568] text-[13px] font-medium hover:border-[#1A56DB] hover:text-[#1A56DB] transition-all duration-[180ms]">
          <Bell size={14} />
          <span>Alerts</span>
        </button>

        {/* New Transcription button — only shown when not on dashboard */}
        {currentPage !== 'dashboard' && (
          <button
            onClick={() => setPage('dashboard')}
            className="flex items-center gap-[7px] px-[14px] py-[6px] rounded-[10px] bg-[#1A56DB] text-white text-[13px] font-semibold hover:bg-[#1648C0] transition-all duration-[180ms] hover:-translate-y-px shadow-sm hover:shadow-blue"
          >
            <Plus size={14} />
            <span>New Transcription</span>
          </button>
        )}
      </div>
    </header>
  )
}