import { useAppStore } from '../../store/appStore'
import { cn } from '../../lib/utils'
import type { AppPage } from '../../types'
import {
  LayoutDashboard,
  Clock,
  Settings,
  LogOut,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface NavItem {
  id:    AppPage | 'logout'
  label: string
  icon:  React.ReactNode
  badge?: number
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
  { id: 'history',   label: 'History',   icon: <Clock size={17} />,           badge: 0 },
  { id: 'settings',  label: 'Settings',  icon: <Settings size={17} /> },
]

export default function Sidebar() {
  const { currentPage, setPage, sidebarCollapsed, toggleSidebar, history } = useAppStore()

  const handleNav = (id: NavItem['id']) => {
    if (id === 'logout') return
    setPage(id as AppPage)
  }

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-[#0D1B2A]',
        'transition-[width] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        'border-r border-[#1E2F45] overflow-hidden',
        sidebarCollapsed ? 'w-[60px]' : 'w-[220px]'
      )}
    >
      {/* ── Logo row ─────────────────────────────── */}
      <div className="flex items-center gap-3 px-[14px] py-[18px] border-b border-[#1E2F45] min-h-[64px]">
        <div className="w-[30px] h-[30px] rounded-[7px] bg-gradient-to-br from-[#1A56DB] to-[#0BA871] flex items-center justify-center flex-shrink-0">
          <Zap size={15} className="text-white" fill="white" />
        </div>

        <div
          className={cn(
            'overflow-hidden whitespace-nowrap transition-[opacity,width] duration-[200ms]',
            sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
          )}
        >
          <div className="font-head text-[14px] font-bold text-[#F0F4F8] leading-tight">
            MediScribe AI
          </div>
          <div className="text-[10px] text-[#4A6080] uppercase tracking-[0.05em]">
            Clinical
          </div>
        </div>
      </div>

      {/* ── Toggle button — always visible ───────── */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'w-full flex items-center border-b border-[#1E2F45]',
          'text-[#4A6080] hover:bg-[#162235] hover:text-[#C5D8EE]',
          'transition-all duration-[180ms]',
          sidebarCollapsed
            ? 'justify-center py-[10px]'
            : 'justify-end px-[14px] py-[8px]'
        )}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed
          ? <ChevronRight size={16} />
          : (
            <span className="flex items-center gap-[6px] text-[11px] font-medium">
              Collapse
              <ChevronLeft size={14} />
            </span>
          )
        }
      </button>

      {/* ── Navigation ───────────────────────────── */}
      <div className="flex-1 px-[10px] py-[14px] space-y-[1px] overflow-y-auto">
        <div
          className={cn(
            'text-[10px] uppercase tracking-[0.08em] text-[#3D5470]',
            'px-[8px] mb-[6px] overflow-hidden whitespace-nowrap',
            'transition-opacity duration-[200ms]',
            sidebarCollapsed ? 'opacity-0' : 'opacity-100'
          )}
        >
          Workspace
        </div>

        {NAV_ITEMS.slice(0, 2).map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={currentPage === item.id}
            collapsed={sidebarCollapsed}
            badgeCount={item.id === 'history' ? history.length : undefined}
            onClick={() => handleNav(item.id)}
          />
        ))}

        <div
          className={cn(
            'text-[10px] uppercase tracking-[0.08em] text-[#3D5470]',
            'px-[8px] pt-[14px] mb-[6px] overflow-hidden whitespace-nowrap',
            'transition-opacity duration-[200ms]',
            sidebarCollapsed ? 'opacity-0' : 'opacity-100'
          )}
        >
          Account
        </div>

        {NAV_ITEMS.slice(2).map((item) => (
          <NavButton
            key={item.id}
            item={item}
            active={currentPage === item.id}
            collapsed={sidebarCollapsed}
            onClick={() => handleNav(item.id)}
          />
        ))}

        <NavButton
          item={{ id: 'logout', label: 'Sign Out', icon: <LogOut size={17} /> }}
          active={false}
          collapsed={sidebarCollapsed}
          onClick={() => handleNav('logout')}
        />
      </div>

      {/* ── User footer ──────────────────────────── */}
      <div className="px-[10px] py-[14px] border-t border-[#1E2F45]">
        <div
          className={cn(
            'flex items-center gap-[10px] px-[10px] py-[8px] rounded-[8px]',
            'cursor-pointer hover:bg-[#162235] transition-colors duration-[180ms]',
            'whitespace-nowrap'
          )}
        >
          <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#1A56DB] to-[#7C3AED] flex items-center justify-center flex-shrink-0 border border-white/10">
            <span className="font-head text-[11px] font-bold text-white">IA</span>
          </div>
          <div
            className={cn(
              'overflow-hidden transition-[opacity,width] duration-[200ms]',
              sidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'
            )}
          >
            <div className="text-[13px] font-semibold text-[#C5D8EE] truncate">
              Insiya Arsi
            </div>
            <div className="text-[11px] text-[#4A6080]">Physician</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ── Nav button component ──────────────────────────────────

interface NavButtonProps {
  item:        NavItem
  active:      boolean
  collapsed:   boolean
  badgeCount?: number
  onClick:     () => void
}

function NavButton({ item, active, collapsed, badgeCount, onClick }: NavButtonProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-[10px]',
        'px-[10px] py-[8px] rounded-[8px]',
        'text-[13px] font-medium cursor-pointer',
        'transition-all duration-[180ms] whitespace-nowrap',
        active
          ? 'bg-[#1A56DB]/20 text-[#6BA3FF]'
          : 'text-[#6B8CAE] hover:bg-[#162235] hover:text-[#C5D8EE]'
      )}
    >
      <span className="flex-shrink-0">{item.icon}</span>

      <span
        className={cn(
          'overflow-hidden transition-[opacity,max-width] duration-[200ms]',
          collapsed ? 'opacity-0 max-w-0' : 'opacity-100 max-w-[140px]'
        )}
      >
        {item.label}
      </span>

      {badgeCount !== undefined && badgeCount > 0 && (
        <span
          className={cn(
            'ml-auto text-[10px] font-semibold px-[6px] py-[1px] rounded-[10px]',
            'bg-[#1A56DB] text-white',
            'transition-opacity duration-[200ms]',
            collapsed ? 'opacity-0' : 'opacity-100'
          )}
        >
          {badgeCount}
        </span>
      )}

      {/* Tooltip shown only when collapsed */}
      {collapsed && (
        <div
          className={cn(
            'pointer-events-none absolute left-[64px] z-[200]',
            'bg-[#162235] text-[#C5D8EE] text-[12px]',
            'px-[10px] py-[5px] rounded-[6px] border border-[#1E2F45]',
            'whitespace-nowrap opacity-0 group-hover:opacity-100',
            'transition-opacity duration-[150ms]'
          )}
        >
          {item.label}
        </div>
      )}
    </div>
  )
}