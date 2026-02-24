import { useAppStore } from './store/appStore'
import { cn } from './lib/utils'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  const { currentPage, sidebarCollapsed } = useAppStore()

  return (
    <div className="flex w-full min-h-screen bg-[#F0F4F8]">
      <Sidebar />

      <div
        className={cn(
          'flex flex-col flex-1 min-h-screen min-w-0',
          'transition-[margin-left] duration-[240ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
          sidebarCollapsed ? 'ml-[60px]' : 'ml-[220px]'
        )}
      >
        <TopBar />

        <main className="flex-1 w-full">
          {currentPage === 'dashboard' && <DashboardPage />}
          {currentPage === 'history'   && <HistoryPage />}
          {currentPage === 'settings'  && <SettingsPage />}
        </main>
      </div>
    </div>
  )
}