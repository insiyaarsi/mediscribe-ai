import { useAppStore } from '../../../store/appStore'
import { FileText, Activity, Clock } from 'lucide-react'
import { cn } from '../../../lib/utils'

function toConfidencePercent(score: number): number {
  const base = score <= 1 ? score * 100 : score
  const clamped = Math.min(100, Math.max(1, base))
  return Math.round(clamped)
}

export default function StatsBar() {
  const { history, preferences } = useAppStore()
  const dark = preferences.darkMode

  const avgConfidence = history.length > 0
    ? Math.round(
      history.reduce((sum, h) => sum + toConfidencePercent(h.confidenceScore), 0) / history.length
    )
    : 0

  const timeSaved = history.length * 5

  const stats = [
    {
      icon: <FileText size={18} />,
      value: history.length.toString(),
      label: 'Total Transcriptions',
      delta: history.length > 0 ? `${history.length} session${history.length !== 1 ? 's' : ''} total` : 'No sessions yet',
      iconBg:    dark ? 'bg-[#1E3A5F]' : 'bg-[#EBF3FF]',
      iconColor: 'text-[#1A56DB]',
    },
    {
      icon: <Activity size={18} />,
      value: history.length > 0 ? `${avgConfidence}%` : '—',
      label: 'Avg. Confidence',
      delta: history.length > 0 ? 'Across all sessions' : 'No data yet',
      iconBg:    dark ? 'bg-[#0D3327]' : 'bg-[#E6F7F2]',
      iconColor: 'text-[#0BA871]',
    },
    {
      icon: <Clock size={18} />,
      value: timeSaved > 0 ? `${timeSaved} min` : '—',
      label: 'Time Saved',
      delta: 'Est. 5 min per session',
      iconBg:    dark ? 'bg-[#2D1B69]' : 'bg-[#F3F0FF]',
      iconColor: 'text-[#7C3AED]',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            'border rounded-[14px] p-5 flex items-start gap-4',
            'hover:shadow-lg transition-shadow duration-[180ms]',
            dark
              ? 'bg-[#1E293B] border-[#334155]'
              : 'bg-white border-[#E2E8F0]'
          )}
        >
          <div className={cn(
            'w-[42px] h-[42px] rounded-[10px] flex items-center justify-center flex-shrink-0',
            stat.iconBg, stat.iconColor
          )}>
            {stat.icon}
          </div>
          <div>
            <div className={cn(
              'font-head text-[24px] font-bold leading-none mb-1',
              dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]'
            )}>
              {stat.value}
            </div>
            <div className="text-[12.5px] text-[#94A3B8] font-medium">
              {stat.label}
            </div>
            <div className="text-[11px] text-[#0BA871] font-semibold mt-1">
              {stat.delta}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}