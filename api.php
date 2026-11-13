<?php
/**
 * XP Negocio 2026 · API de almacenamiento en archivos JSON
 * -------------------------------------------------------
 * Endpoints (misma origen, sin CORS):
 *   GET  api.php?action=ping     → estado del servidor
 *   GET  api.php?action=load     → devuelve data/app-data.json
 *   POST api.php?action=save     → guarda { "data": {...} }
 *   POST api.php?action=backup   → crea copia en data/backups/
 *   GET  api.php?action=backups  → lista copias
 *
 * Este archivo está pensado para uso personal en red local.
 * No lo expongas a internet sin añadir autenticación.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_BACKUPS = 20;

$dataDir   = __DIR__ . '/data';
$backupDir = $dataDir . '/backups';
$dataFile  = $dataDir . '/app-data.json';

function respond(array $payload, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function ensureDir(string $dir): void
{
    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        respond(['ok' => false, 'error' => 'No se pudo crear el directorio de datos'], 500);
    }
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        respond(['ok' => false, 'error' => 'Cuerpo de la petición vacío'], 400);
    }
    if (strlen($raw) > MAX_BYTES) {
        respond(['ok' => false, 'error' => 'Los datos superan el límite de 8 MB'], 413);
    }
    $json = json_decode($raw, true);
    if (!is_array($json)) {
        respond(['ok' => false, 'error' => 'JSON inválido'], 400);
    }
    return $json;
}

function pruneBackups(string $dir): void
{
    $files = glob($dir . '/app-data-*.json') ?: [];
    sort($files);
    while (count($files) > MAX_BACKUPS) {
        $old = array_shift($files);
        if ($old && is_file($old)) {
            @unlink($old);
        }
    }
}

ensureDir($dataDir);
ensureDir($backupDir);

$action = isset($_GET['action']) ? (string) $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    switch ($action) {
        case 'ping':
            respond([
                'ok'       => true,
                'version'  => '1.2.0',
                'storage'  => 'file',
                'php'      => PHP_VERSION,
                'writable' => is_writable($dataDir),
                'file'     => is_file($dataFile) ? 'app-data.json' : null,
                'bytes'    => is_file($dataFile) ? filesize($dataFile) : 0,
            ]);

        case 'load':
            if (!is_file($dataFile)) {
                respond(['ok' => true, 'data' => null, 'savedAt' => null]);
            }
            $raw = file_get_contents($dataFile);
            $data = json_decode($raw === false ? '' : $raw, true);
            if (!is_array($data)) {
                respond(['ok' => false, 'error' => 'El archivo de datos está dañado'], 500);
            }
            respond([
                'ok'      => true,
                'data'    => $data,
                'savedAt' => date('c', (int) filemtime($dataFile)),
                'bytes'   => filesize($dataFile),
            ]);

        case 'save':
            if ($method !== 'POST') {
                respond(['ok' => false, 'error' => 'Usa POST para guardar'], 405);
            }
            $body = readJsonBody();
            if (!isset($body['data']) || !is_array($body['data'])) {
                respond(['ok' => false, 'error' => 'Falta el objeto "data"'], 400);
            }
            $data = $body['data'];
            if (!isset($data['operations']) || !is_array($data['operations'])) {
                respond(['ok' => false, 'error' => 'El objeto "data" no contiene operaciones válidas'], 400);
            }

            $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
            if ($json === false) {
                respond(['ok' => false, 'error' => 'No se pudo serializar la información'], 500);
            }

            // Copia de seguridad antes de sobrescribir (una por hora como máximo)
            if (is_file($dataFile)) {
                $last = glob($backupDir . '/app-data-*.json') ?: [];
                sort($last);
                $latest = end($last);
                $needBackup = true;
                if ($latest && is_file($latest) && (time() - (int) filemtime($latest)) < 3600) {
                    $needBackup = false;
                }
                if ($needBackup) {
                    @copy($dataFile, $backupDir . '/app-data-' . date('Ymd-His') . '.json');
                    pruneBackups($backupDir);
                }
            }

            $tmp = $dataFile . '.tmp';
            if (file_put_contents($tmp, $json, LOCK_EX) === false) {
                respond(['ok' => false, 'error' => 'No se pudo escribir el archivo de datos'], 500);
            }
            if (!@rename($tmp, $dataFile)) {
                @unlink($tmp);
                respond(['ok' => false, 'error' => 'No se pudo reemplazar el archivo de datos'], 500);
            }
            @chmod($dataFile, 0664);

            respond([
                'ok'      => true,
                'savedAt' => date('c'),
                'bytes'   => filesize($dataFile),
            ]);

        case 'backup':
            if ($method !== 'POST') {
                respond(['ok' => false, 'error' => 'Usa POST para crear copias'], 405);
            }
            if (!is_file($dataFile)) {
                respond(['ok' => false, 'error' => 'Todavía no hay datos guardados'], 400);
            }
            $name = 'app-data-' . date('Ymd-His') . '.json';
            if (!@copy($dataFile, $backupDir . '/' . $name)) {
                respond(['ok' => false, 'error' => 'No se pudo crear la copia'], 500);
            }
            pruneBackups($backupDir);
            respond(['ok' => true, 'file' => 'data/backups/' . $name, 'createdAt' => date('c')]);

        case 'backups':
            $files = glob($backupDir . '/app-data-*.json') ?: [];
            rsort($files);
            $list = array_map(static function (string $f): array {
                return [
                    'file' => 'data/backups/' . basename($f),
                    'bytes' => filesize($f),
                    'createdAt' => date('c', (int) filemtime($f)),
                ];
            }, $files);
            respond(['ok' => true, 'backups' => $list]);

        default:
            respond(['ok' => false, 'error' => 'Acción no válida'], 400);
    }
} catch (Throwable $e) {
    respond(['ok' => false, 'error' => 'Error interno: ' . $e->getMessage()], 500);
}
