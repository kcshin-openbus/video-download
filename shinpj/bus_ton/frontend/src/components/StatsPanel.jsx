import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getSendStats } from '../api'

const statCards = [
  {
    key: 'totalSent',
    label: '총 발송 수',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
    ),
    color: 'from-primary-500 to-violet-500',
    bgLight: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
  {
    key: 'todayCount',
    label: '오늘 발송',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    color: 'from-sky-500 to-cyan-500',
    bgLight: 'bg-sky-50',
    textColor: 'text-sky-600',
  },
  {
    key: 'successRate',
    label: '성공률',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    suffix: '%',
  },
]

export default function StatsPanel() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const data = await getSendStats()
        setStats(data)
      } catch {
        toast.error('통계를 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const getValue = (key) => {
    if (!stats) return 0
    // Handle both camelCase and snake_case
    return stats[key] ?? stats[key.replace(/([A-Z])/g, '_$1').toLowerCase()] ?? 0
  }

  // Daily chart data
  const dailyData = stats?.dailyStats || stats?.daily_stats || []
  const maxCount = Math.max(...dailyData.map((d) => d.count || 0), 1)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">통계</h2>
        <p className="text-sm text-slate-500 mt-1">발송 현황 요약</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {statCards.map((card) => (
          <div
            key={card.key}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl ${card.bgLight} flex items-center justify-center ${card.textColor}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-slate-500">{card.label}</p>
              {loading ? (
                <div className="mt-1 h-7 w-16 bg-slate-100 rounded-lg animate-pulse" />
              ) : (
                <p className="text-2xl font-bold text-slate-800">
                  {getValue(card.key).toLocaleString()}
                  {card.suffix || ''}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Daily Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-6">일별 발송 현황</h3>

        {loading ? (
          <div className="flex items-end gap-2 h-48">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 bg-slate-100 rounded-t-lg animate-pulse" style={{ height: `${30 + Math.random() * 60}%` }} />
            ))}
          </div>
        ) : dailyData.length === 0 ? (
          <p className="text-center text-slate-400 py-12">발송 데이터가 없습니다.</p>
        ) : (
          <div className="flex items-end gap-2 h-56">
            {dailyData.map((day, idx) => {
              const pct = Math.max((day.count / maxCount) * 100, 4)
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  {/* Count label */}
                  <span className="text-xs font-medium text-slate-500">{day.count}</span>
                  {/* Bar */}
                  <div className="w-full relative group">
                    <div
                      className="w-full bg-gradient-to-t from-primary-500 to-primary-300 rounded-t-lg transition-all duration-500 hover:from-primary-600 hover:to-primary-400"
                      style={{ height: `${pct * 1.8}px`, minHeight: '8px' }}
                    />
                  </div>
                  {/* Date label */}
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {day.date ? new Date(day.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' }) : ''}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
