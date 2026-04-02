import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import SearchBar from '../components/SearchBar'
import TextbookCard from '../components/TextbookCard'
import EmailModal from '../components/EmailModal'
import { getTextbooks, searchTextbooks } from '../api'

const LANG_TABS = [
  { label: '전체', value: 'all' },
  { label: '일본어', value: 'japanese' },
  { label: '중국어', value: 'chinese' },
]

export default function UserPage() {
  const [textbooks, setTextbooks] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeLang, setActiveLang] = useState('all')
  const [selectedTextbook, setSelectedTextbook] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch initial data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const data = await getTextbooks()
        const list = Array.isArray(data) ? data : data.textbooks || []
        setTextbooks(list)
        setFiltered(list)
      } catch {
        toast.error('교재 목록을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  // Apply filters
  useEffect(() => {
    let result = textbooks
    if (activeLang !== 'all') {
      result = result.filter((t) => t.language === activeLang)
    }
    setFiltered(result)
  }, [activeLang, textbooks])

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query)
    if (!query) {
      try {
        setLoading(true)
        const data = await getTextbooks()
        const list = Array.isArray(data) ? data : data.textbooks || []
        setTextbooks(list)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
      return
    }

    try {
      setLoading(true)
      const data = await searchTextbooks(query)
      const list = Array.isArray(data) ? data : data.textbooks || []
      setTextbooks(list)
    } catch {
      toast.error('검색에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50/30 to-violet-50/40">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-violet-500" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_50%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-14">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                </svg>
              </div>
              <span className="text-white font-bold text-lg">MP3 배달 서비스</span>
            </div>
            <Link
              to="/admin"
              className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-1.5 no-underline"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.204-.107-.397.165-.71.505-.78.929l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              관리자
            </Link>
          </div>

          {/* Hero text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              외국어 교재 MP3 자동 배달
            </h1>
            <p className="text-primary-100 text-base sm:text-lg max-w-md mx-auto">
              교재를 선택하고 이메일을 입력하면<br />
              MP3 파일을 바로 받을 수 있습니다
            </p>
          </div>

          {/* Search */}
          <SearchBar onSearch={handleSearch} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 pt-6">
        {/* Language Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {LANG_TABS.map((lang) => (
            <button
              key={lang.value}
              onClick={() => setActiveLang(lang.value)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeLang === lang.value
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                <div className="h-1.5 bg-slate-100 rounded-full mb-4 w-16" />
                <div className="h-5 bg-slate-100 rounded-lg mb-2 w-3/4" />
                <div className="h-4 bg-slate-100 rounded-lg mb-4 w-1/2" />
                <div className="h-4 bg-slate-100 rounded-lg w-24" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-slate-500 text-lg font-medium">검색 결과가 없습니다</p>
            <p className="text-slate-400 text-sm mt-1">다른 검색어로 시도해보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((tb) => (
              <TextbookCard
                key={tb.id}
                textbook={tb}
                onClick={setSelectedTextbook}
              />
            ))}
          </div>
        )}

        {/* Results count */}
        {!loading && filtered.length > 0 && (
          <p className="text-center text-sm text-slate-400 mt-6 pb-8">
            {searchQuery ? `"${searchQuery}" 검색 결과` : '전체 교재'} {filtered.length}개
          </p>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 border-t border-slate-200/60">
        <p className="text-center text-xs text-slate-400">
          MP3 배달 서비스 &middot; 외국어 교재 MP3 자동 배달 시스템
        </p>
      </footer>

      {/* Email Modal */}
      <EmailModal
        isOpen={!!selectedTextbook}
        onClose={() => setSelectedTextbook(null)}
        textbook={selectedTextbook}
      />
    </div>
  )
}
