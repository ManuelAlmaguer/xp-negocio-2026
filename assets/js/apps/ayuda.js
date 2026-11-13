/* ============================================================
   XP Negocio 2026 · Ayuda y ventana de bienvenida
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util, F = XP.fmt;

  /* ------------------------------ Ayuda ------------------------------ */
  function mountHelp(win) {
    win.setTitle('Ayuda y soporte');
    win.setSubtitle('Guía rápida de XP Negocio 2026');

    win.content.innerHTML = '<div class="app" style="flex:1"><div class="app__scroll"><div class="help">' +
      '<h2>Centro de ayuda</h2>' +
      '<p>Todo lo que necesitas para llevar la contabilidad de tu negocio de cigarros y saldo móvil desde un escritorio clásico.</p>' +

      '<h3>Primeros pasos</h3>' +
      '<ul>' +
        '<li>El sistema arranca con la cuenta <code>admin / admin</code>. Cámbiala en <strong>Panel de control → Cuenta y acceso</strong>.</li>' +
        '<li>Revisa los productos de ejemplo en <strong>Inventario</strong> y ajusta costos, precios y stock a los tuyos.</li>' +
        '<li>Borra los datos de demostración desde <strong>Panel de control → Datos y respaldos</strong> cuando quieras empezar de cero.</li>' +
        '<li>Registra cada venta desde <strong>Ventas</strong>: el sistema descuenta el stock y calcula la ganancia.</li>' +
      '</ul>' +

      '<h3>Cómo se calculan tus números</h3>' +
      '<ul>' +
        '<li><strong>Ingresos:</strong> suma de todas las ventas del periodo.</li>' +
        '<li><strong>Costo de ventas:</strong> el costo del producto en el momento de la venta (no el actual).</li>' +
        '<li><strong>Ganancia bruta:</strong> ingresos − costo de ventas.</li>' +
        '<li><strong>Ganancia neta:</strong> ganancia bruta − gastos operativos.</li>' +
        '<li><strong>Margen:</strong> ganancia ÷ ingresos × 100. El margen por producto usa el precio de venta como base.</li>' +
        '<li><strong>Capital actual:</strong> aportes − retiros + ganancia neta acumulada.</li>' +
        '<li><strong>Patrimonio:</strong> capital actual + valor del inventario a costo.</li>' +
        '<li><strong>ROI:</strong> ganancia neta ÷ inversión neta × 100.</li>' +
      '</ul>' +

      '<h3>Ventas de saldo móvil</h3>' +
      '<p>Los productos de la categoría <strong>Saldo móvil</strong> no descuentan inventario. Si vendes una recarga de un monto que no está en el catálogo, usa <strong>Venta libre</strong> dentro de Ventas: escribes el precio cobrado, el costo y el método de pago.</p>' +

      '<h3>Dónde se guardan los datos</h3>' +
      '<p>Por defecto en el <strong>localStorage</strong> de este navegador. Si sirves la carpeta con PHP, puedes activar el modo <strong>archivo JSON</strong> en Panel de control → Datos y respaldos; se guardará en <code>data/app-data.json</code> y podrás crear copias en <code>data/backups/</code>.</p>' +
      '<p><strong>Importante:</strong> los datos del navegador son de este equipo y de este navegador. Exporta un respaldo JSON con frecuencia.</p>' +

      '<h3>Atajos y gestos</h3>' +
      '<ul>' +
        '<li><kbd>Ctrl</kbd> + <kbd>K</kbd>: abrir la búsqueda global.</li>' +
        '<li><kbd>Ctrl</kbd> + <kbd>L</kbd>: bloquear la sesión.</li>' +
        '<li>Doble clic en un icono: abrir su ventana. Doble clic en la barra de título: maximizar.</li>' +
        '<li>Clic derecho en el escritorio: menú contextual con accesos rápidos.</li>' +
      '</ul>' +

      '<h3>Preguntas frecuentes</h3>' +
      '<p><strong>¿Puedo cambiar la moneda?</strong> Sí, en Panel de control → Negocio. Cambia el código y el símbolo; los importes existentes no se convierten.</p>' +
      '<p><strong>¿Qué pasa si elimino una venta?</strong> Se mueve a la Papelera de reciclaje y deja de contar en las cuentas. Puedes restaurarla cuando quieras.</p>' +
      '<p><strong>¿Cómo respaldo todo?</strong> Panel de control → Datos y respaldos → Exportar JSON. Guarda ese archivo en un lugar seguro.</p>' +
      '<p><strong>¿Funciona sin internet?</strong> Sí. Toda la aplicación trabaja sin conexión.</p>' +
      '</div></div></div>';
  }

  XP.wm.register({
    id: 'ayuda',
    title: 'Ayuda y soporte',
    desktopLabel: 'Ayuda',
    icon: 'ayuda',
    width: 780,
    height: 600,
    description: 'Guía de uso y cálculos',
    mount: mountHelp
  });

  /* ------------------------------ Bienvenida ------------------------------ */
  var LEFT = [
    { app: 'ventas', label: 'Ventas', icon: 'ventas' },
    { app: 'inventario', label: 'Inventario', icon: 'inventario' },
    { app: 'operaciones', label: 'Operaciones', icon: 'operaciones' },
    { app: 'inversiones', label: 'Inversiones', icon: 'inversiones' },
    { app: 'gastos', label: 'Gastos', icon: 'gastos' }
  ];
  var RIGHT = [
    { app: 'mipc', label: 'Mi PC', icon: 'mipc' },
    { app: 'contabilidad', label: 'Contabilidad', icon: 'contabilidad' },
    { app: 'reportes', label: 'Reportes', icon: 'reportes' },
    { app: 'notas', label: 'Mis documentos', icon: 'documentos' },
    { app: 'panel', label: 'Panel de control', icon: 'panel' }
  ];

  function mountWelcome(win) {
    var a = XP.store.state.auth;
    var s = XP.store.settings;
    win.setTitle('Bienvenido');
    win.setSubtitle('XP Negocio 2026');

    win.content.innerHTML =
      '<div style="flex:1;display:flex;flex-direction:column;background:#fff">' +
        '<div style="display:flex;align-items:center;gap:12px;padding:16px 18px;background:linear-gradient(135deg,#0b4fb0,#1f7be0);color:#fff">' +
          '<div style="width:50px;height:50px;border-radius:12px;background:linear-gradient(180deg,#fff,#cfe6ff);color:#0b4fb0;display:grid;place-items:center;font-weight:700;font-size:calc(20px * var(--text-scale));box-shadow:0 4px 12px rgba(0,20,50,.3)">' + U.esc(F.initials(a.displayName || a.username)) + '</div>' +
          '<div><div style="font-size:calc(16px * var(--text-scale));font-weight:700;text-shadow:0 1px 2px rgba(0,30,70,.4)">' + U.esc(a.displayName || a.username) + '</div>' +
          '<div style="font-size:calc(11.5px * var(--text-scale));color:#cfe6ff">Bienvenido a ' + U.esc(s.businessName) + '</div></div>' +
          '<button class="win__btn" id="welcome-x" style="margin-left:auto;width:26px;height:24px" title="Cerrar">' + XP.icon('close', 13) + '</button>' +
        '</div>' +
        '<div style="padding:14px 16px;display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;flex:1">' +
          LEFT.map(function (x) { return linkHTML(x); }).join('') +
          RIGHT.map(function (x) { return linkHTML(x); }).join('') +
        '</div>' +
        '<div style="padding:10px 16px;border-top:1px solid var(--line-soft);background:#f7fbff;display:flex;align-items:center;justify-content:space-between;gap:10px">' +
          '<label class="check" style="font-size:calc(10.5px * var(--text-scale))"><input type="checkbox" id="welcome-show"' + (s.showWelcome !== false ? ' checked' : '') + '> Mostrar al iniciar</label>' +
          '<div class="row" style="gap:6px"><button class="btn btn--sm" id="welcome-help">' + XP.icon('help', 12) + ' Ayuda</button>' +
          '<button class="btn btn--primary btn--sm" id="welcome-go">Explorar el escritorio</button></div>' +
        '</div>' +
      '</div>';

    function linkHTML(x) {
      return '<button class="welcome-link" data-app="' + x.app + '" style="display:flex;align-items:center;gap:9px;padding:7px 8px;border-radius:6px;text-align:left;font-size:calc(12px * var(--text-scale));color:var(--ink)">' +
        XP.icon(x.icon, 24) + '<span>' + U.esc(x.label) + '</span></button>';
    }

    win.content.querySelectorAll('[data-app]').forEach(function (b) {
      b.addEventListener('mouseenter', function () { b.style.background = '#eaf4ff'; });
      b.addEventListener('mouseleave', function () { b.style.background = ''; });
      b.addEventListener('click', function () {
        XP.wm.open(b.dataset.app);
        win.close();
      });
    });
    win.content.querySelector('#welcome-x').addEventListener('click', function () { win.close(); });
    win.content.querySelector('#welcome-go').addEventListener('click', function () { win.close(); });
    win.content.querySelector('#welcome-help').addEventListener('click', function () { XP.wm.open('ayuda'); });
    win.content.querySelector('#welcome-show').addEventListener('change', function (e) {
      XP.store.settings.showWelcome = e.target.checked;
      XP.store.save();
    });
  }

  XP.wm.register({
    id: 'bienvenida',
    title: 'Bienvenido',
    desktopLabel: 'Bienvenido',
    icon: 'ayuda',
    width: 560,
    height: 430,
    singleton: true,
    mount: mountWelcome
  });
})();
