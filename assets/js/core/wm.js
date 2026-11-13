/* ============================================================
   XP Negocio 2026 · Gestor de ventanas
   Arrastrar, redimensionar, minimizar, maximizar, foco y memoria
   de posición, tamaño y estado maximizado por aplicación.
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util;

  var windows = [];
  var zTop = 100;
  var layer = null;
  var taskHost = null;
  var cascade = 0;

  var MIN_W = 340, MIN_H = 240;
  var KEEP_VISIBLE = 140; // píxeles que siempre quedan a la vista al mover

  /* ------------------------------ Medidas ------------------------------
     El Panel de control puede escalar la interfaz (zoom del documento). Todo
     lo que viene de clientX/clientY está en píxeles de pantalla, así que hay
     que dividir por el zoom para volver a las coordenadas locales que usan
     left/top/width/height. */
  function zoom() {
    var z = 1;
    try { z = parseFloat(getComputedStyle(document.documentElement).zoom); } catch (e) { z = 1; }
    return (!z || isNaN(z) || z <= 0) ? 1 : z;
  }

  function localPoint(e) {
    var z = zoom();
    return { x: e.clientX / z, y: e.clientY / z };
  }

  function desktopRect() {
    var d = document.getElementById('screen-desktop');
    var bar = document.querySelector('.taskbar');
    var barH = (bar && bar.offsetHeight) || 48;
    return { w: d.clientWidth, h: Math.max(220, d.clientHeight - barH) };
  }

  function isSmall() {
    var d = document.getElementById('screen-desktop');
    return (d ? d.clientWidth : window.innerWidth / zoom()) < 820;
  }

  /* ------------------------------ Memoria de geometría ------------------------------ */
  function savedGeometry(appId) {
    if (XP.store.settings.rememberWindows === false) return null;
    var map = XP.store.settings.windowState || {};
    var g = map[appId];
    if (!g || typeof g !== 'object') return null;
    if (!(Number(g.w) >= MIN_W && Number(g.h) >= MIN_H)) return null;
    return g;
  }

  function fitGeometry(g, rect) {
    var w = U.clamp(Number(g.w), MIN_W, Math.max(MIN_W, rect.w - 16));
    var h = U.clamp(Number(g.h), MIN_H, Math.max(MIN_H, rect.h - 16));
    var x = U.clamp(Number(g.x) || 0, -w + KEEP_VISIBLE, Math.max(0, rect.w - KEEP_VISIBLE));
    var y = U.clamp(Number(g.y) || 0, 0, Math.max(0, rect.h - 44));
    return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), max: !!g.max };
  }

  /* Guarda la geometría actual (o la previa a maximizar) de la ventana. */
  function storeGeometry(win) {
    if (!XP.store || !XP.store.state || !win) return;
    if (XP.store.settings.rememberWindows === false) return;
    var g;
    if (win.isMax) {
      var p = win.prevRect;
      if (!p) {
        var r = desktopRect();
        p = { left: Math.round(r.w * 0.07), top: Math.round(r.h * 0.06), width: Math.round(r.w * 0.72), height: Math.round(r.h * 0.8) };
      }
      g = { x: Math.round(p.left), y: Math.round(p.top), w: Math.round(p.width), h: Math.round(p.height), max: true };
    } else {
      var el = win.el;
      g = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight, max: false };
    }
    XP.store.setWindowState(win.appId, g);
  }

  var WM = {
    apps: {},

    register: function (app) {
      WM.apps[app.id] = app;
      return app;
    },

    open: function (appId, opts) {
      opts = opts || {};
      var app = WM.apps[appId];
      if (!app) { XP.toast('Aplicación no encontrada: ' + appId, 'error'); return null; }

      if (app.singleton !== false) {
        var existing = windows.find(function (w) { return w.appId === appId; });
        if (existing) {
          /* Reabrir con una intención concreta ("Nuevo gasto", una sección del
             panel…) vuelve a montar la app con esas opciones ya fusionadas. */
          if (opts.action || opts.section || opts.query != null) {
            existing.opts = Object.assign({}, existing.opts || {}, opts);
            existing.refresh();
          }
          if (opts.data && existing.onReopen) existing.onReopen(opts.data);
          WM.restore(existing);
          WM.focus(existing);
          return existing;
        }
      }

      layer = layer || document.getElementById('windows');
      taskHost = taskHost || document.getElementById('task-buttons');
      var rect = desktopRect();
      var small = isSmall();
      var saved = small ? null : savedGeometry(appId);
      if (saved) saved = fitGeometry(saved, rect);

      var width = saved ? saved.w : Math.min(opts.width || app.width || 920, rect.w - (small ? 8 : 40));
      var height = saved ? saved.h : Math.min(opts.height || app.height || 600, rect.h - (small ? 8 : 40));
      var maxed = small || (saved ? saved.max : !!opts.maximized);

      var left, top;
      if (saved) {
        left = saved.x;
        top = saved.y;
      } else {
        var offset = cascade % 7;
        cascade++;
        left = maxed ? 0 : Math.max(12, Math.min(rect.w - width - 12, 70 + offset * 28 + Math.floor(Math.random() * 20)));
        top = maxed ? 0 : Math.max(10, Math.min(rect.h - height - 10, 42 + offset * 24));
      }

      var id = U.uid('win');
      var el = document.createElement('section');
      el.className = 'win' + (maxed ? ' is-max' : '');
      el.dataset.winId = id;
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', app.title || appId);
      el.tabIndex = -1;

      el.style.width = width + 'px';
      el.style.height = height + 'px';
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.zIndex = ++zTop;

      el.innerHTML =
        '<header class="win__title">' +
          '<span class="win__ico">' + XP.icon(app.icon || 'mipc', 20) + '</span>' +
          '<div class="win__titles"><h2 class="win__name">' + U.esc(app.title || appId) + '</h2>' +
            '<p class="win__sub" hidden></p></div>' +
          '<div class="win__controls">' +
            '<button class="win__btn win__btn--min" title="Minimizar" aria-label="Minimizar">' + XP.icon('minus', 14) + '</button>' +
            '<button class="win__btn win__btn--max" title="' + (maxed ? 'Restaurar' : 'Maximizar') + '" aria-label="Maximizar">' + XP.icon(maxed ? 'copy' : 'grid', 12) + '</button>' +
            '<button class="win__btn win__btn--close" title="Cerrar" aria-label="Cerrar">' + XP.icon('close', 14) + '</button>' +
          '</div>' +
        '</header>' +
        '<div class="win__body"><div class="win__content"></div></div>' +
        '<div class="win__resize win__resize--r"></div><div class="win__resize win__resize--b"></div><div class="win__resize win__resize--br"></div>';

      layer.appendChild(el);

      var win = {
        id: id,
        appId: appId,
        app: app,
        el: el,
        body: el.querySelector('.win__body'),
        content: el.querySelector('.win__content'),
        titleEl: el.querySelector('.win__name'),
        subEl: el.querySelector('.win__sub'),
        isMax: maxed,
        minimized: false,
        /* Restaurar tras maximizar vuelve exactamente a donde estaba. */
        prevRect: (maxed && saved) ? { left: saved.x, top: saved.y, width: saved.w, height: saved.h } : null,
        live: false,
        opts: opts,
        setTitle: function (t) { win.titleEl.textContent = t; syncTask(); },
        setSubtitle: function (t) {
          if (!t) { win.subEl.hidden = true; win.subEl.textContent = ''; }
          else { win.subEl.hidden = false; win.subEl.textContent = t; }
        },
        focus: function () { WM.focus(win); },
        close: function () { WM.close(win); },
        minimize: function () { WM.minimize(win); },
        toggleMax: function () { WM.toggleMax(win); },
        refresh: function () { if (app.mount) { win.content.innerHTML = ''; app.mount(win, win.opts || opts); } }
      };

      // barra de tareas
      var btn = document.createElement('button');
      btn.className = 'task-btn is-active';
      btn.innerHTML = '<span class="task-btn__ico">' + XP.icon(app.icon || 'mipc', 16) + '</span><span class="task-btn__label">' + U.esc(app.title || appId) + '</span>';
      btn.addEventListener('click', function () {
        XP.ui.sounds.click();
        if (win.minimized) { WM.restore(win); WM.focus(win); }
        else if (win.el.classList.contains('is-focused')) WM.minimize(win);
        else WM.focus(win);
      });
      taskHost.appendChild(btn);
      win.taskBtn = btn;

      function syncTask() {
        btn.querySelector('.task-btn__label').textContent = win.titleEl.textContent;
      }
      win.syncTask = syncTask;

      // eventos
      el.addEventListener('mousedown', function () { WM.focus(win); }, true);
      el.querySelector('.win__btn--close').addEventListener('click', function (e) { e.stopPropagation(); WM.close(win); });
      el.querySelector('.win__btn--min').addEventListener('click', function (e) { e.stopPropagation(); WM.minimize(win); });
      el.querySelector('.win__btn--max').addEventListener('click', function (e) { e.stopPropagation(); WM.toggleMax(win); });
      el.querySelector('.win__title').addEventListener('dblclick', function (e) {
        if (e.target.closest('.win__controls')) return;
        WM.toggleMax(win);
      });

      makeDraggable(win);
      makeResizable(win);

      windows.push(win);
      WM.focus(win);

      requestAnimationFrame(function () {
        el.classList.add('is-open');
        XP.ui.sounds.open();
      });

      try {
        if (app.mount) app.mount(win, opts);
      } catch (err) {
        console.error(err);
        win.content.innerHTML = XP.ui.empty('alert', 'No se pudo abrir la aplicación', err.message);
      }
      return win;
    },

    focus: function (win) {
      if (!win || win.minimized) return;
      windows.forEach(function (w) {
        w.el.classList.toggle('is-focused', w === win);
        w.taskBtn.classList.toggle('is-active', w === win);
      });
      win.el.style.zIndex = ++zTop;
    },

    minimize: function (win) {
      if (win.minimized) return;
      win.minimized = true;
      win.el.classList.add('is-minimizing');
      win.taskBtn.classList.remove('is-active');
      XP.ui.sounds.close();
      setTimeout(function () {
        if (win.minimized) win.el.style.display = 'none';
      }, 200);
      var next = windows.filter(function (w) { return w !== win && !w.minimized; }).pop();
      if (next) WM.focus(next);
    },

    restore: function (win) {
      if (!win.minimized) return;
      win.minimized = false;
      win.el.style.display = '';
      requestAnimationFrame(function () { win.el.classList.remove('is-minimizing'); });
      win.taskBtn.classList.add('is-active');
      XP.ui.sounds.open();
    },

    toggleMax: function (win) {
      var el = win.el;
      var rect = desktopRect();
      if (win.isMax) {
        el.classList.remove('is-max');
        var p = win.prevRect || { left: 40, top: 30, width: Math.round(rect.w * 0.75), height: Math.round(rect.h * 0.85) };
        var width = U.clamp(p.width, MIN_W, Math.max(MIN_W, rect.w - 16));
        var height = U.clamp(p.height, MIN_H, Math.max(MIN_H, rect.h - 16));
        var left = U.clamp(p.left, -width + KEEP_VISIBLE, Math.max(0, rect.w - KEEP_VISIBLE));
        var top = U.clamp(p.top, 0, Math.max(0, rect.h - 44));
        el.style.left = left + 'px';
        el.style.top = top + 'px';
        el.style.width = width + 'px';
        el.style.height = height + 'px';
        win.isMax = false;
        el.querySelector('.win__btn--max').title = 'Maximizar';
      } else {
        win.prevRect = { left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight };
        el.classList.add('is-max');
        win.isMax = true;
        el.querySelector('.win__btn--max').title = 'Restaurar';
      }
      el.querySelector('.win__btn--max').innerHTML = XP.icon(win.isMax ? 'copy' : 'grid', 12);
      storeGeometry(win);
      WM.focus(win);
    },

    close: function (win) {
      if (!win) return;
      storeGeometry(win);
      win.el.classList.remove('is-open');
      win.el.classList.add('is-closing');
      XP.ui.sounds.close();
      setTimeout(function () {
        if (win.cleanup) try { win.cleanup(); } catch (e) { /* noop */ }
        win.el.remove();
        if (win.taskBtn) win.taskBtn.remove();
        windows = windows.filter(function (w) { return w !== win; });
      }, 190);
      if (win.onClose) try { win.onClose(); } catch (e) { /* noop */ }
      var next = windows.filter(function (w) { return w !== win && !w.minimized; }).pop();
      if (next) WM.focus(next);
    },

    closeAll: function () { windows.slice().forEach(WM.close); },
    minimizeAll: function () { windows.slice().forEach(function (w) { if (!w.minimized) WM.minimize(w); }); },
    list: function () { return windows.slice(); },

    refresh: function (win) { if (win) win.refresh(); },

    /* Devuelve las ventanas abiertas al área visible tras cambiar el tamaño
       del navegador o la escala de pantalla. */
    clampAll: function () {
      var rect = desktopRect();
      windows.forEach(function (w) {
        if (w.isMax) return;
        var el = w.el;
        var width = Math.min(Math.max(el.offsetWidth, MIN_W), Math.max(MIN_W, rect.w - 8));
        var height = Math.min(Math.max(el.offsetHeight, MIN_H), Math.max(MIN_H, rect.h - 8));
        /* Primero encaja el tamaño y luego mete la ventana dentro del área
           visible: al subir la escala de pantalla las ventanas quedaban
           cortadas por el borde derecho. */
        var left = el.offsetLeft;
        var top = el.offsetTop;
        if (left + width > rect.w) left = Math.max(0, rect.w - width);
        if (top + height > rect.h) top = Math.max(0, rect.h - height);
        left = U.clamp(left, -width + KEEP_VISIBLE, Math.max(0, rect.w - KEEP_VISIBLE));
        top = U.clamp(top, 0, Math.max(0, rect.h - 44));
        el.style.width = width + 'px';
        el.style.height = height + 'px';
        el.style.left = left + 'px';
        el.style.top = top + 'px';
      });
    },

    /* Olvida la geometría guardada y recoloca las ventanas abiertas. */
    resetGeometry: function () {
      XP.store.resetWindowState();
      var rect = desktopRect();
      windows.forEach(function (w, i) {
        var app = w.app || {};
        var width = Math.min(app.width || 920, rect.w - 40);
        var height = Math.min(app.height || 600, rect.h - 40);
        var off = i % 7;
        w.prevRect = null;
        if (!w.isMax) {
          w.el.style.width = width + 'px';
          w.el.style.height = height + 'px';
          w.el.style.left = Math.max(12, Math.min(rect.w - width - 12, 70 + off * 28)) + 'px';
          w.el.style.top = Math.max(10, Math.min(rect.h - height - 10, 42 + off * 24)) + 'px';
        }
      });
    }
  };

  /* ------------------------------ Arrastrar ------------------------------ */
  function makeDraggable(win) {
    var el = win.el;
    var bar = el.querySelector('.win__title');
    var drag = null;

    bar.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('.win__controls')) return;
      if (win.isMax) return;
      var p = localPoint(e);
      drag = { dx: p.x - el.offsetLeft, dy: p.y - el.offsetTop, id: e.pointerId };
      try { bar.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
      el.classList.add('is-dragging');
      e.preventDefault();
    });

    bar.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var p = localPoint(e);
      var rect = desktopRect();
      var left = U.clamp(p.x - drag.dx, -el.offsetWidth + KEEP_VISIBLE, rect.w - KEEP_VISIBLE);
      var top = U.clamp(p.y - drag.dy, 0, rect.h - 40);
      el.style.left = Math.round(left) + 'px';
      el.style.top = Math.round(top) + 'px';
    });

    function end(e) {
      if (!drag) return;
      drag = null;
      el.classList.remove('is-dragging');
      try { bar.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
      storeGeometry(win);
    }
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  }

  /* ------------------------------ Redimensionar ------------------------------ */
  function makeResizable(win) {
    var el = win.el;
    var state = null;
    el.querySelectorAll('.win__resize').forEach(function (h) {
      h.addEventListener('pointerdown', function (e) {
        if (win.isMax) return;
        e.preventDefault();
        var p = localPoint(e);
        state = {
          x: p.x, y: p.y,
          w: el.offsetWidth, h: el.offsetHeight,
          dir: h.classList.contains('win__resize--r') ? 'r' : h.classList.contains('win__resize--b') ? 'b' : 'br'
        };
        try { h.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
        el.classList.add('is-resizing');
      });
      h.addEventListener('pointermove', function (e) {
        if (!state) return;
        var p = localPoint(e);
        var rect = desktopRect();
        if (state.dir !== 'b') el.style.width = Math.round(U.clamp(state.w + (p.x - state.x), MIN_W, rect.w - el.offsetLeft)) + 'px';
        if (state.dir !== 'r') el.style.height = Math.round(U.clamp(state.h + (p.y - state.y), MIN_H, rect.h - el.offsetTop)) + 'px';
      });
      function end(e) {
        if (!state) return;
        state = null;
        el.classList.remove('is-resizing');
        try { h.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
        storeGeometry(win);
      }
      h.addEventListener('pointerup', end);
      h.addEventListener('pointercancel', end);
    });
  }

  // Actualizaciones en vivo para apps que lo pidan
  document.addEventListener('DOMContentLoaded', function () {
    if (!XP.store) return;
    var pending = null;
    XP.store.on(function (evt) {
      if (evt !== 'change' && evt !== 'import' && evt !== 'reset') return;
      clearTimeout(pending);
      pending = setTimeout(function () {
        windows.forEach(function (w) {
          if (!w.live || w.minimized) return;
          try { if (w.onChange) w.onChange(); } catch (e) { console.error(e); }
        });
      }, 180);
    });
  });

  XP.wm = WM;
})();
