import { useState } from 'react'
import AdminSidebar from '../components/AdminSidebar'
import TextbookTable from '../components/TextbookTable'
import SendLogTable from '../components/SendLogTable'
import StatsPanel from '../components/StatsPanel'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('textbooks')

  const renderContent = () => {
    switch (activeTab) {
      case 'textbooks':
        return <TextbookTable />
      case 'logs':
        return <SendLogTable />
      case 'stats':
        return <StatsPanel />
      default:
        return <TextbookTable />
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-sm text-slate-500">시스템 정상</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
