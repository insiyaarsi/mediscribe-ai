import StatsBar from '../components/features/upload/StatsBar'
import UploadCard from '../components/features/upload/UploadCard'
import ResultsPanel from '../components/features/results/ResultsPanel'

export default function DashboardPage() {
  return (
    <div className="p-7">
      <StatsBar />
      <UploadCard />
      <ResultsPanel />
      {/* Results panel comes in the next step */}
    </div>
  )
}