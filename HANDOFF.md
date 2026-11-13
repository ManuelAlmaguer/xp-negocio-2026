# Handoff · XP Negocio 2026

> Estado del proyecto al 13 de noviembre de 2026 (**v1.2.0**).
> Repo: https://github.com/ManuelAlmaguer/xp-negocio-2026
> Rama de entrega: `main` (única rama del repositorio)

## Qué es

Escritorio web estilo **Windows XP 2026** que funciona como sistema de gestión para un negocio de
**venta de cigarros y saldo móvil**. Interfaz con ventanas, iconos, widgets, menú Inicio y barra de
tareas, con apps reales de negocio.

Stack: **HTML + CSS + JavaScript (vanilla, sin dependencias) + PHP opcional** para guardar en
archivos JSON. Los datos viven en `localStorage` por defecto; el modo servidor usa
`data/app-data.json`.

Credenciales iniciales: **admin / admin** (se cambian en Panel de control → Cuenta y acceso).

## Estado actual

**Código completo y funcionando.** En v1.2.0 se añadió la personalización del escritorio (memoria de
ventanas, iconos arrastrables y escala de pantalla) y se eliminó el Navegador XP. Ver `CHANGELOG.md`.

### Núcleo
- [x] Pantalla de arranque (boot) y **login XP** con usuario/contraseña, recordar sesión, pista y bloqueo.
- [x] Autenticación local con SHA-256 + sal; sesión en `sessionStorage`/`localStorage`.
- [x] Gestor de ventanas: arrastrar, redimensionar, minimizar, maximizar, foco y botones en la barra de tareas.
- [x] **Memoria de ventanas**: posición, tamaño y maximizado por app (`settings.windowState`).
- [x] **Iconos arrastrables** con ajuste a cuadrícula y posición recordada (`settings.iconPos`, `iconSnap`).
- [x] **Escala de pantalla %** (`settings.uiScale`, zoom del documento) y **tamaño de texto %** (`settings.textScale`).
- [x] Escritorio con iconos, doble clic (toque simple en táctil), selección, menú contextual, buscador global y widgets.
- [x] Widgets también en móvil (fila compacta: reloj, estado y almacenamiento).
- [x] Menú Inicio de dos columnas, accesos rápidos, bloqueo, cerrar sesión y apagado.
- [x] Temas Bliss, Atardecer y Noche. Animaciones y sonidos configurables.
- [x] Avisos y modales a nivel de `<body>`: se ven también en la pantalla de login.
- [x] Datos demo de 45 días (se pueden borrar desde el Panel).

### Apps (16 registradas, sin Navegador)
- [x] **Mi PC**: capital, inversión neta, ganancias, ROI, meta mensual, KPIs, gráficos, top productos, stock bajo y accesos rápidos.
- [x] **Ventas (POS)**: catálogo por categorías, búsqueda, ticket, descuento %, pago, cliente, nota, validación de stock y ticket imprimible.
- [x] **Inventario**: CRUD, costo/precio/margen, stock mínimo, ajustes con motivo, filtros, orden y CSV.
- [x] **Operaciones**: historial unificado con filtros, edición y borrado a papelera.
- [x] **Inversiones**: aportes/retiros, capital actual, ROI, evolución y tabla.
- [x] **Gastos**: categorías, registro, edición, gráfico y CSV.
- [x] **Contabilidad**: estado de resultados, análisis vertical, comparación, indicadores, cierre del día, CSV/print.
- [x] **Reportes**: rangos, agrupación día/semana/mes, filtro por categoría, gráficos, tabla, top productos, pagos, CSV/print.
- [x] **Panel de control**: Cuenta, Negocio, Apariencia, **Pantalla**, Datos y respaldos, Acerca de.
- [x] **Papelera**, **Mis documentos**, **Calculadora**, **Buscar**, **Reloj**, **Ayuda** y ventana de **Bienvenida**.
- [x] Backend PHP: `api.php` (ping/load/save/backup/backups), guardado atómico, copias automáticas, `.htaccess` para bloquear `/data`, `router.php` para `php -S`.
- [x] `tools/build-preview.mjs` para generar una vista previa autocontenida (`preview/index.html`, no versionada en esta entrega).

### Documentación y entrega
- [x] `README.md` con capturas, instalación, modelo de datos, fórmulas, respaldos, estructura, atajos y seguridad.
- [x] `CHANGELOG.md` con el detalle de 1.2.0 y 1.1.0.
- [x] `LICENSE` (MIT) y créditos.
- [x] Capturas en `docs/screenshots/` (de la 1.1; la interfaz cambió poco salvo iconos y escala).
- [x] Rama `main` reescrita con el código completo y ZIP de entrega.

## Verificaciones realizadas (v1.2.0)

| Área | Resultado |
| --- | --- |
| Apertura de las 16 apps | Sin errores de consola ni excepciones. |
| Flujo de venta (POS) | Producto al carrito, cobro y nueva operación registrada. |
| Memoria de ventanas | Mover, redimensionar y maximizar se guarda; al reabrir vuelve al mismo sitio (probado tras recargar). |
| Iconos arrastrables | Arrastre con puntero, ajuste a cuadrícula (múltiplos de 94 × 90) y persistencia tras recargar. |
| Escala de pantalla | 80 / 100 / 110 / 125 %: el zoom se aplica, las ventanas se reencajan y no hay desbordes. |
| Tamaño de texto | 115 % aplicado por `--text-scale` sin romper layouts. |
| Panel en móvil (390 px) | Pestañas en fila desplazable, contenido sin desbordes. |
| Widgets en móvil | Visibles en fila compacta sobre la barra de tareas. |

## Cómo ejecutar

```bash
# Opción A · servidor PHP (recomendado, habilita JSON)
php -S localhost:8000 router.php

# Opción B · solo estático
python3 -m http.server 8000   # o abrir index.html

# Vista previa de un archivo
node tools/build-preview.mjs   # genera preview/index.html
```

Abrir http://localhost:8000 y entrar con `admin / admin`.

## Estructura

```
xp-negocio-2026/
├── index.html            # shell: boot, login, escritorio, taskbar, start menu
├── index.php             # entrada PHP (sirve index.html)
├── api.php               # API JSON (ping/load/save/backup/backups)
├── router.php            # router para php -S, bloquea /data
├── assets/
│   ├── css/              # base, login, desktop, window, apps
│   ├── img/              # wallpapers (bliss/sunset/night), favicon
│   └── js/
│       ├── core/         # icons, store, charts, ui, wm
│       ├── apps/         # 16 apps registradas
│       └── desktop.js    # arranque, login, iconos, widgets, menú
├── data/                 # JSON + backups (ignorados por git)
├── docs/screenshots/     # capturas
├── tools/build-preview.mjs
├── README.md · CHANGELOG.md · HANDOFF.md · LICENSE
```

## Cómo funcionan las novedades de 1.2.0

- **Memoria de ventanas** (`assets/js/core/wm.js`): `storeGeometry(win)` guarda
  `{ x, y, w, h, max }` en `settings.windowState[appId]` al soltar el arrastre, al redimensionar, al
  maximizar/restaurar y al cerrar. `WM.open()` lo restaura con `fitGeometry()` (recorta al área
  visible). `WM.clampAll()` reencaja las ventanas abiertas al cambiar el tamaño de la ventana del
  navegador o la escala. `WM.resetGeometry()` las olvida.
- **Iconos** (`assets/js/desktop.js`): cada icono es un `<button class="dicon">` posicionado con
  `translate3d`. Las posiciones viven en `settings.iconPos[appId]`; la cuadrícula se define con
  `--icon-slot-w/h` (94 × 90 en escritorio, 84 × 86 en móvil). `snapIconPos()` ajusta a la ranura y
  `alignAllIcons()` reparte todos en columnas.
- **Escala** (`applyScale()` en `desktop.js`): `document.documentElement.style.zoom = uiScale/100`
  y `--text-scale = textScale/100` en `:root`. Como las medidas de puntero llegan en píxeles de
  pantalla, `XP.ui.zoom()` y `localPoint()` convierten a coordenadas locales en el gestor de
  ventanas y en el arrastre de iconos. **Si añades código nuevo con `clientX/clientY`, divide por
  `XP.ui.zoom()`.**

## Riesgos / notas

- La autenticación es local (client-side): sirve para uso personal, no como seguridad real multiusuario.
- `localStorage` es por navegador y equipo; si se limpian datos del sitio, se pierde todo. Exportar respaldos.
- El modo servidor no tiene autenticación propia: no exponer `api.php` a internet sin protegerlo.
- `zoom` del documento requiere navegadores modernos (Chrome 128+, Firefox 126+, Safari 16.4+).
  En navegadores sin soporte la escala simplemente no se aplica; el resto funciona igual.
- Las posiciones guardadas son en píxeles locales: si abres la app en una pantalla mucho más
  pequeña, `fitGeometry()` recorta la ventana al área visible.

## Próximos pasos posibles

- Exportación a PDF de reportes y estado de resultados.
- Multi-usuario con roles y permisos.
- Lector de código de barras para el POS.
- Temas de tamaño de iconos (32/48/64 px) junto a la escala de pantalla.
