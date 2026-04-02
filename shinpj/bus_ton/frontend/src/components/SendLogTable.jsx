import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getSendLogs } from '../api'

const statusBadge = {
  success: { label: '성공', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  pending: { label: '대기', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  failed: { label: '실패', cls: 'bg-red-50 text-red-600 border-red-200' },
  sending: { label: '전송중', cls: 'bg-sky-50 text-sky-600 border-sky-200' },
}

export default function SendLogTable() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const filters = {}
      if (filterStatus) filters.status = filterStatus
      if (filterDate) filters.date = filterDate
      const data = await getSendLogs(filters)
      setLogs(Array.isArray(data) ? data : data.logs || [])
    } catch {
      toast.error('발송 이력을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [filterStatus, filterDate])

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">발송 이력</h2>
          <p className="text-sm text-slate-500 mt-1">총 {logs.length}건</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white"
          >
            <option value="">전체 상태</option>
            <option value="success">성공</option>
            <option value="pending">대기</option>
            <option value="failed">실패</option>
            <option value="sending">전송중</option>
          </select>
          <button
            onClick={fetchLogs}
            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="새로고침"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">이메일</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">교재</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">발송 시간</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <svg className="animate-spin h-6 w-6 mx-auto mb-2 text-primary-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    불러오는 중...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    발송 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const badge = statusBadge[log.status] || statusBadge.pending
                  return (
                    <tr key={log.id || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-700">{log.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{log.textbookTitle || log.textbook_title || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(log.sentAt || log.sent_at || log.createdAt || log.created_at)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
