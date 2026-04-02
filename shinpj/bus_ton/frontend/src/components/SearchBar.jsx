import { useState, useEffect, useRef } from 'react'

export default function SearchBar({ onSearch, placeholder = '교재명을 검색하세요...' }) {
  const [query, setQuery] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (query.length >= 2) {
      timerRef.current = setTimeout(() => {
        onSearch(query)
      }, 300)
    } else if (query.length === 0) {
      onSearch('')
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, onSearch])

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <svg
          className="w-5 h-5 text-primary-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full py-3.5 pl-12 pr-4 text-slate-700 bg-white/80 backdrop-blur-sm border border-primary-200 rounded-xl shadow-lg shadow-primary-500/10 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder:text-slate-400 transition-all"
      />
      {query && (
        <button
          onClick={() => setQuery('')}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
