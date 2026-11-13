# Registro de cambios · XP Negocio 2026

Todas las fechas corresponden a 2026. Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [1.2.0] · 2026-11-13

Personalización del escritorio y limpieza de la aplicación.

### Añadido

- **Memoria de ventanas por aplicación**: se guardan posición, tamaño y estado maximizado
  (`settings.windowState`) y se restauran al volver a abrir la app. Restaurar después de maximizar
  devuelve la ventana exactamente a su sitio anterior. Interruptor y botón de restablecimiento en
  Panel de control → Pantalla.
- **Iconos del escritorio arrastrables**: se mueven con puntero (ratón o dedo), se ajustan a la
  cuadrícula al soltar (`settings.iconSnap`) y su posición se recuerda (`settings.iconPos`). Los
  iconos sin posición guardada se reparten en las ranuras libres. Opciones "Alinear iconos" en el
  menú contextual del escritorio y en Panel de control → Pantalla.
- **Escala de la pantalla en %** (80–160 %): agranda o reduce todos los elementos —textos, iconos,
  ventanas, menús y barra de tareas— mediante zoom del documento. Presets 80/90/100/110/125/150 y
  restablecer al 100 %.
- **Tamaño del texto en %** (80–150 %): escala solo la tipografía con la variable CSS
  `--text-scale` (todos los `font-size` la multiplican).
- Atajos `Ctrl` + `Alt` + `+` / `-` para la escala y `Ctrl` + `Alt` + `0` para restablecerla.
- En **móvil** los widgets vuelven a mostrarse, en una fila compacta sobre la barra de tareas.

### Cambiado

- Los iconos del escritorio pasan de una rejilla CSS a una capa con posicionamiento absoluto.
- El gestor de ventanas mide en coordenadas locales, así que arrastrar y redimensionar siguen siendo
  exactos con cualquier escala de pantalla.
- Versión unificada en 1.2.0 (`api.php`, login, Panel de control y documentación).

### Corregido

- **Panel de control en pantallas estrechas**: las pestañas se estiraban a toda la altura y el
  contenido quedaba desbordado. Ahora son una fila desplazable que centra la pestaña activa.
- Al subir la escala de pantalla las ventanas abiertas quedaban cortadas por el borde derecho: ahora
  se encajan dentro del área visible.
- Los toasts tapaban los widgets en móvil; ahora aparecen por encima de ellos.

### Eliminado

- **Navegador XP**: app, estilos, icono, referencias en menús y documentación. La aplicación ya no
  incrusta sitios externos (dependían de `X-Frame-Options` y no funcionaban en la mayoría).

## [1.1.0] · 2026-11-10

Cierre de la generación del código: se corrigieron los fallos que impedían usar la aplicación y se
completó la documentación y el empaquetado.

### Corregido · bloqueantes

- **El arranque se quedaba en "Iniciando el sistema…"**. `applyTheme()` leía `XP.store.settings`
  antes de que `XP.store.init()` resolviera, con `state` en `null`, y la promesa de arranque se
  rechazaba en silencio. Ahora los getters de `XP.store` son seguros antes de `init()` y el tema se
  aplica después de cargar el estado.
- **El inicio de sesión nunca funcionaba**. El login y el Panel de control llamaban a `XP.auth`,
  que no existía (el objeto se exportaba solo como `XP.store.auth`). Se añadió el alias `XP.auth`.
- **El menú Inicio fallaba al entrar**. `initDesktop()` leía `auth` desde `settings` en lugar del
  estado; la primera ventana abierta lanzaba un `TypeError` y cortaba la inicialización.

### Corregido · datos y acciones

- **Todas las confirmaciones devolvían "cancelar"**. En `UI.confirm()` el `close()` disparaba
  `onClose` → `resolve(false)` antes que `resolve(true)`, así que borrar operaciones, productos,
  notas, vaciar la papelera, borrar la demo o restablecer el sistema no hacían nada. Se añadió un
  candado de resolución (`settled`).
- **Los formularios devolvían `null`** en lugar de los valores introducidos, por el mismo motivo en
  `UI.formDialog()`.
- **El estado de resultados no mostraba importes**. La clase `pos` de las cifras positivas
  colisionaba con `.pos` (el layout grid del punto de venta): aplicada a un `<tr>` rompía la tabla y
  empujaba las columnas fuera del panel. Se renombraron los modificadores a `is-pos` / `is-neg`.
- **Tablas anchas desbordaban su panel** en grids: se añadió `min-width: 0` a los hijos de
  `.app__grid` y a `.panel`.
- **La meta mensual de Mi PC** usaba los ingresos del rango seleccionado en las pestañas, aunque la
  etiqueta dijera "del mes". Ahora calcula siempre el mes en curso.
- **Ayuda y "Ver pista" del login no se veían**: los modales y avisos vivían dentro de
  `#screen-desktop`, que está oculto en la pantalla de acceso. `#toasts` y `#modal-root` pasaron al
  nivel de `<body>`, así que también se ven el aviso de sesión bloqueada y los diálogos del login.
- **Reabrir una app con una intención** (por ejemplo "Nuevo gasto" desde Mi PC, o el buscador con
  otra consulta) solo enfocaba la ventana existente. Ahora se vuelve a montar con las opciones
  fusionadas.
- **Tras cambiar el modo de guardado** en el Panel, los botones de servidor seguían deshabilitados
  porque la sección no se re-renderizaba.
- **Categorías inválidas**: un JSON importado o antiguo con `category` vacía dejaba productos sin
  etiqueta. Ahora se normaliza a `otros` al cargar datos.

### Añadido

- `README.md` completo: características, capturas, instalación, modelo de datos, fórmulas
  contables, respaldos, estructura, atajos, notas de seguridad y estado del proyecto.
- `CHANGELOG.md` (este archivo) y `LICENSE` (MIT).
- Capturas en `docs/screenshots/` para escritorio, login y las apps principales.
- Accesibilidad: `aria-live` en los avisos, `role="group"` con etiqueta en los iconos del
  escritorio y foco visible conservado en toda la interfaz.
- Ajustes responsive para pantallas estrechas: barra de herramientas en dos filas limpias,
  pestañas de rango con desplazamiento horizontal y KPIs refluidos.

### Verificado

- Las 17 ventanas (16 apps + bienvenida) abren sin errores de consola.
- Flujo de venta completo: ticket, descuento, cobro, snapshot de costo, descuento de stock y
  ganancia estimada.
- Contabilidad: ingresos, COGS, gastos, ganancia bruta y neta coinciden con un cálculo
  independiente sobre el JSON exportado (0 discrepancias en 291 operaciones).
- Exportaciones CSV de inventario, gastos, operaciones, reportes y estado de resultados.
- Modo servidor PHP: `ping`, `save`, `load`, copias automáticas y persistencia tras recargar.
- Importar/exportar JSON, borrar demo, restablecer sistema y restauración desde la papelera.
- Vista previa autocontenida (`preview/index.html`): arranque, login y las 17 ventanas sin errores.
- Diseño en 390 px de ancho: escritorio en dos columnas, apps maximizadas y POS apilado.

---

## [1.0.0] · 2026-11-10

Primera versión funcional del escritorio y las apps de negocio.

### Añadido

- Arranque, login XP con SHA-256 y sal, "recordarme" y bloqueo por inactividad.
- Gestor de ventanas, iconos de escritorio, menú Inicio de dos columnas, widgets y menú contextual.
- Apps: Mi PC, Ventas (POS), Inventario, Operaciones, Inversiones, Gastos, Contabilidad, Reportes,
  Panel de control, Papelera, Mis documentos, Calculadora, Navegador, Buscar, Reloj y Ayuda.
- Backend PHP opcional (`api.php`) con guardado atómico, copias automáticas y bloqueo de `/data`.
- Datos de demostración de 45 días y herramienta de vista previa de un solo archivo.
- Temas Bliss, Atardecer y Noche; sonidos y animaciones configurables.
