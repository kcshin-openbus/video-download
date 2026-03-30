import { useState, useRef } from 'react';

export default function UploadForm({ onUpload, onUrlSubmit, isUploading }) {
  const [mode, setMode] = useState('file'); // file | url
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [url, setUrl] = useState('');
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileSubmit = () => {
    if (!selectedFile) return;
    onUpload(selectedFile, (progress) => setUploadProgress(progress));
  };

  const handleUrlSubmit = () => {
    if (!url.trim()) return;
    onUrlSubmit(url.trim());
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 모드 탭 */}
      <div className="flex gap-2 mb-6 justify-center">
        <button
          onClick={() => setMode('file')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors
            ${mode === 'file' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
        >
          파일 업로드
        </button>
        <button
          onClick={() => setMode('url')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors
            ${mode === 'url' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
        >
          URL 링크
        </button>
      </div>

      {/* 파일 업로드 모드 */}
      {mode === 'file' && (
        <>
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer
              ${dragActive ? 'border-blue-400 bg-blue-400/10' : 'border-slate-600 hover:border-slate-400'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".mp4,.avi,.mkv,.mov,.webm"
              onChange={handleChange}
              className="hidden"
            />
            <div className="text-5xl mb-4">🎬</div>
            <p className="text-lg text-slate-300 mb-2">
              영상 파일을 드래그하거나 클릭하여 선택하세요
            </p>
            <p className="text-sm text-slate-500">
              MP4, AVI, MKV, MOV, WebM (최대 500MB)
            </p>
          </div>

          {selectedFile && (
            <div className="mt-6 bg-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div className="text-left">
                    <p className="text-slate-200 font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-slate-400">{formatSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={handleFileSubmit}
                  disabled={isUploading}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600
                    text-white font-medium rounded-lg transition-colors"
                >
                  {isUploading ? '업로드 중...' : '자막 생성 시작'}
                </button>
              </div>

              {isUploading && uploadProgress > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-400 mt-1">업로드 {uploadProgress}%</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* URL 입력 모드 */}
      {mode === 'url' && (
        <div className="bg-slate-800 rounded-2xl p-8">
          <div className="text-5xl mb-4 text-center">🔗</div>
          <p className="text-center text-slate-300 mb-3">
            영상 URL을 입력하세요
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['YouTube', 'Instagram', 'Facebook', 'Douyin'].map((platform) => (
              <span
                key={platform}
                className="px-3 py-1 text-xs font-medium rounded-full bg-slate-700 text-slate-300 border border-slate-600"
              >
                {platform}
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              placeholder="https://www.youtube.com/watch?v=... 또는 다른 플랫폼 URL"
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg
                text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500
                transition-colors"
            />
            <button
              onClick={handleUrlSubmit}
              disabled={isUploading || !url.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600
                text-white font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              {isUploading ? '처리 중...' : '자막 생성'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3 text-center">
            공개 영상만 지원됩니다
          </p>
          {url && url.toLowerCase().includes('douyin') && (
            <div className="mt-4 bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 text-xs text-amber-400">
              <p className="font-medium mb-1">Douyin 안내</p>
              <p>Douyin은 한국에서 접근이 제한됩니다. 설정에서 프록시(VPN)를 설정하거나, Douyin 앱에서 영상을 저장한 후 "파일 업로드" 탭을 이용해 주세요.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
