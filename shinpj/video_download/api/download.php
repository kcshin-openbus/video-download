<?php
$binary      = dirname(__DIR__) . '/yt-dlp_linux';
$ffmpeg      = dirname(__DIR__) . '/ffmpeg';
$tmpDir      = dirname(__DIR__) . '/tmp';
$cookiesFile = dirname(__DIR__) . '/cookies.txt';
if (!is_dir($tmpDir)) mkdir($tmpDir, 0755, true);

$action     = $_GET['action']     ?? '';
$url        = $_GET['url']        ?? '';
$origUrl    = $_GET['orig_url']   ?? '';
$formatId   = $_GET['format_id']  ?? '';
$needsMerge = ($_GET['needs_merge'] ?? '') === '1';
$filename   = $_GET['filename']   ?? 'video';
$token      = preg_replace('/[^a-z0-9]/', '', $_GET['token'] ?? '');

// ── action=status: 백그라운드 완료 확인 (폴백용) ────────────────────────────
if ($action === 'status' && $token) {
    header('Content-Type: application/json');
    $outFile  = $tmpDir . '/dl_' . $token . '.mkv';
    $doneFile = $outFile . '.done';
    $logFile  = $outFile . '.log';
    $ready    = file_exists($doneFile) && file_exists($outFile) && filesize($outFile) > 0;
    echo json_encode([
        'ready' => $ready,
        'size'  => file_exists($outFile) ? filesize($outFile) : 0,
        'error' => (!$ready && file_exists($logFile)) ? substr(file_get_contents($logFile), -300) : '',
    ]);
    exit;
}

// ── action=get: 완성된 파일 서빙 (폴백용) ────────────────────────────────────
if ($action === 'get' && $token) {
    $outFile  = $tmpDir . '/dl_' . $token . '.mkv';
    $doneFile = $outFile . '.done';
    if (!file_exists($outFile) || !file_exists($doneFile) || filesize($outFile) === 0) {
        http_response_code(404); echo '파일 없음'; exit;
    }
    $dlName = pathinfo($filename, PATHINFO_FILENAME) . '.mkv';
    @set_time_limit(0);
    while (ob_get_level()) ob_end_clean();
    header('Content-Disposition: attachment; filename*=UTF-8\'\'' . rawurlencode($dlName));
    header('Content-Type: video/x-matroska');
    header('Content-Length: ' . filesize($outFile));
    header('X-Accel-Buffering: no');
    readfile($outFile);
    @unlink($outFile); @unlink($doneFile); @unlink($outFile . '.log');
    exit;
}

// ── 고화질 DASH 머지: popen으로 스트리밍 ────────────────────────────────────
if ($needsMerge && $formatId && $origUrl) {
    $dlName = pathinfo($filename, PATHINFO_FILENAME) . '.mkv';

    @set_time_limit(0);
    @ini_set('memory_limit', '256M');
    ignore_user_abort(false);

    while (ob_get_level()) ob_end_clean();
    header('Content-Disposition: attachment; filename*=UTF-8\'\'' . rawurlencode($dlName));
    header('Content-Type: video/x-matroska');
    header('X-Accel-Buffering: no');
    header('Cache-Control: no-cache');

    $ffmpegOpt = file_exists($ffmpeg) ? ' --ffmpeg-location ' . escapeshellarg($ffmpeg) : '';

    $cmd =
        'TMPDIR=' . escapeshellarg($tmpDir) .
        ' ' . escapeshellarg($binary) .
        $ffmpegOpt .
        ' --cookies ' . escapeshellarg($cookiesFile) .
        ' --merge-output-format mkv' .
        ' -f ' . escapeshellarg($formatId . '+bestaudio/best') .
        ' -o - ' .
        escapeshellarg($origUrl) .
        ' 2>/dev/null';

    $handle = popen($cmd, 'r');
    if ($handle) {
        while (!feof($handle)) {
            $chunk = fread($handle, 1024 * 64);
            if ($chunk === false || strlen($chunk) === 0) break;
            echo $chunk;
            flush();
        }
        pclose($handle);
    }
    exit;
}

// ── 일반 포맷: CDN 직접 리다이렉트 ──────────────────────────────────────────
if ($url) {
    header('Location: ' . $url, true, 302);
    exit;
}

http_response_code(400);
echo 'URL이 없습니다.';
