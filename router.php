<?php
/**
 * Router para el servidor integrado de PHP:
 *   php -S localhost:8000 router.php
 *
 * Bloquea el acceso directo a la carpeta /data y sirve el resto
 * de archivos estáticos normalmente.
 */
declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if (preg_match('#^/data(/|$)#i', $path)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo '403 · Acceso prohibido';
    return true;
}

if ($path === '/' || $path === '/index.php') {
    require __DIR__ . '/index.php';
    return true;
}

return false;
