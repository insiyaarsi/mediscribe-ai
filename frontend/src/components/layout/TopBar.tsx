import { useAppStore } from '../../store/appStore'
import { cn } from '../../lib/utils'
import { Bell, Plus } from 'lucide-react'
import type { AppPage } from '../../types'

const PAGE_TITLES: Record<AppPage, string> = {
  login:     'Login',
  dashboard: 'Dashboard',
  history:   'Transcription History',
  settings:  'Settings',
}

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
})

export default function TopBar() {
  const { currentPage, setPage, preferences } = useAppStore()

  return (
    <header className={cn(
      'sticky top-0 z-40 h-[54px] w-full border-b flex items-center justify-between px-7',
      preferences.darkMode
        ? 'bg-[#0B1220] border-[#1E293B]'
        : 'bg-white border-[#E2E8F0]'
    )}>
      <h1 className={cn(
        'font-head text-[15px] font-semibold',
        preferences.darkMode ? 'text-[#E2E8F0]' : 'text-[#0D1B2A]'
      )}>
        {PAGE_TITLES[currentPage]}
      </h1>

      <div className="flex items-center gap-3">
        <span className={cn(
          'text-[12px] font-mono hidden sm:block',
          preferences.darkMode ? 'text-[#94A3B8]' : 'text-[#94A3B8]'
        )}>
          {TODAY}
        </span>

        {/* Alerts button — ghost style with visible text */}
        <button className={cn(
          'flex items-center gap-[6px] px-[13px] py-[6px] rounded-[10px] border text-[13px] font-medium transition-all duration-[180ms]',
          preferences.darkMode
            ? 'border-[#334155] bg-[#111827] text-[#CBD5E1] hover:border-[#60A5FA] hover:text-[#93C5FD]'
            : 'border-[#E2E8F0] bg-white text-[#4A5568] hover:border-[#1A56DB] hover:text-[#1A56DB]'
        )}>
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
