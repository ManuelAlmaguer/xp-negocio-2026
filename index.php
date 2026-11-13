<?php
/**
 * XP Negocio 2026 · Entrada para servidores PHP
 * ---------------------------------------------
 * La aplicación es HTML/CSS/JS puro. Este archivo permite
 * abrirla desde Apache/PHP sin escribir la ruta del index.
 * Si prefieres, puedes abrir index.html directamente.
 */
declare(strict_types=1);

$html = __DIR__ . '/index.html';
if (!is_file($html)) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'No se encontró index.html';
    exit;
}

header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');
readfile($html);
