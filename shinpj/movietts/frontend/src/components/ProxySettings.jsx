import { useState, useEffect } from 'react';
import { getSettings, setProxy } from '../api/client';

export default function ProxySettings({ open, onClose }) {
  const [proxyUrl, setProxyUrl] = useState('');
  const [currentProxy, setCurrentProxy] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      getSettings()
        .then((data) => {
          setCurrentProxy(data.proxy_url || null);
          setProxyUrl(data.proxy_url || '');
        })
        .catch(() => {});
    }
  }, [open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await setProxy(proxyUrl);
      setCurrentProxy(proxyUrl);
    } catch (err) {
      alert('프록시 설정 저장에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  const handleClear = async () => {
    setLoading(true);
    try {
      await setProxy('');
      setCurrentProxy(null);
      setProxyUrl('');
    } catch (err) {
      alert('프록시 해제에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 제목 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-slate-400">⚙</span>
            프록시 설정
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* 상태 표시 */}
        <div className="mb-4">
          <span className="text-xs font-medium text-slate-400">현재 상태: </span>
          {currentProxy ? (
            <span className="text-xs font-medium text-emerald-400">설정됨 — {currentProxy}</span>
          ) : (
            <span className="text-xs font-medium text-slate-500">미설정</span>
          )}
        </div>

        {/* 입력 필드 */}
        <label className="block text-sm text-slate-300 mb-1.5">프록시 URL</label>
        <input
          type="text"
          value={proxyUrl}
          onChange={(e) => setProxyUrl(e.target.value)}
          placeholder="socks5://127.0.0.1:1080"
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
        />

        {/* 안내 텍스트 */}
        <p className="text-xs text-slate-500 mb-5">
          Douyin 등 지역 제한 사이트 이용 시 VPN/프록시가 필요합니다
        </p>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            저장
          </button>
          <button
            onClick={handleClear}
            disabled={loading}
            className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-slate-300 text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            해제
          </button>
        </div>
      </div>
    </div>
  );
}
