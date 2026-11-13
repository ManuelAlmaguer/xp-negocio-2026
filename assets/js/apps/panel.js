/* ============================================================
   XP Negocio 2026 · Panel de control
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util, F = XP.fmt, UI = XP.ui;

  var SECTIONS = [
    { id: 'cuenta', label: 'Cuenta y acceso', icon: 'user' },
    { id: 'negocio', label: 'Negocio', icon: 'tag' },
    { id: 'apariencia', label: 'Apariencia', icon: 'eye' },
    { id: 'pantalla', label: 'Pantalla', icon: 'grid' },
    { id: 'datos', label: 'Datos y respaldos', icon: 'database' },
    { id: 'acerca', label: 'Acerca de', icon: 'info' }
  ];

  function mount(win, opts) {
    var active = (opts && opts.section) || 'cuenta';
    var settings = XP.store.settings;

    win.setTitle('Panel de control');
    win.setSubtitle('Configuración del sistema');

    win.content.innerHTML = '<div class="app" style="flex:1"><div class="settings">' +
      '<nav class="settings__nav" id="set-nav">' + SECTIONS.map(function (s) {
        return '<button data-sec="' + s.id + '" class="' + (s.id === active ? 'is-active' : '') + '">' + XP.icon(s.icon, 17) + ' ' + s.label + '</button>';
      }).join('') + '</nav>' +
      '<div class="settings__content" id="set-content"></div>' +
    '</div></div>';

    var nav = win.content.querySelector('#set-nav');
    var content = win.content.querySelector('#set-content');

    nav.querySelectorAll('[data-sec]').forEach(function (b) {
      b.addEventListener('click', function () {
        active = b.dataset.sec;
        nav.querySelectorAll('[data-sec]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        render();
        centerNavTab(b);
      });
    });

    /* En pantallas estrechas las pestañas se desplazan en horizontal: dejamos
       la activa siempre a la vista (antes se cortaba el primer elemento). */
    function centerNavTab(btn) {
      if (!btn) return;
      if (nav.scrollWidth <= nav.clientWidth + 2) return;
      var target = btn.offsetLeft - (nav.clientWidth - btn.offsetWidth) / 2;
      if (nav.scrollTo) nav.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
      else nav.scrollLeft = Math.max(0, target);
    }
    centerNavTab(nav.querySelector('.is-active'));

    function save(patch, msg) {
      Object.assign(XP.store.settings, patch);
      XP.store.save(true);
      if (XP.desktop && XP.desktop.applyTheme) { XP.desktop.applyTheme(); XP.desktop.applyMotion(); }
      if (XP.desktop && XP.desktop.refresh) XP.desktop.refresh();
      XP.toast(msg || 'Configuración guardada', 'success');
    }

    function render() {
      if (active === 'cuenta') return renderCuenta();
      if (active === 'negocio') return renderNegocio();
      if (active === 'apariencia') return renderApariencia();
      if (active === 'pantalla') return renderPantalla();
      if (active === 'datos') return renderDatos();
      return renderAcerca();
    }

    /* ------------------------------ Cuenta ------------------------------ */
    function renderCuenta() {
      var a = XP.store.state.auth;
      content.innerHTML =
        '<h3>Cuenta y acceso</h3><p class="lead">Cambia el usuario, la contraseña y la pista de acceso. La cuenta se guarda en este equipo.</p>' +
        '<div class="set-section"><h4>' + XP.icon('user', 15) + ' Datos de la cuenta</h4>' +
          '<div class="set-grid">' +
            '<div class="field"><label class="field__label">Usuario</label><input id="acc-user" type="text" value="' + U.esc(a.username) + '"></div>' +
            '<div class="field"><label class="field__label">Nombre visible</label><input id="acc-name" type="text" value="' + U.esc(a.displayName || '') + '"></div>' +
            '<div class="field field--full"><label class="field__label">Pista de contraseña</label><input id="acc-hint" type="text" value="' + U.esc(a.hint || '') + '" placeholder="Solo se muestra si la olvidas"></div>' +
          '</div>' +
          '<div class="set-actions"><button class="btn btn--primary btn--sm" id="acc-save">' + XP.icon('save', 13) + ' Guardar cuenta</button></div>' +
          '<p class="muted" style="font-size:calc(10.5px * var(--text-scale));margin-top:8px">Último cambio de contraseña: ' + (a.changedAt ? F.dateTime(a.changedAt) : 'nunca') + '</p>' +
        '</div>' +
        '<div class="set-section"><h4>' + XP.icon('lock', 15) + ' Cambiar contraseña</h4>' +
          '<div class="set-grid">' +
            '<div class="field field--full"><label class="field__label">Contraseña actual</label><input id="pwd-current" type="password" autocomplete="current-password"></div>' +
            '<div class="field"><label class="field__label">Nueva contraseña</label><input id="pwd-new" type="password" autocomplete="new-password"></div>' +
            '<div class="field"><label class="field__label">Confirmar contraseña</label><input id="pwd-confirm" type="password" autocomplete="new-password"></div>' +
          '</div>' +
          '<div class="set-actions"><button class="btn btn--primary btn--sm" id="pwd-save">' + XP.icon('check', 13) + ' Actualizar contraseña</button></div>' +
          '<p class="muted" style="font-size:calc(10.5px * var(--text-scale));margin-top:8px">Mínimo 4 caracteres. Se guarda cifrada con SHA-256 y una sal aleatoria.</p>' +
        '</div>' +
        '<div class="set-section"><h4>' + XP.icon('shield', 15) + ' Seguridad</h4>' +
          '<div class="set-row"><div class="set-row__main"><b>Bloqueo automático</b><small>Pide la contraseña tras un tiempo sin actividad</small></div>' +
            '<select id="acc-lock" style="max-width:170px;height:29px;min-height:0;font-size:calc(11.5px * var(--text-scale))">' +
              [[0, 'Desactivado'], [5, '5 minutos'], [15, '15 minutos'], [30, '30 minutos'], [60, '1 hora']].map(function (o) {
                return '<option value="' + o[0] + '"' + (Number(settings.lockTimeout) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
              }).join('') + '</select></div>' +
          '<div class="set-row"><div class="set-row__main"><b>Cerrar todas las ventanas</b><small>Útil si dejaste aplicaciones abiertas</small></div>' +
            '<button class="btn btn--sm" id="acc-close">Cerrar ventanas</button></div>' +
        '</div>';

      content.querySelector('#acc-save').addEventListener('click', function () {
        var user = content.querySelector('#acc-user').value.trim();
        if (!user) { XP.toast('El usuario no puede estar vacío', 'error'); return; }
        XP.auth.setUsername(user);
        XP.store.state.auth.displayName = content.querySelector('#acc-name').value.trim() || user;
        XP.store.state.auth.hint = content.querySelector('#acc-hint').value.trim();
        XP.store.save(true);
        XP.toast('Cuenta actualizada', 'success');
        render();
      });

      content.querySelector('#pwd-save').addEventListener('click', async function () {
        var cur = content.querySelector('#pwd-current').value;
        var nw = content.querySelector('#pwd-new').value;
        var cf = content.querySelector('#pwd-confirm').value;
        if (!await XP.auth.check(cur)) { XP.toast('La contraseña actual no es correcta', 'error'); return; }
        if (nw.length < 4) { XP.toast('La nueva contraseña debe tener al menos 4 caracteres', 'error'); return; }
        if (nw !== cf) { XP.toast('Las contraseñas no coinciden', 'error'); return; }
        await XP.auth.setPassword(nw);
        XP.toast('Contraseña actualizada', 'success');
        content.querySelector('#pwd-current').value = '';
        content.querySelector('#pwd-new').value = '';
        content.querySelector('#pwd-confirm').value = '';
        render();
      });

      content.querySelector('#acc-lock').addEventListener('change', function (e) {
        save({ lockTimeout: Number(e.target.value) }, 'Bloqueo automático actualizado');
      });
      content.querySelector('#acc-close').addEventListener('click', function () { XP.wm.closeAll(); });
    }

    /* ------------------------------ Negocio ------------------------------ */
    function renderNegocio() {
      content.innerHTML =
        '<h3>Negocio</h3><p class="lead">Estos datos se usan en los tickets, reportes y en el escritorio.</p>' +
        '<div class="set-section"><h4>' + XP.icon('tag', 15) + ' Identidad</h4>' +
          '<div class="set-grid">' +
            '<div class="field field--full"><label class="field__label">Nombre del negocio</label><input id="biz-name" type="text" value="' + U.esc(settings.businessName) + '"></div>' +
            '<div class="field"><label class="field__label">Responsable</label><input id="biz-owner" type="text" value="' + U.esc(settings.ownerName || '') + '"></div>' +
            '<div class="field"><label class="field__label">Moneda</label><input id="biz-currency" type="text" value="' + U.esc(settings.currency) + '" placeholder="CUP, USD, MXN…"></div>' +
            '<div class="field"><label class="field__label">Símbolo</label><input id="biz-symbol" type="text" value="' + U.esc(settings.currencySymbol) + '" maxlength="4"></div>' +
            '<div class="field"><label class="field__label">Margen por defecto (%)</label><input id="biz-margin" type="number" min="0" max="95" step="1" value="' + settings.defaultMargin + '"></div>' +
            '<div class="field"><label class="field__label">Stock mínimo por defecto</label><input id="biz-minstock" type="number" min="0" step="1" value="' + settings.minStock + '"></div>' +
            '<div class="field"><label class="field__label">Meta de ventas mensual</label><input id="biz-goal" type="number" min="0" step="100" value="' + settings.monthlyGoal + '"></div>' +
          '</div>' +
          '<div class="set-actions"><button class="btn btn--primary btn--sm" id="biz-save">' + XP.icon('save', 13) + ' Guardar cambios</button></div>' +
        '</div>' +
        '<div class="set-section"><h4>' + XP.icon('info', 15) + ' Vista previa</h4>' +
          '<div class="storage-box" style="flex-direction:column;align-items:flex-start;gap:4px">' +
            '<strong style="font-size:calc(13px * var(--text-scale))">' + U.esc(settings.businessName) + '</strong>' +
            '<span>Moneda: ' + U.esc(settings.currency) + ' (' + U.esc(settings.currencySymbol) + ') · Margen sugerido: ' + settings.defaultMargin + '% · Meta: ' + F.money(settings.monthlyGoal) + '</span>' +
            '<span>Ticket de ejemplo: ' + F.money(1250) + ' · Ganancia estimada al ' + settings.defaultMargin + '%: ' + F.money(1250 * settings.defaultMargin / 100) + '</span>' +
          '</div></div>' +
        '<div class="set-section"><h4>' + XP.icon('percent', 15) + ' Ayuda con los porcentajes</h4>' +
          '<p class="muted" style="font-size:calc(11.5px * var(--text-scale));line-height:1.6">El margen se calcula sobre el precio de venta: <code>margen = (precio − costo) / precio × 100</code>. Si un producto cuesta 100 y quieres un margen del 35 %, el precio debe ser <strong>154</strong> (100 / (1 − 0,35)), no 135.</p></div>';

      content.querySelector('#biz-save').addEventListener('click', function () {
        var name = content.querySelector('#biz-name').value.trim();
        if (!name) { XP.toast('El nombre del negocio es obligatorio', 'error'); return; }
        save({
          businessName: name,
          ownerName: content.querySelector('#biz-owner').value.trim(),
          currency: content.querySelector('#biz-currency').value.trim() || 'CUP',
          currencySymbol: content.querySelector('#biz-symbol').value.trim() || '$',
          defaultMargin: U.clamp(Number(content.querySelector('#biz-margin').value) || 0, 0, 95),
          minStock: Math.max(0, Number(content.querySelector('#biz-minstock').value) || 0),
          monthlyGoal: Math.max(0, Number(content.querySelector('#biz-goal').value) || 0)
        }, 'Datos del negocio guardados');
        render();
      });
    }

    /* ------------------------------ Apariencia ------------------------------ */
    function renderApariencia() {
      var themes = [
        { id: 'bliss', label: 'Bliss clásico', img: 'assets/img/wallpaper-bliss.svg' },
        { id: 'sunset', label: 'Atardecer', img: 'assets/img/wallpaper-sunset.svg' },
        { id: 'night', label: 'Noche', img: 'assets/img/wallpaper-night.svg' }
      ];
      content.innerHTML =
        '<h3>Apariencia</h3><p class="lead">Personaliza el escritorio sin salir de la estética XP.</p>' +
        '<div class="set-section"><h4>' + XP.icon('eye', 15) + ' Fondo de pantalla</h4>' +
          '<div class="theme-picker">' + themes.map(function (t) {
            return '<button class="theme-swatch' + (settings.theme === t.id ? ' is-active' : '') + '" data-theme="' + t.id + '"><div style="background-image:url(' + t.img + ')"></div><span>' + t.label + '</span></button>';
          }).join('') + '</div></div>' +
        '<div class="set-section"><h4>' + XP.icon('settings', 15) + ' Efectos y comportamiento</h4>' +
          '<div class="set-row"><div class="set-row__main"><b>Animaciones</b><small>Transiciones de ventanas y menús</small></div>' +
            '<label class="switch"><input type="checkbox" id="set-anim"' + (settings.animations !== false ? ' checked' : '') + '><span></span></label></div>' +
          '<div class="set-row"><div class="set-row__main"><b>Sonidos del sistema</b><small>Clics, apertura de ventanas y avisos</small></div>' +
            '<label class="switch"><input type="checkbox" id="set-sound"' + (settings.sounds !== false ? ' checked' : '') + '><span></span></label></div>' +
          '<div class="set-row"><div class="set-row__main"><b>Reloj de 24 horas</b><small>Cambia el formato de la hora</small></div>' +
            '<label class="switch"><input type="checkbox" id="set-clock24"' + (settings.clock24 ? ' checked' : '') + '><span></span></label></div>' +
          '<div class="set-row"><div class="set-row__main"><b>Mostrar widgets</b><small>Reloj, almacenamiento y estado en el escritorio</small></div>' +
            '<label class="switch"><input type="checkbox" id="set-widgets"' + (settings.showWidgets !== false ? ' checked' : '') + '><span></span></label></div>' +
        '</div>' +
        '<div class="set-section"><h4>' + XP.icon('info', 15) + ' Widget del clima</h4>' +
          '<div class="set-grid">' +
            '<div class="field"><label class="field__label">Temperatura (°)</label><input id="set-temp" type="number" min="-20" max="60" value="' + (settings.weatherTemp != null ? settings.weatherTemp : 24) + '"></div>' +
            '<div class="field"><label class="field__label">Texto</label><input id="set-weather" type="text" value="' + U.esc(settings.weatherText || '') + '" placeholder="Soleado, nublado…"></div>' +
            '<div class="field"><label class="field__label">Icono</label><select id="set-wicon">' +
              [['sun', 'Soleado'], ['cloud', 'Nublado'], ['rain', 'Lluvia']].map(function (o) {
                return '<option value="' + o[0] + '"' + (settings.weatherIcon === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
              }).join('') + '</select></div>' +
          '</div>' +
          '<div class="set-actions"><button class="btn btn--primary btn--sm" id="set-weather-save">' + XP.icon('save', 13) + ' Guardar clima</button></div>' +
        '</div>';

      content.querySelectorAll('[data-theme]').forEach(function (b) {
        b.addEventListener('click', function () {
          settings.theme = b.dataset.theme;
          content.querySelectorAll('[data-theme]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
          save({ theme: b.dataset.theme }, 'Fondo actualizado');
        });
      });
      content.querySelector('#set-anim').addEventListener('change', function (e) { save({ animations: e.target.checked }, e.target.checked ? 'Animaciones activadas' : 'Animaciones desactivadas'); });
      content.querySelector('#set-sound').addEventListener('change', function (e) { save({ sounds: e.target.checked }, e.target.checked ? 'Sonidos activados' : 'Sonidos desactivados'); });
      content.querySelector('#set-clock24').addEventListener('change', function (e) { save({ clock24: e.target.checked }, 'Formato de hora actualizado'); });
      content.querySelector('#set-widgets').addEventListener('change', function (e) { save({ showWidgets: e.target.checked }, 'Widgets actualizados'); });
      content.querySelector('#set-weather-save').addEventListener('click', function () {
        save({
          weatherTemp: Number(content.querySelector('#set-temp').value) || 0,
          weatherText: content.querySelector('#set-weather').value.trim(),
          weatherIcon: content.querySelector('#set-wicon').value
        }, 'Widget del clima actualizado');
      });
    }

    /* ------------------------------ Pantalla ------------------------------ */
    function renderPantalla() {
      var lim = XP.store.scaleLimits;
      var ui = Number(settings.uiScale) || 100;
      var tx = Number(settings.textScale) || 100;
      var presets = [80, 90, 100, 110, 125, 150];

      content.innerHTML =
        '<h3>Pantalla</h3><p class="lead">Ajusta la proporción en pantalla de todos los elementos y cómo se recuerdan las ventanas y los iconos.</p>' +
        '<div class="set-section"><h4>' + XP.icon('grid', 15) + ' Escala de la pantalla</h4>' +
          '<div class="set-slider">' +
            '<div class="set-slider__head"><b>Proporción de los elementos</b><span class="badge" id="ui-scale-val">' + ui + ' %</span></div>' +
            '<input type="range" id="ui-scale" min="' + lim.ui.min + '" max="' + lim.ui.max + '" step="5" value="' + ui + '" aria-label="Escala de la pantalla">' +
            '<small>Agranda o reduce todo a la vez: textos, iconos, ventanas, menús y barra de tareas. 100 % es el tamaño original.</small>' +
            '<div class="set-actions" id="ui-presets">' + presets.map(function (p) {
              return '<button class="btn btn--sm' + (p === ui ? ' btn--primary' : '') + '" data-scale="' + p + '">' + p + ' %</button>';
            }).join('') + '</div>' +
          '</div>' +
          '<div class="set-slider" style="margin-top:14px">' +
            '<div class="set-slider__head"><b>Tamaño del texto</b><span class="badge" id="text-scale-val">' + tx + ' %</span></div>' +
            '<input type="range" id="text-scale" min="' + lim.text.min + '" max="' + lim.text.max + '" step="5" value="' + tx + '" aria-label="Tamaño del texto">' +
            '<small>Cambia solo la letra sin tocar el tamaño de los demás elementos. Si necesitas todo más grande, usa la escala de la pantalla.</small>' +
          '</div>' +
          '<div class="set-actions">' +
            '<button class="btn btn--sm" id="scale-reset">' + XP.icon('restore', 13) + ' Restablecer al 100 %</button>' +
            '<span class="muted" style="font-size:10.5px;align-self:center">Atajo: <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>+</kbd> / <kbd>−</kbd></span>' +
          '</div>' +
        '</div>' +
        '<div class="set-section"><h4>' + XP.icon('copy', 15) + ' Ventanas</h4>' +
          '<div class="set-row"><div class="set-row__main"><b>Recordar tamaño y posición</b><small>Cada ventana se abre donde la dejaste, y maximizada si así la cerraste</small></div>' +
            '<label class="switch"><input type="checkbox" id="set-remember-win"' + (settings.rememberWindows !== false ? ' checked' : '') + '><span></span></label></div>' +
          '<div class="set-row"><div class="set-row__main"><b>Restablecer posiciones de ventanas</b><small>Olvida lo guardado y vuelve al tamaño por defecto</small></div>' +
            '<button class="btn btn--sm" id="set-reset-win">' + XP.icon('restore', 13) + ' Restablecer</button></div>' +
        '</div>' +
        '<div class="set-section"><h4>' + XP.icon('mipc', 15) + ' Iconos del escritorio</h4>' +
          '<div class="set-row"><div class="set-row__main"><b>Recordar posición de los iconos</b><small>Arrastra un icono con el ratón o el dedo y se queda donde lo sueltes</small></div>' +
            '<label class="switch"><input type="checkbox" id="set-remember-icons"' + (settings.rememberIcons !== false ? ' checked' : '') + '><span></span></label></div>' +
          '<div class="set-row"><div class="set-row__main"><b>Ajustar a la cuadrícula</b><small>El icono se alinea a la ranura más cercana al soltarlo</small></div>' +
            '<label class="switch"><input type="checkbox" id="set-icon-snap"' + (settings.iconSnap !== false ? ' checked' : '') + '><span></span></label></div>' +
          '<div class="set-row"><div class="set-row__main"><b>Alinear iconos ahora</b><small>Los reparte en columnas desde la esquina superior izquierda</small></div>' +
            '<button class="btn btn--sm" id="set-align-icons">' + XP.icon('grid', 13) + ' Alinear</button></div>' +
          '<p class="muted" style="font-size:10.5px;line-height:1.6;margin-top:8px">También puedes hacer clic derecho en el escritorio → <strong>Alinear iconos</strong>.</p>' +
        '</div>';

      var uiRange = content.querySelector('#ui-scale');
      var txRange = content.querySelector('#text-scale');
      var uiVal = content.querySelector('#ui-scale-val');
      var txVal = content.querySelector('#text-scale-val');

      function applyUi(v) {
        v = XP.store.setUiScale(v);
        settings.uiScale = v;
        uiVal.textContent = v + ' %';
        uiRange.value = v;
        content.querySelectorAll('#ui-presets [data-scale]').forEach(function (b) {
          b.classList.toggle('btn--primary', Number(b.dataset.scale) === v);
        });
        XP.desktop.applyScale();
      }
      function applyText(v) {
        v = XP.store.setTextScale(v);
        settings.textScale = v;
        txVal.textContent = v + ' %';
        txRange.value = v;
        XP.desktop.applyScale();
      }

      uiRange.addEventListener('input', function (e) { applyUi(Number(e.target.value)); });
      txRange.addEventListener('input', function (e) { applyText(Number(e.target.value)); });
      content.querySelectorAll('#ui-presets [data-scale]').forEach(function (b) {
        b.addEventListener('click', function () { applyUi(Number(b.dataset.scale)); });
      });
      content.querySelector('#scale-reset').addEventListener('click', function () {
        applyUi(100);
        applyText(100);
        XP.toast('Escala restablecida al 100 %', 'success');
      });

      content.querySelector('#set-remember-win').addEventListener('change', function (e) {
        save({ rememberWindows: e.target.checked }, e.target.checked ? 'Las ventanas recordarán su posición' : 'Las ventanas ya no recordarán su posición');
      });
      content.querySelector('#set-reset-win').addEventListener('click', function () {
        XP.wm.resetGeometry();
        XP.toast('Posiciones de ventanas restablecidas', 'success');
      });
      content.querySelector('#set-remember-icons').addEventListener('change', function (e) {
        settings.rememberIcons = e.target.checked;
        if (!e.target.checked) XP.store.resetIconPos();
        XP.store.save(true);
        XP.desktop.renderIcons();
        XP.toast(e.target.checked ? 'Se recordará la posición de los iconos' : 'Posiciones de iconos olvidadas', 'info');
      });
      content.querySelector('#set-icon-snap').addEventListener('change', function (e) {
        save({ iconSnap: e.target.checked }, e.target.checked ? 'Iconos ajustados a la cuadrícula' : 'Movimiento libre de iconos');
      });
      content.querySelector('#set-align-icons').addEventListener('click', function () {
        XP.desktop.alignIcons();
      });
    }

    /* ------------------------------ Datos ------------------------------ */
    function renderDatos() {
      var info = XP.store.storageInfo();
      var pct = Math.min(100, (info.bytes / info.total) * 100);
      var mode = settings.storage;
      content.innerHTML =
        '<h3>Datos y respaldos</h3><p class="lead">Toda la información es tuya. Guárdala en el navegador o en un archivo JSON del servidor.</p>' +
        '<div class="set-section"><h4>' + XP.icon('database', 15) + ' Almacenamiento</h4>' +
          '<div class="set-row"><div class="set-row__main"><b>Modo de guardado</b><small>' + (mode === 'server' ? 'Servidor PHP · data/app-data.json' : 'Navegador · localStorage') + '</small></div>' +
            '<select id="data-mode" style="max-width:220px;height:29px;min-height:0;font-size:calc(11.5px * var(--text-scale))">' +
              '<option value="local"' + (mode === 'local' ? ' selected' : '') + '>Navegador (localStorage)</option>' +
              '<option value="server"' + (mode === 'server' ? ' selected' : '') + '>Servidor PHP (archivo JSON)</option>' +
            '</select></div>' +
          '<div class="storage-box" style="margin-top:10px;flex-direction:column;align-items:stretch;gap:6px">' +
            '<div class="row row--between"><span><strong>' + info.kb + ' KB</strong> usados de 5 MB (' + pct.toFixed(1) + '%)</span>' +
            '<span class="badge ' + (XP.store.serverAvailable ? 'badge--green' : 'badge--grey') + '">' + (XP.store.serverAvailable ? 'Servidor disponible' : 'Servidor no detectado') + '</span></div>' +
            '<div class="meter" style="margin:0"><div class="meter__fill" style="width:' + Math.max(2, pct).toFixed(1) + '%"></div></div>' +
            '<span style="font-size:calc(10.5px * var(--text-scale))">' + (mode === 'server' ? 'Los cambios se envían al archivo JSON con cada guardado.' : 'Los datos viven en este navegador. Si borras los datos del sitio, se pierden: haz respaldos.') + '</span>' +
          '</div>' +
          '<div class="set-actions">' +
            '<button class="btn btn--sm" id="data-test">' + XP.icon('refresh', 13) + ' Probar servidor</button>' +
            '<button class="btn btn--sm" id="data-push"' + (mode === 'server' ? '' : ' disabled') + '>' + XP.icon('upload', 13) + ' Enviar al servidor</button>' +
            '<button class="btn btn--sm" id="data-backup"' + (mode === 'server' ? '' : ' disabled') + '>' + XP.icon('save', 13) + ' Crear copia en servidor</button>' +
          '</div>' +
        '</div>' +
        '<div class="set-section"><h4>' + XP.icon('download', 15) + ' Copias de seguridad</h4>' +
          '<div class="set-row"><div class="set-row__main"><b>Exportar todo</b><small>Descarga un archivo JSON con productos, operaciones y notas</small></div>' +
            '<button class="btn btn--primary btn--sm" id="data-export">' + XP.icon('download', 13) + ' Exportar JSON</button></div>' +
          '<div class="set-row"><div class="set-row__main"><b>Importar respaldo</b><small>Reemplaza los datos actuales por los del archivo</small></div>' +
            '<button class="btn btn--sm" id="data-import">' + XP.icon('upload', 13) + ' Importar JSON</button>' +
            '<input type="file" id="data-file" accept="application/json,.json" hidden></div>' +
          '<p class="muted" style="font-size:calc(10.5px * var(--text-scale));margin-top:6px">Última copia: ' + (settings.lastBackup ? F.dateTime(settings.lastBackup) : 'nunca') + '</p>' +
        '</div>' +
        '<div class="set-section"><h4>' + XP.icon('star', 15) + ' Datos de demostración</h4>' +
          '<p class="muted" style="font-size:calc(11.5px * var(--text-scale));line-height:1.55;margin-bottom:8px">' + (settings.demoData ? 'La base incluye ventas y productos de ejemplo para que veas cómo funciona todo.' : 'Los datos de demostración ya fueron eliminados.') + '</p>' +
          '<button class="btn btn--sm" id="data-demo"' + (settings.demoData ? '' : ' disabled') + '>' + XP.icon('trash', 13) + ' Borrar datos de demostración</button>' +
        '</div>' +
        '<div class="set-section" style="border-color:#f0c4bf"><h4 style="color:var(--red-600)">' + XP.icon('alert', 15) + ' Zona de riesgo</h4>' +
          '<div class="set-row"><div class="set-row__main"><b>Restablecer todo</b><small>Borra todos los datos y vuelve a admin / admin</small></div>' +
            '<button class="btn btn--danger btn--sm" id="data-reset">Restablecer…</button></div>' +
        '</div>';

      content.querySelector('#data-mode').addEventListener('change', async function (e) {
        var next = e.target.value;
        if (next === 'server') {
          try {
            await XP.store.testServer();
            settings.storage = 'server';
            await XP.store.pushServer();
            save({ storage: 'server' }, 'Modo servidor activado');
            render(); /* habilita "Enviar al servidor" y "Crear copia" */
          } catch (err) {
            XP.toast('No se pudo conectar con api.php. Verifica que el sitio se sirva con PHP.', 'error', { duration: 5200 });
            e.target.value = 'local';
            settings.storage = 'local';
            XP.store.save(true);
            render();
          }
        } else {
          save({ storage: 'local' }, 'Modo navegador activado');
          render();
        }
      });
      content.querySelector('#data-test').addEventListener('click', async function () {
        try {
          var r = await XP.store.testServer();
          XP.toast('Servidor disponible · ' + (r.version || 'OK'), 'success');
        } catch (e) {
          XP.toast('Servidor no disponible. Sirve la carpeta con PHP para usar archivos JSON.', 'error', { duration: 5200 });
        }
        render();
      });
      content.querySelector('#data-push').addEventListener('click', async function () {
        try { await XP.store.pushServer(); XP.toast('Datos enviados al servidor', 'success'); }
        catch (e) { XP.toast('No se pudo guardar en el servidor', 'error'); }
      });
      content.querySelector('#data-backup').addEventListener('click', async function () {
        try {
          await XP.store.backupServer();
          settings.lastBackup = new Date().toISOString();
          XP.store.save(true);
          XP.toast('Copia creada en data/backups', 'success');
          render();
        } catch (e) { XP.toast('No se pudo crear la copia en el servidor', 'error'); }
      });
      content.querySelector('#data-export').addEventListener('click', function () {
        var name = 'xp-negocio-respaldo-' + U.dateKey(new Date()) + '.json';
        UI.download(name, XP.store.exportJSON(), 'application/json');
        settings.lastBackup = new Date().toISOString();
        XP.store.save(true);
        XP.toast('Respaldo descargado', 'success');
        render();
      });
      content.querySelector('#data-import').addEventListener('click', function () { content.querySelector('#data-file').click(); });
      content.querySelector('#data-file').addEventListener('change', function (e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = async function () {
          var ok = await UI.confirm({ title: 'Importar respaldo', message: 'Se reemplazarán los datos actuales por los del archivo. ¿Continuar?', confirmText: 'Importar', danger: true });
          if (!ok) return;
          try {
            XP.store.importJSON(String(reader.result));
            XP.toast('Respaldo importado correctamente', 'success');
            setTimeout(function () { location.reload(); }, 900);
          } catch (err) {
            XP.toast(err.message || 'Archivo inválido', 'error');
          }
        };
        reader.readAsText(file);
        e.target.value = '';
      });
      content.querySelector('#data-demo').addEventListener('click', async function () {
        var ok = await UI.confirm({ title: 'Borrar demostración', message: 'Se eliminarán las ventas y productos marcados como demostración. Tus propios registros se conservan.', confirmText: 'Borrar', danger: true });
        if (!ok) return;
        XP.store.clearDemo();
        XP.toast('Datos de demostración eliminados', 'success');
        render();
      });
      content.querySelector('#data-reset').addEventListener('click', function () {
        UI.formDialog({
          title: 'Restablecer el sistema', subtitle: 'Esta acción no se puede deshacer', icon: 'alert', submitText: 'Restablecer todo',
          fields: [
            { name: 'confirm', label: 'Escribe BORRAR para confirmar', value: '', required: true, full: true, placeholder: 'BORRAR' }
          ],
          onSubmit: async function (v) {
            if (v.confirm.trim().toUpperCase() !== 'BORRAR') throw new Error('Escribe exactamente BORRAR para continuar.');
            await XP.store.resetAll();
            XP.toast('Sistema restablecido', 'success');
            setTimeout(function () { location.reload(); }, 900);
          }
        });
      });
    }

    /* ------------------------------ Acerca de ------------------------------ */
    function renderAcerca() {
      var counts = {
        products: XP.store.products.filter(function (p) { return !p.deletedAt; }).length,
        ops: XP.store.activeOperations().length,
        notes: XP.store.notes.filter(function (n) { return !n.deletedAt; }).length
      };
      content.innerHTML =
        '<h3>Acerca de XP Negocio 2026</h3><p class="lead">Un escritorio clásico con la gestión completa de tu negocio dentro.</p>' +
        '<div class="set-section"><div class="row" style="gap:14px;align-items:flex-start">' +
          '<div style="width:64px;height:64px;border-radius:14px;background:linear-gradient(160deg,#6cb4ff,#0a4a9e);display:grid;place-items:center;box-shadow:0 8px 20px rgba(10,60,140,.3)">' +
            '<svg viewBox="0 0 64 64" width="44" height="44"><use href="#flag-xp"/></svg></div>' +
          '<div><strong style="font-size:calc(16px * var(--text-scale))">XP Negocio 2026</strong><br><span class="muted" style="font-size:calc(11.5px * var(--text-scale))">Versión ' + (XP.version || '1.2.0') + ' · Edición personal</span>' +
          '<p class="muted" style="font-size:calc(11px * var(--text-scale));margin-top:6px;line-height:1.55">Sistema de ventas, inventario, inversiones y contabilidad con interfaz Windows XP modernizada. Funciona sin conexión y guarda todo en tu equipo.</p></div>' +
        '</div></div>' +
        '<div class="set-section"><h4>' + XP.icon('info', 15) + ' Estado de los datos</h4>' +
          '<table class="summary-table">' +
            '<tr><td>Productos activos</td><td>' + counts.products + '</td></tr>' +
            '<tr><td>Operaciones registradas</td><td>' + counts.ops + '</td></tr>' +
            '<tr><td>Notas guardadas</td><td>' + counts.notes + '</td></tr>' +
            '<tr><td>Modo de guardado</td><td>' + (settings.storage === 'server' ? 'Servidor PHP' : 'Navegador') + '</td></tr>' +
            '<tr><td>Último guardado</td><td>' + (XP.store.state.meta.lastSavedAt ? F.dateTime(XP.store.state.meta.lastSavedAt) : '—') + '</td></tr>' +
          '</table></div>' +
        '<div class="set-section"><h4>' + XP.icon('help', 15) + ' Atajos de teclado</h4>' +
          '<p style="font-size:calc(12px * var(--text-scale));line-height:1.9"><kbd>Ctrl</kbd> + <kbd>K</kbd> Buscar en XP &nbsp;·&nbsp; <kbd>Ctrl</kbd> + <kbd>L</kbd> Bloquear sesión &nbsp;·&nbsp; <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>+</kbd>/<kbd>−</kbd> Escala de la pantalla &nbsp;·&nbsp; <kbd>Esc</kbd> Cerrar menús</p>' +
          '<p style="font-size:calc(12px * var(--text-scale));line-height:1.9">Doble clic en un icono abre su ventana · Arrastra los iconos para colocarlos a tu gusto · Arrastra la barra de título para mover una ventana · Doble clic en la barra para maximizar.</p></div>' +
        '<div class="set-section"><h4>' + XP.icon('external', 15) + ' Código fuente</h4>' +
          '<p class="muted" style="font-size:calc(11.5px * var(--text-scale));margin-bottom:8px">El proyecto completo está publicado en GitHub. Puedes clonarlo, modificarlo y adaptarlo a tu negocio.</p>' +
          '<a class="btn btn--sm" href="https://github.com/ManuelAlmaguer/xp-negocio-2026" target="_blank" rel="noopener">' + XP.icon('external', 13) + ' Ver repositorio</a>' +
        '</div>';
    }

    render();
  }

  XP.wm.register({
    id: 'panel',
    title: 'Panel de control',
    desktopLabel: 'Panel de control',
    icon: 'panel',
    width: 900,
    height: 620,
    description: 'Cuenta, negocio, apariencia y datos',
    mount: mount
  });
})();
