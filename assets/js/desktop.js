/* ============================================================
   XP Negocio 2026 · Escritorio
   Arranque, inicio de sesión, iconos, widgets, menú Inicio
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util;
  var F = XP.fmt;
  var $ = function (s) { return document.querySelector(s); };

  var APP_ORDER = ['mipc', 'ventas', 'inventario', 'operaciones', 'inversiones', 'gastos', 'contabilidad', 'reportes', 'panel', 'papelera', 'notas', 'calculadora', 'buscar'];
  var QUICK = ['ventas', 'mipc', 'reportes', 'notas', 'panel'];
  var START_MAIN = ['mipc', 'ventas', 'inventario', 'reportes', 'contabilidad', 'panel', 'notas'];
  var booted = false;
  var clockTimer = null;
  var idleTimer = null;
  var expandedStart = false;

  /* ============================== ARRANQUE ============================== */
  async function boot() {
    try {
      await XP.store.init();
    } catch (e) {
      console.error(e);
      showFatal(e);
      return;
    }
    /* El tema, el movimiento y la escala dependen del estado ya cargado:
       aplicarlos antes de init() deja el arranque bloqueado. */
    applyTheme();
    applyMotion();
    applyScale();
    fillLoginIdentity();
    startLoginClock();

    setTimeout(function () {
      var bootScreen = $('#screen-boot');
      bootScreen.classList.add('is-out');
      setTimeout(function () { bootScreen.classList.add('is-hidden'); }, 450);
      if (XP.store.session.active()) {
        enterDesktop(true);
      } else {
        showLogin();
      }
    }, 950);
  }

  function showFatal(err) {
    var boot = $('#screen-boot');
    boot.innerHTML = '<div class="boot__inner"><h2 style="font-size:calc(18px * var(--text-scale));margin-bottom:8px">No se pudo iniciar</h2>' +
      '<p style="font-size:calc(12px * var(--text-scale));color:#9fc8ee;line-height:1.6">' + U.esc(err && err.message ? err.message : 'Error desconocido') + '</p>' +
      '<p style="margin-top:16px"><button class="btn btn--primary" onclick="location.reload()">Reintentar</button></p></div>';
  }

  /* ============================== LOGIN ============================== */
  function fillLoginIdentity() {
    var s = XP.store.settings;
    var a = XP.store.state.auth || { username: 'admin', displayName: 'Administrador' };
    $('#login-biz').textContent = s.businessName;
    $('#login-user-name').textContent = a.displayName || a.username;
    $('#login-user-label').textContent = a.username;
    $('#login-avatar').textContent = F.initials(a.displayName || a.username);
    $('#login-avatar-lg').textContent = F.initials(a.displayName || a.username);
    document.title = s.businessName + ' · XP Negocio 2026';
  }

  function startLoginClock() {
    function tick() {
      var el = $('#login-clock');
      if (el) el.textContent = F.dateLong(new Date()) + ' · ' + F.time(new Date());
    }
    tick();
    setInterval(tick, 1000);
  }

  function showLogin() {
    $('#screen-desktop').classList.add('is-hidden');
    var login = $('#screen-login');
    login.classList.remove('is-hidden');
    login.style.opacity = '1';
    fillLoginIdentity();
    var input = $('#login-pass');
    input.value = '';
    input.type = 'password';
    setTimeout(function () { input.focus(); }, 220);
  }

  function loginError(msg) {
    var el = $('#login-error');
    el.textContent = msg;
    el.classList.remove('is-shake');
    void el.offsetWidth;
    el.classList.add('is-shake');
    XP.ui.sounds.error();
  }

  function bindLogin() {
    var form = $('#login-form');
    var pass = $('#login-pass');
    var go = $('#login-submit');
    var attempts = 0;

    $('#login-reveal').addEventListener('click', function () {
      pass.type = pass.type === 'password' ? 'text' : 'password';
      pass.focus();
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      var value = pass.value;
      if (!value) { loginError('Escribe tu contraseña para continuar.'); pass.focus(); return; }
      go.disabled = true;
      go.textContent = 'Comprobando…';
      try {
        var ok = await XP.auth.login(XP.store.state.auth.username, value);
        if (!ok) {
          attempts++;
          loginError(attempts >= 3 ? 'Contraseña incorrecta. Pista: ' + (XP.store.state.auth.hint || 'admin') : 'Contraseña incorrecta. Inténtalo de nuevo.');
          pass.select();
          go.disabled = false;
          go.textContent = 'Iniciar sesión';
          return;
        }
        $('#login-error').textContent = '';
        XP.store.session.start($('#login-remember').checked);
        var login = $('#screen-login');
        login.style.transition = 'opacity .28s';
        login.style.opacity = '0';
        setTimeout(function () {
          login.classList.add('is-hidden');
          login.style.opacity = '';
          enterDesktop(false);
        }, 280);
      } catch (err) {
        loginError('No se pudo verificar la contraseña.');
        go.disabled = false;
        go.textContent = 'Iniciar sesión';
      }
    });

    $('#login-hint-link').addEventListener('click', function () {
      var a = XP.store.state.auth;
      XP.ui.openModal('<div class="dialog dialog--sm"><header class="dialog__head"><span class="dialog__ico">' + XP.icon('lock', 16) + '</span><h3>Pista de acceso</h3></header>' +
        '<div class="dialog__body"><p class="dialog__text">Usuario: <code>' + U.esc(a.username) + '</code><br>Pista de contraseña: <code>' + U.esc(a.hint || 'admin') + '</code></p>' +
        '<p class="dialog__text muted" style="margin-top:10px;font-size:calc(11px * var(--text-scale))">Puedes cambiar el usuario, la contraseña y la pista desde <strong>Panel de control → Cuenta</strong>.</p></div>' +
        '<footer class="dialog__foot"><button class="btn btn--primary" data-close>Cerrar</button></footer></div>', {
        onClose: function () { }
      }).el.querySelector('[data-close]').addEventListener('click', function (ev) { ev.target.closest('.modal-backdrop').remove(); });
    });

    $('#login-help').addEventListener('click', function () {
      XP.ui.openModal('<div class="dialog"><header class="dialog__head"><span class="dialog__ico">' + XP.icon('help', 16) + '</span><h3>Acceso al sistema</h3></header>' +
        '<div class="dialog__body"><p class="dialog__text">Esta es una instalación local de <strong>XP Negocio 2026</strong>. La cuenta inicial es:</p>' +
        '<p class="dialog__text" style="margin:10px 0"><code>admin</code> / <code>admin</code></p>' +
        '<p class="dialog__text">Los datos se guardan en este equipo (localStorage) o en un archivo JSON si usas el servidor PHP. No se envía nada a internet.</p></div>' +
        '<footer class="dialog__foot"><button class="btn btn--primary" data-close>Entendido</button></footer></div>').el
        .querySelector('[data-close]').addEventListener('click', function (ev) { ev.target.closest('.modal-backdrop').remove(); });
    });

    pass.addEventListener('input', function () { $('#login-error').textContent = ''; });
  }

  /* ============================== ESCRITORIO ============================== */
  function enterDesktop(fromSession) {
    var desk = $('#screen-desktop');
    desk.classList.remove('is-hidden');
    applyTheme();
    if (!booted) {
      booted = true;
      initDesktop();
    }
    refreshWidgets();
    if (!fromSession) {
      XP.ui.sounds.startup();
      XP.toast('Bienvenido de nuevo, ' + (XP.store.state.auth.displayName || XP.store.state.auth.username), 'success', { title: 'Sesión iniciada', duration: 3200 });
    }
    setTimeout(function () {
      if (XP.store.settings.showWelcome !== false && !fromSession) XP.wm.open('bienvenida');
      resetIdle();
    }, fromSession ? 10 : 700);
  }

  function initDesktop() {
    var s = XP.store.settings;
    document.title = s.businessName + ' · XP Negocio 2026';
    renderIcons();
    renderQuickLaunch();
    renderStartMenu();
    renderTray();
    bindTaskbar();
    bindSearch();
    bindDesktopContext();
    bindGlobalKeys();
    bindIdleLock();
    startClock();
    refreshWidgets();
    $('#start-biz').textContent = s.businessName;
    var account = XP.store.state.auth || { username: 'admin', displayName: 'Administrador' };
    $('#start-username').textContent = account.displayName || account.username;
    $('#start-avatar').textContent = F.initials(account.displayName || account.username);

    XP.store.on(function (evt) {
      if (evt === 'change' || evt === 'import' || evt === 'reset') {
        var st = XP.store.settings;
        document.title = st.businessName + ' · XP Negocio 2026';
        $('#start-biz').textContent = st.businessName;
        refreshWidgets();
        applyMotion();
      }
      if (evt === 'saved') refreshStorage();
    });
    window.addEventListener('resize', XP.ui.debounce(function () {
      refreshWidgets();
      if (XP.wm && XP.wm.clampAll) XP.wm.clampAll();
      renderIcons();
    }, 200));
  }

  /* ------------------------------ Iconos ------------------------------
     Cada icono es un elemento posicionado con translate3d. La posición vive en
     settings.iconPos (coordenadas locales del área de iconos) y se puede
     arrastrar con el ratón o el dedo; un toque simple abre en pantallas
táctiles. */
  var justDragged = false;

  function iconSlot() {
    var cs = getComputedStyle(document.documentElement);
    var w = parseFloat(cs.getPropertyValue('--icon-slot-w')) || 94;
    var h = parseFloat(cs.getPropertyValue('--icon-slot-h')) || 90;
    return { w: w, h: h };
  }

  function iconBounds() {
    var host = $('#desktop-icons');
    var slot = iconSlot();
    return { w: Math.max(slot.w, host.clientWidth), h: Math.max(slot.h, host.clientHeight) };
  }

  function clampIconPos(pos, bounds, slot) {
    return {
      x: Math.round(U.clamp(pos.x, 0, Math.max(0, bounds.w - slot.w + 2))),
      y: Math.round(U.clamp(pos.y, 0, Math.max(0, bounds.h - slot.h + 2)))
    };
  }

  function snapIconPos(pos, bounds, slot) {
    /* La cuadrícula se recorta al área visible: si no, el último ajuste caía en
       una fila que luego el clamp movía fuera de la cuadrícula. */
    var cols = Math.max(1, Math.floor((bounds.w + 2) / slot.w));
    var rows = Math.max(1, Math.floor((bounds.h + 2) / slot.h));
    var c = U.clamp(Math.round(pos.x / slot.w), 0, cols - 1);
    var r = U.clamp(Math.round(pos.y / slot.h), 0, rows - 1);
    return clampIconPos({ x: c * slot.w, y: r * slot.h }, bounds, slot);
  }

  function moveIcon(btn, pos) {
    btn.dataset.x = pos.x;
    btn.dataset.y = pos.y;
    btn.style.transform = 'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)';
  }

  function renderIcons() {
    var host = $('#desktop-icons');
    host.innerHTML = '';
    var slot = iconSlot();
    var bounds = iconBounds();
    var remember = XP.store.settings.rememberIcons !== false;
    var saved = (remember && XP.store.settings.iconPos) || {};
    var rows = Math.max(1, Math.floor(bounds.h / slot.h));
    var ids = APP_ORDER.filter(function (id) { return !!XP.wm.apps[id]; });

    /* Las ranuras ocupadas por iconos colocados a mano se reservan para que los
       demás se repartan sin quedar uno encima de otro. */
    var occupied = {};
    ids.forEach(function (id) {
      if (!saved[id]) return;
      occupied[Math.round(saved[id].x / slot.w) + ':' + Math.round(saved[id].y / slot.h)] = true;
    });
    var free = [];
    var cols = Math.ceil(ids.length / rows) + 2;
    for (var c = 0; c < cols; c++) {
      for (var r = 0; r < rows; r++) if (!occupied[c + ':' + r]) free.push({ c: c, r: r });
    }
    var fi = 0;

    ids.forEach(function (id, i) {
      var app = XP.wm.apps[id];
      var pos;
      if (saved[id]) {
        pos = clampIconPos({ x: saved[id].x, y: saved[id].y }, bounds, slot);
      } else {
        var f = free[fi++] || { c: Math.floor(i / rows), r: i % rows };
        pos = clampIconPos({ x: f.c * slot.w, y: f.r * slot.h }, bounds, slot);
      }

      var btn = document.createElement('button');
      btn.className = 'dicon';
      btn.type = 'button';
      btn.dataset.app = id;
      btn.setAttribute('role', 'listitem');
      btn.title = (app.description || app.title) + ' · arrastra para moverlo';
      btn.innerHTML = '<span class="dicon__ico">' + XP.icon(app.icon, 46) + '</span>' +
        '<span class="dicon__label">' + U.esc(app.desktopLabel || app.title) + '</span>';
      moveIcon(btn, pos);

      btn.addEventListener('click', function () {
        if (justDragged) return;
        host.querySelectorAll('.dicon').forEach(function (d) { d.classList.remove('is-selected'); });
        btn.classList.add('is-selected');
        /* En pantallas táctiles no existe el doble clic: un toque abre. */
        if (isTouch()) openApp(id);
      });
      btn.addEventListener('dblclick', function () {
        if (justDragged) return;
        openApp(id);
      });
      btn.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        e.stopPropagation();
        host.querySelectorAll('.dicon').forEach(function (d) { d.classList.remove('is-selected'); });
        btn.classList.add('is-selected');
        showContext(e.clientX, e.clientY, [
          { label: 'Abrir', icon: 'external', action: function () { openApp(id); } },
          { sep: true },
          { label: 'Alinear este icono', icon: 'grid', action: function () { alignIcon(id, btn); } },
          { label: 'Propiedades', icon: 'info', action: function () { openApp('panel', { section: 'pantalla' }); } }
        ]);
      });
      bindIconDrag(btn, id);
      host.appendChild(btn);
    });
  }

  /* Arrastrar un icono: se guarda la nueva posición al soltar. */
  function bindIconDrag(btn, appId) {
    var drag = null;

    btn.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      var z = XP.ui.zoom();
      drag = {
        pid: e.pointerId,
        sx: e.clientX / z, sy: e.clientY / z,
        bx: Number(btn.dataset.x) || 0, by: Number(btn.dataset.y) || 0,
        moved: false
      };
      try { btn.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    });

    btn.addEventListener('pointermove', function (e) {
      if (!drag || drag.pid !== e.pointerId) return;
      var z = XP.ui.zoom();
      var dx = e.clientX / z - drag.sx;
      var dy = e.clientY / z - drag.sy;
      if (!drag.moved && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      if (!drag.moved) {
        drag.moved = true;
        btn.classList.add('is-dragging');
        XP.ui.sounds.click();
      }
      var slot = iconSlot();
      moveIcon(btn, clampIconPos({ x: drag.bx + dx, y: drag.by + dy }, iconBounds(), slot));
    });

    function finish(e) {
      if (!drag || (e && drag.pid !== e.pointerId)) return;
      var moved = drag.moved;
      drag = null;
      btn.classList.remove('is-dragging');
      try { btn.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
      if (!moved) return;
      var slot = iconSlot();
      var bounds = iconBounds();
      var pos = { x: Number(btn.dataset.x) || 0, y: Number(btn.dataset.y) || 0 };
      if (XP.store.settings.iconSnap !== false) pos = snapIconPos(pos, bounds, slot);
      else pos = clampIconPos(pos, bounds, slot);
      moveIcon(btn, pos);
      if (XP.store.settings.rememberIcons !== false) XP.store.setIconPos(appId, pos);
      justDragged = true;
      setTimeout(function () { justDragged = false; }, 350);
    }
    btn.addEventListener('pointerup', finish);
    btn.addEventListener('pointercancel', finish);
  }

  /* Devuelve un icono a la primera ranura libre. */
  function alignIcon(appId, btn) {
    XP.store.resetIconPos(appId);
    renderIcons();
    XP.toast('Icono alineado', 'info', { duration: 1800 });
  }

  function alignAllIcons(silent) {
    XP.store.resetIconPos();
    renderIcons();
    if (!silent) XP.toast('Iconos alineados automáticamente', 'success');
  }

  function isTouch() {
    return window.matchMedia('(pointer: coarse)').matches;
  }

  function openApp(id, opts) {
    XP.ui.sounds.click();
    closeStart();
    return XP.wm.open(id, opts);
  }

  /* ------------------------------ Accesos rápidos ------------------------------ */
  function renderQuickLaunch() {
    var host = $('#quicklaunch');
    host.innerHTML = '';
    QUICK.forEach(function (id) {
      var app = XP.wm.apps[id];
      if (!app) return;
      var b = document.createElement('button');
      b.className = 'ql-btn';
      b.title = app.title;
      b.innerHTML = XP.icon(app.icon, 19);
      b.addEventListener('click', function () { openApp(id); });
      host.appendChild(b);
    });
  }

  /* ------------------------------ Menú Inicio ------------------------------ */
  function renderStartMenu() {
    var host = $('#start-apps');
    host.innerHTML = '';
    var ids = expandedStart ? APP_ORDER.filter(function (id) { return XP.wm.apps[id] && id !== 'buscar'; }) : START_MAIN;
    ids.forEach(function (id) {
      var app = XP.wm.apps[id];
      if (!app) return;
      var b = document.createElement('button');
      b.className = 'start-app';
      b.innerHTML = XP.icon(app.icon, 27) + '<span><b>' + U.esc(app.title) + '</b><small>' + U.esc(app.description || '') + '</small></span>';
      b.addEventListener('click', function () { openApp(id); });
      host.appendChild(b);
    });
    document.querySelectorAll('#start-menu .start-link').forEach(function (b) {
      b.onclick = function () { openApp(b.dataset.app); };
    });
    $('#start-all').firstChild.nodeValue = expandedStart ? 'Menos programas ' : 'Todos los programas ';
    $('#start-all').querySelector('span').textContent = expandedStart ? '▾' : '▸';
  }

  function toggleStart(force) {
    var menu = $('#start-menu');
    var btn = $('#start-btn');
    var open = force != null ? force : menu.classList.contains('is-hidden');
    if (open) {
      renderStartMenu();
      menu.classList.remove('is-hidden');
      btn.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    } else {
      menu.classList.add('is-hidden');
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  }
  function closeStart() { toggleStart(false); }

  function bindTaskbar() {
    $('#start-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      XP.ui.sounds.click();
      toggleStart();
    });
    $('#start-all').addEventListener('click', function (e) {
      e.stopPropagation();
      expandedStart = !expandedStart;
      renderStartMenu();
    });
    $('#start-menu').addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) closeStart();
      if (!e.target.closest('#ctx-menu')) hideContext();
    });
    $('#btn-lock').addEventListener('click', function () { lockSession('Sesión bloqueada'); });
    $('#btn-logout').addEventListener('click', function () { lockSession('Sesión cerrada'); });
    $('#btn-shutdown').addEventListener('click', shutdown);
    $('#show-desktop').addEventListener('click', function () { XP.wm.minimizeAll(); });
    $('#tray-clock').addEventListener('click', function () { openApp('reloj'); });
    $('#widget-clock').addEventListener('click', function () { openApp('reloj'); });
    $('#widget-status').addEventListener('click', function () { openApp('panel', { section: 'datos' }); });
    $('#tray-sound').addEventListener('click', function () {
      XP.store.settings.sounds = !XP.store.settings.sounds;
      XP.store.save();
      renderTray();
      XP.toast(XP.store.settings.sounds ? 'Sonidos activados' : 'Sonidos desactivados', 'info');
    });
    $('#tray-net').addEventListener('click', function () { openApp('panel', { section: 'datos' }); });
    $('#tray-shield').addEventListener('click', function () { openApp('ayuda'); });
    $('#login-remember').addEventListener('change', function () { });
  }

  function renderTray() {
    var s = XP.store.settings;
    $('#tray-sound').innerHTML = XP.icon(s.sounds ? 'sound' : 'mute', 15);
    $('#tray-sound').classList.toggle('is-off', !s.sounds);
    $('#tray-net').innerHTML = XP.icon('wifi', 15);
    $('#tray-shield').innerHTML = XP.icon('shield', 15);
    var mode = s.storage === 'server' ? 'Archivo JSON en servidor' : 'Datos en este navegador';
    $('#tray-net').title = mode;
    $('#tray-shield').title = 'Protección local activa';
  }

  /* ------------------------------ Buscador ------------------------------ */
  function bindSearch() {
    var input = $('#search-input');
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var q = input.value.trim();
        openApp('buscar', { query: q });
        input.value = '';
        input.blur();
      }
      if (e.key === 'Escape') input.blur();
    });
    input.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  /* ------------------------------ Menú contextual ------------------------------ */
  var ctxEl;
  function showContext(x, y, items) {
    ctxEl = ctxEl || $('#ctx-menu');
    ctxEl.innerHTML = items.map(function (it, i) {
      if (it.sep) return '<div class="ctx-sep"></div>';
      return '<button class="ctx-item' + (it.danger ? ' ctx-item--danger' : '') + '" data-i="' + i + '">' +
        '<span class="ctx-item__ico">' + XP.icon(it.icon || 'chevronRight', 14) + '</span>' + U.esc(it.label) + '</button>';
    }).join('');
    ctxEl.classList.remove('is-hidden');
    var w = 210, h = ctxEl.offsetHeight || items.length * 30;
    ctxEl.style.left = Math.min(x, window.innerWidth - w - 8) + 'px';
    ctxEl.style.top = Math.min(y, window.innerHeight - h - 8) + 'px';
    ctxEl.querySelectorAll('.ctx-item').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        hideContext();
        var it = items[Number(b.dataset.i)];
        if (it && it.action) it.action();
      });
    });
  }
  function hideContext() { if (ctxEl) ctxEl.classList.add('is-hidden'); }

  function bindDesktopContext() {
    var desk = $('#screen-desktop');
    desk.addEventListener('contextmenu', function (e) {
      if (e.target.closest('.win') || e.target.closest('.taskbar') || e.target.closest('.widgets') || e.target.closest('.desktop-search') || e.target.closest('.dicon')) return;
      e.preventDefault();
      showContext(e.clientX, e.clientY, [
        { label: 'Actualizar', icon: 'refresh', action: function () { refreshWidgets(); XP.toast('Escritorio actualizado', 'info'); } },
        { label: 'Nueva venta', icon: 'cart', action: function () { openApp('ventas'); } },
        { label: 'Nueva operación', icon: 'plus', action: function () { openApp('operaciones'); } },
        { sep: true },
        { label: 'Alinear iconos', icon: 'grid', action: function () { alignAllIcons(); } },
        {
          label: XP.store.settings.rememberIcons !== false ? 'Dejar de recordar iconos' : 'Recordar posiciones de iconos',
          icon: 'restore',
          action: function () {
            var on = XP.store.settings.rememberIcons === false;
            XP.store.settings.rememberIcons = on;
            if (!on) XP.store.resetIconPos();
            XP.store.save();
            renderIcons();
            XP.toast(on ? 'Se recordarán las posiciones de los iconos' : 'Posiciones de iconos olvidadas', 'info');
          }
        },
        { label: 'Pantalla y escala', icon: 'settings', action: function () { openApp('panel', { section: 'pantalla' }); } },
        { sep: true },
        { label: 'Panel de control', icon: 'settings', action: function () { openApp('panel'); } },
        { label: 'Ver widgets', icon: 'grid', action: function () { XP.store.settings.showWidgets = !XP.store.settings.showWidgets; XP.store.save(); refreshWidgets(); } },
        { sep: true },
        { label: 'Bloquear equipo', icon: 'lock', action: function () { lockSession('Sesión bloqueada'); } }
      ]);
    });
    desk.addEventListener('mousedown', function (e) {
      if (e.target.closest('.dicon') || e.target.closest('.win') || e.target.closest('.taskbar') || e.target.closest('.start-menu')) return;
      document.querySelectorAll('.dicon.is-selected').forEach(function (d) { d.classList.remove('is-selected'); });
    });
  }

  /* ------------------------------ Atajos ------------------------------ */
  function bindGlobalKeys() {
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        $('#search-input').focus();
        $('#search-input').select();
      }
      if (e.key === 'Escape') { closeStart(); hideContext(); }
      if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); lockSession('Sesión bloqueada'); }
      /* Ctrl + Alt + +/- cambia la escala de la pantalla; Ctrl + Alt + 0 la restablece. */
      if (e.ctrlKey && e.altKey && (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
        var cur = Number(XP.store.settings.uiScale) || 100;
        var next = e.key === '0' ? 100 : U.clamp(cur + (e.key === '-' ? -10 : 10), 80, 160);
        XP.store.setUiScale(next);
        applyScale();
        XP.toast('Escala de pantalla: ' + next + '%', 'info', { duration: 1600 });
      }
      if (e.key === 'Enter' && document.activeElement && document.activeElement.classList.contains('dicon')) {
        openApp(document.activeElement.dataset.app);
      }
    });
  }

  /* ------------------------------ Reloj y widgets ------------------------------ */
  function startClock() {
    clearInterval(clockTimer);
    tickClock();
    clockTimer = setInterval(tickClock, 1000);
  }

  function tickClock() {
    var now = new Date();
    var s = XP.store.settings;
    var time = F.time(now);
    var parts = time.split(' ');
    var dateLabel = XP.ranges.DAYS[now.getDay()].charAt(0).toUpperCase() + XP.ranges.DAYS[now.getDay()].slice(1) + ', ' + now.getDate() + ' de ' + XP.ranges.monthName(now.getMonth()) + ' de ' + now.getFullYear();
    var cd = $('#clock-date'); if (cd) cd.textContent = dateLabel;
    var ct = $('#clock-time'); if (ct) ct.textContent = s.clock24 ? time : parts[0];
    var ca = $('#clock-ampm'); if (ca) ca.textContent = s.clock24 ? '' : (parts[1] || '');
    var tt = $('#tray-time'); if (tt) tt.textContent = time;
    var td = $('#tray-date'); if (td) td.textContent = U.pad(now.getDate()) + '/' + U.pad(now.getMonth() + 1) + '/' + now.getFullYear();
  }

  function refreshWidgets() {
    var s = XP.store.settings;
    var host = $('#widgets');
    host.style.display = s.showWidgets === false ? 'none' : '';
    $('#weather-temp').textContent = (s.weatherTemp != null ? s.weatherTemp : 24) + '°';
    $('#weather-text').textContent = s.weatherText || 'Soleado';
    $('#weather-ico').textContent = s.weatherIcon === 'cloud' ? '☁' : s.weatherIcon === 'rain' ? '🌧' : '☀';
    refreshStorage();
  }

  function refreshStorage() {
    var info = XP.store.storageInfo();
    var pct = Math.min(100, Math.max(2, (info.bytes / info.total) * 100));
    $('#storage-fill').style.width = pct.toFixed(1) + '%';
    $('#storage-used').textContent = info.kb < 1024 ? info.kb + ' KB' : info.mb + ' MB';
    var mode = XP.store.settings.storage === 'server' ? 'Archivo JSON' : 'Navegador local';
    $('#storage-mode-label').textContent = mode;
    $('#status-detail').textContent = 'Datos guardados · ' + F.time(new Date());
    $('#status-text').textContent = 'Todo funciona correctamente';
  }

  /* ------------------------------ Sesión / apagado ------------------------------ */
  function lockSession(msg) {
    closeStart();
    XP.wm.closeAll();
    XP.store.session.end();
    XP.ui.sounds.shutdown();
    var desk = $('#screen-desktop');
    desk.style.transition = 'opacity .3s';
    desk.style.opacity = '0';
    setTimeout(function () {
      desk.classList.add('is-hidden');
      desk.style.opacity = '';
      desk.style.transition = '';
      showLogin();
      XP.toast(msg || 'Sesión bloqueada', 'info', { duration: 2600 });
    }, 300);
  }

  function shutdown() {
    closeStart();
    XP.wm.closeAll();
    XP.store.session.end();
    XP.ui.sounds.shutdown();
    var overlay = document.createElement('div');
    overlay.className = 'screen boot';
    overlay.style.zIndex = '80';
    overlay.style.transition = 'opacity .4s';
    overlay.innerHTML = '<div class="boot__inner"><div class="boot__logo" style="justify-content:center">' +
      '<svg viewBox="0 0 64 64" class="boot__flag"><use href="#flag-xp"/></svg></div>' +
      '<p style="font-size:calc(14px * var(--text-scale));color:#cfe6ff;margin-bottom:14px">Apagando el equipo…</p>' +
      '<div class="boot__bar"><div class="boot__bar-fill"></div></div></div>';
    document.body.appendChild(overlay);
    setTimeout(function () {
      overlay.style.opacity = '0';
      setTimeout(function () {
        overlay.remove();
        $('#screen-desktop').classList.add('is-hidden');
        showLogin();
      }, 420);
    }, 1500);
  }

  /* ------------------------------ Bloqueo por inactividad ------------------------------ */
  function resetIdle() {
    clearTimeout(idleTimer);
    var min = Number(XP.store.settings.lockTimeout) || 0;
    if (min > 0) idleTimer = setTimeout(function () { lockSession('Sesión bloqueada por inactividad'); }, min * 60000);
  }
  function bindIdleLock() {
    ['mousemove', 'keydown', 'pointerdown', 'wheel'].forEach(function (evt) {
      document.addEventListener(evt, function () { if (booted) resetIdle(); }, { passive: true });
    });
  }

  /* ------------------------------ Apariencia ------------------------------ */
  function applyTheme() {
    var s = XP.store.settings;
    var desk = $('#screen-desktop');
    if (desk) desk.dataset.theme = s.theme || 'bliss';
    var bg = s.theme === 'sunset' ? 'wallpaper-sunset.svg' : s.theme === 'night' ? 'wallpaper-night.svg' : 'wallpaper-bliss.svg';
    var loginBg = document.querySelector('.login__bg');
    if (loginBg) loginBg.style.backgroundImage = 'linear-gradient(180deg, rgba(4,40,92,.72), rgba(6,55,120,.58) 45%, rgba(3,28,62,.82)), url("assets/img/' + bg + '")';
  }

  function applyMotion() {
    document.body.classList.toggle('no-anim', XP.store.settings.animations === false);
  }

  /* Escala de pantalla: zoom del documento (todos los elementos) + escala de
     texto vía --text-scale. Se puede cambiar desde Panel de control → Pantalla. */
  function applyScale() {
    var s = XP.store.settings;
    var lim = XP.store.scaleLimits;
    var ui = U.clamp(Number(s.uiScale) || 100, lim.ui.min, lim.ui.max) / 100;
    var tx = U.clamp(Number(s.textScale) || 100, lim.text.min, lim.text.max) / 100;
    var root = document.documentElement;
    if (ui === 1) root.style.removeProperty('zoom');
    else root.style.setProperty('zoom', String(ui));
    root.style.setProperty('--text-scale', String(tx));
    if (XP.wm && XP.wm.clampAll) XP.wm.clampAll();
    if (booted) renderIcons();
  }

  /* ------------------------------ Init ------------------------------ */
  document.addEventListener('DOMContentLoaded', function () {
    bindLogin();
    boot();
  });

  XP.desktop = {
    openApp: openApp,
    lock: lockSession,
    refresh: refreshWidgets,
    renderIcons: renderIcons,
    showContext: showContext,
    applyTheme: applyTheme,
    applyMotion: applyMotion,
    applyScale: applyScale,
    alignIcons: alignAllIcons
  };
})();
