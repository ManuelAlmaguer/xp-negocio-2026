/**
 * Genera una vista previa de un solo archivo (index.html autocontenido)
 * para publicarla en un hosting estático sin dependencias externas.
 *
 *   node tools/build-preview.mjs
 *
 * Salida: preview/index.html
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'preview');

const mime = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function dataUri(file) {
  const abs = join(root, file.replace(/^\.?\//, ''));
  if (!existsSync(abs)) return null;
  const ext = abs.slice(abs.lastIndexOf('.'));
  const b64 = readFileSync(abs).toString('base64');
  return `data:${mime[ext] || 'application/octet-stream'};base64,${b64}`;
}

let html = readFileSync(join(root, 'index.html'), 'utf8');

// CSS → <style>, con imágenes embebidas
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => {
  let css = readFileSync(join(root, href), 'utf8');
  css = css.replace(/url\(["']?([^"')]+)["']?\)/g, (match, url) => {
    if (url.startsWith('data:') || url.startsWith('http')) return match;
    const uri = dataUri(join('assets/css', url));
    return uri ? `url("${uri}")` : match;
  });
  return `<style>\n${css}\n</style>`;
});

// favicon embebido
html = html.replace(/<link rel="icon" href="([^"]+)"[^>]*>/, (_, href) => {
  const uri = dataUri(href);
  return uri ? `<link rel="icon" href="${uri}">` : '';
});

// JS → inline
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) => {
  const js = readFileSync(join(root, src), 'utf8');
  return `<script>\n${js}\n</script>`;
});

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'index.html'), html);
console.log(`Vista previa generada: ${join(outDir, 'index.html')} (${(html.length / 1024).toFixed(1)} KB)`);
