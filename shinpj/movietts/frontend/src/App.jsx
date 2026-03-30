import { useState, useEffect, useRef } from 'react';
import UploadForm from './components/UploadForm';
import ProcessingStatus from './components/ProcessingStatus';
import SubtitleResult from './components/SubtitleResult';
import ProxySettings from './components/ProxySettings';
import { uploadVideo, uploadUrl, getTaskStatus } from './api/client';

function App() {
  const [step, setStep] = useState('upload'); // upload | processing | result
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const pollingRef = useRef(null);

  const handleUpload = async (file, onProgress) => {
    setIsUploading(true);
    try {
      const result = await uploadVideo(file, 'auto', onProgress);
      setTaskId(result.task_id);
      setStep('processing');
    } catch (err) {
      alert('업로드에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    }
    setIsUploading(false);
  };

  const handleUrlSubmit = async (url) => {
    setIsUploading(true);
    try {
      const result = await uploadUrl(url);
      setTaskId(result.task_id);
      setStep('processing');
    } catch (err) {
      alert('URL 처리에 실패했습니다: ' + (err.response?.data?.detail || err.message));
    }
    setIsUploading(false);
  };

  useEffect(() => {
    if (step !== 'processing' || !taskId) return;

    const poll = async () => {
      try {
        const s = await getTaskStatus(taskId);
        setStatus(s);
        if (s.status === 'completed') {
          setStep('result');
        } else if (s.status === 'failed') {
          // 실패 상태 유지
        }
      } catch {
        // 무시
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 1500);
    return () => clearInterval(pollingRef.current);
  }, [step, taskId]);

  const handleReset = () => {
    setStep('upload');
    setTaskId(null);
    setStatus(null);
    clearInterval(pollingRef.current);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* 헤더 */}
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center gap-3">
          <span className="text-3xl">🎬</span>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">MovieTTS</h1>
            <p className="text-xs text-slate-500">영상 음성 분석 &amp; 자막 자동 생성</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg px-3 py-2"
          >
            <span>⚙</span>
            <span>설정</span>
          </button>
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        {step === 'upload' && (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-3">
                영상을 업로드하세요
              </h2>
              <p className="text-slate-400">
                AI가 영상의 음성을 분석하여 자동으로 자막을 생성합니다
              </p>
            </div>
            <UploadForm onUpload={handleUpload} onUrlSubmit={handleUrlSubmit} isUploading={isUploading} />
          </div>
        )}

        {step === 'processing' && (
          <ProcessingStatus status={status} />
        )}

        {step === 'result' && (
          <SubtitleResult taskId={taskId} onReset={handleReset} />
        )}
      </main>

      {/* 푸터 */}
      <footer className="border-t border-slate-800 mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-4 text-center text-xs text-slate-600">
          MovieTTS v0.1.0 — Powered by OpenAI Whisper
        </div>
      </footer>

      {/* 프록시 설정 모달 */}
      <ProxySettings open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default App;
