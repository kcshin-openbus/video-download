const langMap = {
  japanese: { label: '일본어', bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
  chinese: { label: '중국어', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
}
const defaultLang = { label: '기타', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }

export default function TextbookCard({ textbook, onClick }) {
  const lang = langMap[textbook.language] || defaultLang

  return (
    <button
      onClick={() => onClick(textbook)}
      className="group w-full text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/10 hover:border-primary-200 transition-all duration-300 overflow-hidden"
    >
      {/* Top gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-primary-400 via-primary-500 to-violet-500 opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="p-5">
        {/* Language badge */}
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${lang.bg} ${lang.text} ${lang.border}`}
        >
          {lang.label}
        </span>

        {/* Title */}
        <h3 className="mt-3 text-base font-semibold text-slate-800 group-hover:text-primary-600 transition-colors line-clamp-2">
          {textbook.title}
        </h3>

        {/* Publisher */}
        {textbook.publisher && (
          <p className="mt-1.5 text-sm text-slate-500">{textbook.publisher}</p>
        )}

        {/* Footer info */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span>MP3 {textbook.mp3Count ?? textbook.mp3_count ?? 0}개</span>
          </div>
          <span className="text-xs text-primary-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            이메일로 받기 &rarr;
          </span>
        </div>
      </div>
    </button>
  )
}
