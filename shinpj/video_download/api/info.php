<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$data = json_decode(file_get_contents('php://input'), true);
$url = isset($data['url']) ? $data['url'] : '';

if (!$url) {
    http_response_code(400);
    echo json_encode(['error' => 'URL을 입력해주세요.']);
    exit;
}

// URL 안전 처리
$url = str_replace('"', '', $url);

// yt-dlp 바이너리 실행 (TMPDIR을 홈 디렉토리로 설정하여 noexec 우회)
$binary = dirname(__DIR__) . '/yt-dlp_linux';
$tmpDir = dirname(__DIR__) . '/tmp';
if (!is_dir($tmpDir)) mkdir($tmpDir, 0755, true);
$cookiesFile = dirname(__DIR__) . '/cookies.txt';
$cmd = 'TMPDIR=' . escapeshellarg($tmpDir) . ' ' . escapeshellarg($binary) .
    ' --cookies ' . escapeshellarg($cookiesFile) .
    ' --dump-json --no-playlist ' . escapeshellarg($url) . ' 2>&1';
$handle = popen($cmd, 'r');
$output = '';
while (!feof($handle)) {
    $output .= fread($handle, 8192);
}
pclose($handle);

if (!$output) {
    http_response_code(500);
    echo json_encode(['error' => 'yt-dlp 출력 없음. 명령: ' . $cmd]);
    exit;
}

// JSON 부분만 추출 (WARNING 메시지 제거)
$lines = explode("\n", trim($output));
$jsonLine = '';
foreach (array_reverse($lines) as $line) {
    if (substr(trim($line), 0, 1) === '{') {
        $jsonLine = $line;
        break;
    }
}

$info = json_decode($jsonLine, true);
if (!$info) {
    http_response_code(500);
    echo json_encode(['error' => 'JSON 파싱 실패. 출력: ' . substr($output, 0, 500)]);
    exit;
}

// 포맷 분류: 통합(combined) / DASH 영상 / DASH 오디오
$combinedFormats  = [];  // hasVideo && hasAudio → 바로 재생 가능
$dashVideoByHeight = []; // height => best format (hasVideo && !hasAudio)
$bestAudio = null;

if (isset($info['formats'])) {
    foreach ($info['formats'] as $f) {
        if (empty($f['url'])) continue;
        if (isset($f['ext']) && $f['ext'] === 'mhtml') continue;

        $hasVideo = isset($f['vcodec']) && $f['vcodec'] !== 'none';
        $hasAudio = isset($f['acodec']) && $f['acodec'] !== 'none';
        if (!$hasVideo && !$hasAudio) continue;

        $height = isset($f['height']) && $f['height'] ? intval($f['height']) : 0;
        $ext    = isset($f['ext']) ? $f['ext'] : 'mp4';
        $tbr    = isset($f['tbr']) ? floatval($f['tbr']) : 0;

        if ($hasVideo && $hasAudio) {
            $label = $height ? $height . 'p' : ($f['format_note'] ?? $f['format_id']);
            if (!isset($combinedFormats[$label])) {
                $combinedFormats[$label] = [
                    'quality'     => $label,
                    'url'         => $f['url'],
                    'ext'         => $ext,
                    'needs_merge' => false,
                    'format_id'   => '',
                ];
            }
        } elseif ($hasVideo && !$hasAudio && $height > 0) {
            // 같은 높이라면 tbr 높은 것 우선
            if (!isset($dashVideoByHeight[$height]) || $tbr > $dashVideoByHeight[$height]['tbr']) {
                $dashVideoByHeight[$height] = [
                    'height'    => $height,
                    'url'       => $f['url'],
                    'ext'       => $ext,
                    'format_id' => $f['format_id'],
                    'tbr'       => $tbr,
                ];
            }
        } elseif (!$hasVideo && $hasAudio) {
            $abr = isset($f['abr']) ? floatval($f['abr']) : 0;
            if (!$bestAudio || $abr > floatval($bestAudio['abr'] ?? 0)) {
                $bestAudio = $f;
            }
        }
    }
}

$formats = [];
$maxCombinedHeight = 0;

// 1) 통합 포맷 추가
foreach ($combinedFormats as $f) {
    $formats[] = $f;
    $h = intval($f['quality']);
    if ($h > $maxCombinedHeight) $maxCombinedHeight = $h;
}

// 2) DASH 머지 포맷은 서버 부하로 제외 (CDN 직접 다운로드만 허용)

// 3) 통합 포맷이 아예 없으면 (Instagram 등) DASH 단독 스트림 표시
if (empty($combinedFormats)) {
    foreach ($dashVideoByHeight as $height => $f) {
        $formats[] = [
            'quality'     => $height . 'p (영상만)',
            'url'         => $f['url'],
            'ext'         => $f['ext'],
            'needs_merge' => false,
            'format_id'   => '',
        ];
    }
    if ($bestAudio) {
        $kbps = isset($bestAudio['abr']) ? round($bestAudio['abr']) . 'kbps' : '오디오';
        $formats[] = [
            'quality'     => '오디오 ' . $kbps,
            'url'         => $bestAudio['url'],
            'ext'         => isset($bestAudio['ext']) ? $bestAudio['ext'] : 'm4a',
            'needs_merge' => false,
            'format_id'   => '',
        ];
    }
}

if (empty($formats) && isset($info['url'])) {
    $formats[] = ['quality' => '기본', 'url' => $info['url'], 'ext' => isset($info['ext']) ? $info['ext'] : 'mp4', 'needs_merge' => false, 'format_id' => ''];
}

// 화질 높은 순 정렬
usort($formats, function($a, $b) {
    return intval($b['quality']) - intval($a['quality']);
});

echo json_encode([
    'title'    => isset($info['title']) ? $info['title'] : '제목 없음',
    'thumbnail'=> isset($info['thumbnail']) ? $info['thumbnail'] : '',
    'orig_url' => $url,
    'formats'  => $formats
], JSON_UNESCAPED_UNICODE);
