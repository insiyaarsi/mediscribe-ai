import { useAppStore } from '../../../store/appStore'
import { FileText, Activity, Clock } from 'lucide-react'

export default function StatsBar() {
  const { history } = useAppStore()

  const avgConfidence = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + h.confidenceScore, 0) / history.length * 100)
    : 0

  const timeSaved = history.length * 5

  const stats = [
    {
      icon: <FileText size={18} />,
      value: history.length.toString(),
      label: 'Total Transcriptions',
      delta: history.length > 0 ? `${history.length} session${history.length !== 1 ? 's' : ''} total` : 'No sessions yet',
      iconBg: 'bg-[#EBF3FF]',
      iconColor: 'text-[#1A56DB]',
    },
    {
      icon: <Activity size={18} />,
      value: history.length > 0 ? `${avgConfidence}%` : '—',
      label: 'Avg. Confidence',
      delta: history.length > 0 ? 'Across all sessions' : 'No data yet',
      iconBg: 'bg-[#E6F7F2]',
      iconColor: 'text-[#0BA871]',
    },
    {
      icon: <Clock size={18} />,
      value: timeSaved > 0 ? `${timeSaved} min` : '—',
      label: 'Time Saved',
      delta: 'Est. 5 min per session',
      iconBg: 'bg-[#F3F0FF]',
      iconColor: 'text-[#7C3AED]',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white border border-[#E2E8F0] rounded-[14px] p-5 flex items-start gap-4 hover:shadow-lg transition-shadow duration-[180ms]"
        >
          <div className={`w-[42px] h-[42px] rounded-[10px] flex items-center justify-center flex-shrink-0 ${stat.iconBg} ${stat.iconColor}`}>
            {stat.icon}
          </div>
          <div>
            <div className="font-head text-[24px] font-bold text-[#0D1B2A] leading-none mb-1">
              {stat.value}
            </div>
            <div className="text-[12.5px] text-[#4A5568] font-medium">
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