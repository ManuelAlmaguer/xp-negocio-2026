/* ============================================================
   XP Negocio 2026 · Utilidades de interfaz
   Formato, avisos, diálogos, sonidos, exportaciones
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util;

  var nf = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
  var nf0 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 });
  var nf1 = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 });

  var Fmt = {
    money: function (n, opts) {
      var s = XP.store.settings;
      var v = Number(n) || 0;
      var symbol = (opts && opts.symbol) || s.currencySymbol || '$';
      var formatted = Math.abs(v % 1) > 0.004 ? nf.format(v) : nf0.format(v);
      var sign = v < 0 ? '-' : ((opts && opts.signed && v > 0) ? '+' : '');
      return sign + symbol + formatted;
    },
    moneyShort: function (n) {
      var v = Number(n) || 0;
      var s = XP.store.settings.currencySymbol || '$';
      var a = Math.abs(v);
      if (a >= 1e6) return s + nf1.format(v / 1e6) + 'M';
      if (a >= 1e3) return s + nf1.format(v / 1e3) + 'k';
      return s + nf0.format(v);
    },
    num: function (n) { return nf.format(Number(n) || 0); },
    int: function (n) { return nf0.format(Number(n) || 0); },
    pct: function (n, signed) {
      var v = Number(n) || 0;
      return (signed && v > 0 ? '+' : '') + nf1.format(v) + ' %';
    },
    date: function (d) {
      if (!d) return '—';
      var x = d instanceof Date ? d : U.parse(d);
      return U.pad(x.getDate()) + '/' + U.pad(x.getMonth() + 1) + '/' + x.getFullYear();
    },
    dateLong: function (d) {
      var x = d instanceof Date ? d : U.parse(d);
      return XP.ranges.DAYS[x.getDay()] + ', ' + x.getDate() + ' de ' + XP.ranges.months(x.getMonth()) + ' de ' + x.getFullYear();
    },
    time: function (d) {
      var x = d instanceof Date ? d : U.parse(d);
      var h = x.getHours(), m = U.pad(x.getMinutes());
      if (XP.store.settings.clock24) return U.pad(h) + ':' + m;
      var ap = h >= 12 ? 'PM' : 'AM';
      var hh = h % 12 || 12;
      return hh + ':' + m + ' ' + ap;
    },
    dateTime: function (d) { return Fmt.date(d) + ' · ' + Fmt.time(d); },
    ago: function (d) {
      var diff = (Date.now() - U.parse(d).getTime()) / 1000;
      if (diff < 60) return 'hace un momento';
      if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + ' min';
      if (diff < 86400) return 'hace ' + Math.floor(diff / 3600) + ' h';
      if (diff < 604800) return 'hace ' + Math.floor(diff / 86400) + ' d';
      return Fmt.date(d);
    },
    inputDate: function (d) {
      var x = d instanceof Date ? d : U.parse(d);
      return U.dateKey(x);
    },
    inputDateTime: function (d) {
      var x = d instanceof Date ? d : U.parse(d);
      return U.dateTimeLocal(x);
    },
    initials: function (name) {
      var s = String(name || '?').trim();
      var parts = s.split(/\s+/);
      return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    }
  };

  /* ------------------------------ Sonidos ------------------------------ */
  var audioCtx = null;
  function ctx() {
    if (!XP.store.settings.sounds) return null;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (e) { return null; }
  }
  function tone(freq, start, dur, type, gain) {
    var c = ctx();
    if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(gain || 0.035, c.currentTime + start + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.02);
  }
  var Sounds = {
    click: function () { tone(880, 0, 0.06, 'triangle', 0.02); },
    open: function () { tone(520, 0, 0.1, 'sine', 0.025); tone(780, 0.05, 0.12, 'sine', 0.02); },
    close: function () { tone(420, 0, 0.09, 'sine', 0.02); tone(280, 0.05, 0.1, 'sine', 0.015); },
    success: function () { tone(660, 0, 0.1, 'sine', 0.03); tone(880, 0.09, 0.14, 'sine', 0.03); },
    error: function () { tone(220, 0, 0.16, 'sawtooth', 0.02); tone(180, 0.12, 0.2, 'sawtooth', 0.018); },
    startup: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, i * 0.13, 0.5, 'sine', 0.03); });
    },
    shutdown: function () {
      [783.99, 659.25, 523.25, 392].forEach(function (f, i) { tone(f, i * 0.12, 0.4, 'sine', 0.025); });
    }
  };

  /* ------------------------------ Toasts ------------------------------ */
  var ICONS = { success: 'check', error: 'alert', info: 'info', warning: 'alert' };
  function toast(message, type, opts) {
    type = type || 'info';
    opts = opts || {};
    var host = document.getElementById('toasts');
    if (!host) return;
    var el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.innerHTML = '<span class="toast__ico">' + XP.icon(ICONS[type] || 'info', 16) + '</span>' +
      '<div class="toast__text"><strong>' + U.esc(opts.title || ({ success: 'Listo', error: 'Error', warning: 'Atención', info: 'Información' })[type]) + '</strong>' +
      '<span>' + U.esc(message) + '</span></div>' +
      '<button class="toast__x" aria-label="Cerrar">' + XP.icon('close', 14) + '</button>';
    host.appendChild(el);
    var timer = setTimeout(remove, opts.duration || 3600);
    function remove() {
      clearTimeout(timer);
      el.classList.add('is-out');
      setTimeout(function () { el.remove(); }, 220);
    }
    el.querySelector('.toast__x').addEventListener('click', remove);
    if (type === 'error') Sounds.error(); else if (type === 'success') Sounds.success();
    return el;
  }

  /* ------------------------------ Modal base ------------------------------ */
  function modalRoot() { return document.getElementById('modal-root'); }

  function openModal(html, opts) {
    opts = opts || {};
    var root = modalRoot();
    var wrap = document.createElement('div');
    wrap.className = 'modal-backdrop' + (opts.className ? ' ' + opts.className : '');
    wrap.innerHTML = html;
    root.appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add('is-in'); });
    var prevFocus = document.activeElement;
    function close(result) {
      wrap.classList.remove('is-in');
      wrap.classList.add('is-out');
      setTimeout(function () { wrap.remove(); }, 180);
      if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) { /* noop */ }
      if (opts.onClose) opts.onClose(result);
    }
    wrap.addEventListener('mousedown', function (e) {
      if (e.target === wrap && opts.dismissable !== false) close(null);
    });
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && opts.dismissable !== false) close(null);
    });
    setTimeout(function () {
      var f = wrap.querySelector('[data-autofocus]');
      if (f) f.focus();
    }, 60);
    return { el: wrap, close: close };
  }

  function confirmDialog(opts) {
    opts = opts || {};
    return new Promise(function (resolve) {
      /* resolve() debe ganar la carrera: close() dispara onClose, que resuelve false.
         Sin este candado, aceptar un diálogo devolvía siempre false. */
      var settled = false;
      function done(value) { if (settled) return; settled = true; resolve(value); }
      var m = openModal(
        '<div class="dialog dialog--sm" role="dialog" aria-modal="true">' +
          '<header class="dialog__head"><span class="dialog__ico dialog__ico--' + (opts.danger ? 'danger' : 'info') + '">' + XP.icon(opts.danger ? 'alert' : 'info', 18) + '</span>' +
            '<h3>' + U.esc(opts.title || 'Confirmar') + '</h3></header>' +
          '<div class="dialog__body"><p class="dialog__text">' + (opts.html || U.esc(opts.message || '')) + '</p></div>' +
          '<footer class="dialog__foot">' +
            '<button class="btn" data-act="cancel">' + U.esc(opts.cancelText || 'Cancelar') + '</button>' +
            '<button class="btn ' + (opts.danger ? 'btn--danger' : 'btn--primary') + '" data-act="ok" data-autofocus>' + U.esc(opts.confirmText || 'Aceptar') + '</button>' +
          '</footer>' +
        '</div>', { dismissable: true, onClose: function () { done(false); } });
      m.el.querySelector('[data-act="cancel"]').addEventListener('click', function () { done(false); m.close(); });
      m.el.querySelector('[data-act="ok"]').addEventListener('click', function () { done(true); m.close(); });
    });
  }

  /* ------------------------------ Diálogo de formulario ------------------------------ */
  function fieldHTML(f) {
    var id = 'f_' + Math.random().toString(36).slice(2, 8);
    var req = f.required ? ' required' : '';
    var cls = 'field' + (f.full ? ' field--full' : '') + (f.half ? ' field--half' : '');
    var label = '<label class="field__label" for="' + id + '">' + U.esc(f.label || '') + (f.required ? ' <em>*</em>' : '') + '</label>';
    var hint = f.hint ? '<small class="field__hint">' + U.esc(f.hint) + '</small>' : '';
    var input;
    if (f.type === 'select') {
      input = '<select id="' + id + '" name="' + f.name + '"' + req + '>' +
        (f.placeholder ? '<option value="">' + U.esc(f.placeholder) + '</option>' : '') +
        (f.options || []).map(function (o) {
          var val = typeof o === 'object' ? o.value : o;
          var lab = typeof o === 'object' ? o.label : o;
          return '<option value="' + U.esc(val) + '"' + (String(f.value) === String(val) ? ' selected' : '') + '>' + U.esc(lab) + '</option>';
        }).join('') + '</select>';
    } else if (f.type === 'textarea') {
      input = '<textarea id="' + id + '" name="' + f.name + '" rows="' + (f.rows || 3) + '"' + req + ' placeholder="' + U.esc(f.placeholder || '') + '">' + U.esc(f.value || '') + '</textarea>';
    } else if (f.type === 'checkbox') {
      input = '<label class="switch"><input type="checkbox" id="' + id + '" name="' + f.name + '"' + (f.value ? ' checked' : '') + '><span></span><b>' + U.esc(f.checkboxLabel || 'Activo') + '</b></label>';
    } else if (f.type === 'static') {
      return '<div class="' + cls + ' field--static"><span class="field__label">' + U.esc(f.label) + '</span><div class="field__static">' + (f.html || '') + '</div></div>';
    } else {
      var step = f.step != null ? ' step="' + f.step + '"' : '';
      var min = f.min != null ? ' min="' + f.min + '"' : '';
      var max = f.max != null ? ' max="' + f.max + '"' : '';
      var prefix = f.prefix ? '<span class="field__prefix">' + U.esc(f.prefix) + '</span>' : '';
      var suffix = f.suffix ? '<span class="field__suffix">' + U.esc(f.suffix) + '</span>' : '';
      input = '<div class="field__control' + (prefix ? ' has-prefix' : '') + (suffix ? ' has-suffix' : '') + '">' + prefix +
        '<input id="' + id + '" name="' + f.name + '" type="' + (f.type || 'text') + '" value="' + U.esc(f.value == null ? '' : f.value) + '"' +
        ' placeholder="' + U.esc(f.placeholder || '') + '"' + step + min + max + req + ' autocomplete="off">' + suffix + '</div>';
    }
    return '<div class="' + cls + '">' + label + input + hint + '</div>';
  }

  function formDialog(opts) {
    return new Promise(function (resolve) {
      var fields = opts.fields || [];
      var m = openModal(
        '<div class="dialog" role="dialog" aria-modal="true" style="max-width:' + (opts.width || 560) + 'px">' +
          '<header class="dialog__head">' +
            (opts.icon ? '<span class="dialog__ico">' + (XP.iconPaths[opts.icon] ? XP.icon(opts.icon, 20) : XP.icon(opts.icon, 16)) + '</span>' : '') +
            '<div class="dialog__titles"><h3>' + U.esc(opts.title || '') + '</h3>' + (opts.subtitle ? '<p>' + U.esc(opts.subtitle) + '</p>' : '') + '</div>' +
            '<button class="dialog__x" data-act="cancel" aria-label="Cerrar">' + XP.icon('close', 16) + '</button>' +
          '</header>' +
          '<form class="dialog__form" novalidate>' +
            '<div class="dialog__body"><div class="form-grid">' + fields.map(fieldHTML).join('') + '</div>' +
              '<p class="dialog__error" data-error></p></div>' +
            '<footer class="dialog__foot">' +
              '<button type="button" class="btn" data-act="cancel">' + U.esc(opts.cancelText || 'Cancelar') + '</button>' +
              '<button type="submit" class="btn btn--primary" data-act="ok">' + U.esc(opts.submitText || 'Guardar') + '</button>' +
            '</footer>' +
          '</form>' +
        '</div>', {
        dismissable: opts.dismissable !== false,
        onClose: function () { done(null); }
      });
      /* Igual que en confirm(): evita que close() resuelva null antes de los valores. */
      var settled = false;
      function done(value) { if (settled) return; settled = true; resolve(value); }

      var form = m.el.querySelector('form');
      var errEl = m.el.querySelector('[data-error]');
      var okBtn = m.el.querySelector('[data-act="ok"]');
      m.el.querySelectorAll('[data-act="cancel"]').forEach(function (b) { b.addEventListener('click', function () { m.close(); }); });

      function collect() {
        var out = {};
        fields.forEach(function (f) {
          if (f.type === 'static') return;
          var input = form.querySelector('[name="' + f.name + '"]');
          if (!input) return;
          if (f.type === 'checkbox') out[f.name] = input.checked;
          else if (f.type === 'number') out[f.name] = input.value === '' ? null : Number(input.value);
          else out[f.name] = input.value.trim();
        });
        return out;
      }

      form.addEventListener('submit', async function (e) {
        e.preventDefault();
        errEl.textContent = '';
        // validación nativa
        for (var i = 0; i < fields.length; i++) {
          var f = fields[i];
          if (!f.required) continue;
          var input = form.querySelector('[name="' + f.name + '"]');
          if (input && !input.value.trim()) {
            errEl.textContent = 'Completa el campo: ' + (f.label || f.name);
            input.focus();
            Sounds.error();
            return;
          }
        }
        var values = collect();
        okBtn.disabled = true;
        try {
          var res = opts.onSubmit ? await opts.onSubmit(values) : values;
          if (res === false) { okBtn.disabled = false; return; }
          done(values);
          m.close();
        } catch (err) {
          errEl.textContent = err && err.message ? err.message : 'No se pudo guardar.';
          okBtn.disabled = false;
          Sounds.error();
        }
      });

      setTimeout(function () {
        var first = form.querySelector('input:not([type=checkbox]), select, textarea');
        if (first) first.focus();
      }, 80);
    });
  }

  /* ------------------------------ Varios ------------------------------ */
  function deltaTag(value, opts) {
    opts = opts || {};
    var v = Number(value) || 0;
    var cls = v > 0 ? 'up' : v < 0 ? 'down' : 'flat';
    if (opts.invert) cls = v > 0 ? 'down' : v < 0 ? 'up' : 'flat';
    var arrow = v > 0 ? '▲' : v < 0 ? '▼' : '•';
    return '<span class="delta delta--' + cls + '">' + arrow + ' ' + Fmt.pct(Math.abs(v), false) + (opts.suffix || '') + '</span>';
  }

  function empty(icon, title, text, actionHtml) {
    return '<div class="empty-state">' +
      '<div class="empty-state__ico">' + XP.icon(icon || 'info', 34) + '</div>' +
      '<h4>' + U.esc(title || 'Sin datos') + '</h4>' +
      '<p>' + U.esc(text || '') + '</p>' + (actionHtml || '') + '</div>';
  }

  function download(filename, content, mime) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 500);
  }

  function csv(filename, rows) {
    var body = rows.map(function (row) {
      return row.map(function (cell) {
        var s = cell == null ? '' : String(cell);
        return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(';');
    }).join('\r\n');
    download(filename, '\ufeff' + body, 'text/csv;charset=utf-8');
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copiado al portapapeles', 'success');
      return true;
    } catch (e) {
      toast('No se pudo copiar automáticamente', 'error');
      return false;
    }
  }

  function table(cols, rows, opts) {
    opts = opts || {};
    if (!rows.length) return empty(opts.emptyIcon || 'info', opts.emptyTitle || 'Sin registros', opts.emptyText || 'No hay datos para mostrar con los filtros actuales.');
    return '<div class="table-wrap"><table class="data-table' + (opts.className ? ' ' + opts.className : '') + '">' +
      '<thead><tr>' + cols.map(function (c) { return '<th class="' + (c.align || '') + '">' + U.esc(c.label) + '</th>'; }).join('') + '</tr></thead>' +
      '<tbody>' + rows.map(function (r) {
        return '<tr' + (r._cls ? ' class="' + r._cls + '"' : '') + '>' + cols.map(function (c) {
          var val = c.render ? c.render(r) : U.esc(r[c.key] == null ? '—' : r[c.key]);
          return '<td class="' + (c.align || '') + (c.cls ? ' ' + c.cls : '') + '">' + val + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  function statCard(opts) {
    return '<article class="stat ' + (opts.tone ? 'stat--' + opts.tone : '') + '">' +
      '<header class="stat__head"><span class="stat__ico">' + XP.icon(opts.icon || 'chart', 18) + '</span><span class="stat__label">' + U.esc(opts.label) + '</span></header>' +
      '<p class="stat__value">' + opts.value + '</p>' +
      (opts.sub ? '<p class="stat__sub">' + opts.sub + '</p>' : '') +
      (opts.delta != null ? '<div class="stat__delta">' + deltaTag(opts.delta) + '<span>' + U.esc(opts.deltaLabel || 'vs. periodo anterior') + '</span></div>' : '') +
      '</article>';
  }

  var UI = {
    fmt: Fmt,
    sounds: Sounds,
    toast: toast,
    openModal: openModal,
    confirm: confirmDialog,
    formDialog: formDialog,
    deltaTag: deltaTag,
    empty: empty,
    download: download,
    csv: csv,
    copy: copy,
    table: table,
    stat: statCard,
    esc: U.esc,
    icon: XP.icon,
    /* Zoom de la interfaz (Panel de control → Pantalla). Las medidas de
       clientX/clientY están en píxeles de pantalla: dividir por este factor
       devuelve coordenadas locales. */
    zoom: function () {
      var z = 1;
      try { z = parseFloat(getComputedStyle(document.documentElement).zoom); } catch (e) { z = 1; }
      return (!z || isNaN(z) || z <= 0) ? 1 : z;
    },
    debounce: function (fn, ms) {
      var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms || 200); };
    }
  };

  XP.ui = UI;
  XP.fmt = Fmt;
  XP.toast = toast;
})();
