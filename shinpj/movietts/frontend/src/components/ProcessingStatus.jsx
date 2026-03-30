const STAGE_LABELS = {
  queued: '대기 중',
  downloading: '다운로드 중',
  extracting: '음성 추출 중',
  transcribing: '텍스트 변환 중',
  completed: '완료',
  failed: '실패',
};

const STAGES = ['queued', 'downloading', 'extracting', 'transcribing', 'completed'];

export default function ProcessingStatus({ status }) {
  if (!status) return null;

  const currentIndex = STAGES.indexOf(status.stage);
  const isFailed = status.stage === 'failed';

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-800 rounded-2xl p-8">
      <h2 className="text-xl font-bold text-slate-200 mb-6">처리 상태</h2>

      {/* 프로그레스 바 */}
      <div className="mb-8">
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              isFailed ? 'bg-red-500' : 'bg-blue-500'
            }`}
            style={{ width: `${status.progress}%` }}
          />
        </div>
        <p className="text-right text-sm text-slate-400 mt-2">{status.progress}%</p>
      </div>

      {/* 단계 표시 */}
      <div className="flex justify-between">
        {STAGES.map((stage, i) => {
          const isActive = i <= currentIndex && !isFailed;
          const isCurrent = stage === status.stage;
          return (
            <div key={stage} className="flex flex-col items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${isCurrent ? 'bg-blue-500 text-white ring-4 ring-blue-500/30' :
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
              >
                {isActive && !isCurrent ? '✓' : i + 1}
              </div>
              <span className={`text-xs ${isCurrent ? 'text-blue-400 font-medium' : 'text-slate-500'}`}>
                {STAGE_LABELS[stage]}
              </span>
            </div>
          );
        })}
      </div>

      {isFailed && (
        <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          <p>처리 중 오류가 발생했습니다.</p>
          {status.error_message && (
            <p className="mt-2 text-xs text-red-500/70 font-mono break-all">
              {status.error_message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
