import { useState, useEffect } from 'react';
import { downloadSubtitle, getSegments, translateSegments } from '../api/client';

const FORMATS = ['srt', 'vtt', 'ass'];
const LANGUAGES = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const ms = Math.round((seconds % 1) * 1000).toString().padStart(3, '0');
  return `${m}:${s}.${ms}`;
}

export default function SubtitleResult({ taskId, onReset }) {
  const [segments, setSegments] = useState([]);
  const [translatedSegments, setTranslatedSegments] = useState([]);
  const [targetLang, setTargetLang] = useState('ko');
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('srt');
  const [downloadType, setDownloadType] = useState('original');
  const [loadingSegments, setLoadingSegments] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getSegments(taskId);
        setSegments(data.segments || []);
      } catch {
        setError('세그먼트를 불러올 수 없습니다.');
      }
      setLoadingSegments(false);
    })();
  }, [taskId]);

  const handleTranslate = async () => {
    setTranslating(true);
    setError('');
    try {
      const data = await translateSegments(taskId, targetLang);
      setTranslatedSegments(data.segments || []);
      setTranslated(true);
      setDownloadType('translated');
    } catch {
      setError('번역에 실패했습니다. 다시 시도해주세요.');
    }
    setTranslating(false);
  };

  const handleDownload = async () => {
    try {
      const lang = downloadType === 'translated' ? targetLang : undefined;
      const blob = await downloadSubtitle(taskId, selectedFormat, lang);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subtitle${lang ? `_${lang}` : ''}.${selectedFormat}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('다운로드에 실패했습니다.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-800 rounded-2xl p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-green-400">자막 생성 완료!</h2>
        <button
          onClick={onReset}
          className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          새 영상 업로드
        </button>
      </div>

      {/* 원본 텍스트 영역 */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          원본 텍스트
        </h3>
        {loadingSegments ? (
          <div className="bg-slate-900 rounded-xl p-4 text-sm text-slate-500 text-center">
            세그먼트 불러오는 중...
          </div>
        ) : segments.length > 0 ? (
          <div className="bg-slate-900 rounded-xl p-4 max-h-64 overflow-y-auto space-y-1">
            {segments.map((seg, i) => (
              <div key={i} className="text-sm font-mono leading-relaxed">
                <span className="text-blue-400">
                  [{formatTime(seg.start)} → {formatTime(seg.end)}]
                </span>{' '}
                <span className="text-slate-300">{seg.text}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl p-4 text-sm text-slate-500 text-center">
            세그먼트가 없습니다.
          </div>
        )}
      </div>

      {/* 번역 섹션 */}
      <div className="mb-6 bg-slate-900/50 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          번역
        </h3>
        <div className="flex gap-2 mb-4">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setTargetLang(lang.code);
                setTranslated(false);
                setTranslatedSegments([]);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${targetLang === lang.code
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-slate-200'}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleTranslate}
          disabled={translating || segments.length === 0}
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700
            disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
        >
          {translating ? '번역 중...' : '번역하기'}
        </button>
      </div>

      {/* 번역 결과 영역 */}
      {translated && translatedSegments.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
            번역 결과 ({LANGUAGES.find((l) => l.code === targetLang)?.label})
          </h3>
          <div className="bg-slate-900 rounded-xl p-4 max-h-64 overflow-y-auto space-y-1">
            {translatedSegments.map((seg, i) => (
              <div key={i} className="text-sm font-mono leading-relaxed">
                <span className="text-green-400">
                  [{formatTime(seg.start)} → {formatTime(seg.end)}]
                </span>{' '}
                <span className="text-slate-300">{seg.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 text-sm text-red-400 bg-red-900/20 rounded-lg p-3 text-center">
          {error}
        </div>
      )}

      {/* 다운로드 섹션 */}
      <div className="border-t border-slate-700 pt-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          다운로드
        </h3>
        {/* 포맷 선택 */}
        <div className="flex gap-2 mb-4">
          {FORMATS.map((fmt) => (
            <button
              key={fmt}
              onClick={() => setSelectedFormat(fmt)}
              className={`px-4 py-2 rounded-lg text-sm font-medium uppercase transition-colors
                ${selectedFormat === fmt
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-slate-200'}`}
            >
              {fmt}
            </button>
          ))}
        </div>
        {/* 원본/번역 선택 */}
        {translated && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setDownloadType('original')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${downloadType === 'original'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-slate-200'}`}
            >
              원본
            </button>
            <button
              onClick={() => setDownloadType('translated')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${downloadType === 'translated'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-slate-200'}`}
            >
              번역본
            </button>
          </div>
        )}
        {/* 다운로드 버튼 */}
        <button
          onClick={handleDownload}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white
            font-medium rounded-lg transition-colors"
        >
          다운로드 (.{selectedFormat})
          {translated && downloadType === 'translated' ? ' - 번역본' : ''}
        </button>
      </div>
    </div>
  );
}
