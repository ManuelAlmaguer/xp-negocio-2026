/* ============================================================
   XP Negocio 2026 · Buscar
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util, F = XP.fmt, UI = XP.ui;

  function mount(win, opts) {
    var query = (opts && opts.query) || '';

    win.setTitle('Buscar');
    win.setSubtitle('Busca en todo el sistema');

    win.content.innerHTML = '<div class="app" style="flex:1"><div class="search-app">' +
      '<div class="search-app__box"><input type="search" id="search-q" placeholder="Buscar productos, ventas, notas, aplicaciones…" value="' + U.esc(query) + '">' +
      '<button class="btn btn--primary" id="search-go">' + XP.icon('search', 14) + ' Buscar</button></div>' +
      '<div id="search-results"></div>' +
    '</div></div>';

    var input = win.content.querySelector('#search-q');
    var host = win.content.querySelector('#search-results');

    function results() {
      var q = query.trim().toLowerCase();
      if (!q) return initial();

      var appHits = Object.keys(XP.wm.apps).map(function (k) { return XP.wm.apps[k]; }).filter(function (a) {
        return (a.title + ' ' + (a.description || '')).toLowerCase().indexOf(q) >= 0;
      }).map(function (a) {
        return { type: 'app', id: a.id, title: a.title, sub: a.description || '', icon: a.icon };
      });

      var prodHits = XP.store.products.filter(function (p) {
        return !p.deletedAt && (p.name + ' ' + p.category).toLowerCase().indexOf(q) >= 0;
      }).slice(0, 8).map(function (p) {
        return { type: 'product', id: p.id, title: p.name, sub: 'Producto · ' + F.money(p.price) + ' · stock ' + (p.trackStock ? p.stock : '∞'), icon: 'inventario' };
      });

      var ops = XP.store.activeOperations().filter(function (o) {
        var hay = (o.productName || '') + ' ' + (o.concept || '') + ' ' + (o.source || '') + ' ' + (o.client || '') + ' ' + (o.note || '');
        return hay.toLowerCase().indexOf(q) >= 0;
      }).sort(function (a, b) { return U.parse(b.date) - U.parse(a.date); }).slice(0, 8).map(function (o) {
        return {
          type: 'op', id: o.id,
          title: o.productName || o.concept || o.source || 'Operación',
          sub: (o.kind === 'venta' ? 'Venta' : o.kind === 'gasto' ? 'Gasto' : 'Inversión') + ' · ' + F.dateTime(o.date) + ' · ' + F.money(o.kind === 'venta' ? o.total : o.amount),
          icon: o.kind === 'venta' ? 'ventas' : o.kind === 'gasto' ? 'gastos' : 'inversiones'
        };
      });

      var noteHits = XP.store.notes.filter(function (n) {
        return !n.deletedAt && (n.title + ' ' + n.body).toLowerCase().indexOf(q) >= 0;
      }).slice(0, 6).map(function (n) {
        return { type: 'note', id: n.id, title: n.title || 'Sin título', sub: String(n.body || '').replace(/\s+/g, ' ').slice(0, 80), icon: 'notas' };
      });

      var groups = [
        { label: 'Aplicaciones', items: appHits, action: function (h) { XP.wm.open(h.id); } },
        { label: 'Productos', items: prodHits, action: function () { XP.wm.open('inventario'); } },
        { label: 'Operaciones', items: ops, action: function () { XP.wm.open('operaciones'); } },
        { label: 'Notas', items: noteHits, action: function () { XP.wm.open('notas'); } }
      ].filter(function (g) { return g.items.length; });

      if (!groups.length) {
        host.innerHTML = UI.empty('search', 'Sin resultados', 'No encontramos nada para "' + query + '". Prueba con otro término.');
        return;
      }
      host.innerHTML = groups.map(function (g) {
        return '<div class="search-group"><h4>' + g.label + ' · ' + g.items.length + '</h4>' + g.items.map(function (h, i) {
          return '<button class="search-hit" data-g="' + groups.indexOf(g) + '" data-i="' + i + '">' + XP.icon(h.icon, 22) +
            '<span><b>' + U.esc(h.title) + '</b><small>' + U.esc(h.sub) + '</small></span></button>';
        }).join('') + '</div>';
      }).join('');

      host.querySelectorAll('[data-g]').forEach(function (b) {
        b.addEventListener('click', function () {
          var g = groups[Number(b.dataset.g)];
          var h = g.items[Number(b.dataset.i)];
          g.action(h);
        });
      });
    }

    function initial() {
      var apps = Object.keys(XP.wm.apps).map(function (k) { return XP.wm.apps[k]; });
      host.innerHTML =
        '<div class="search-group"><h4>Aplicaciones disponibles</h4><div class="quick-actions">' +
          apps.map(function (a) {
            return '<button class="quick-action" data-open="' + a.id + '">' + XP.icon(a.icon, 26) + '<span><b>' + U.esc(a.title) + '</b><small>' + U.esc(a.description || '') + '</small></span></button>';
          }).join('') +
        '</div></div>' +
        '<div class="panel" style="margin-top:12px"><div class="panel__head"><span class="panel__title">' + XP.icon('info', 14) + ' Consejos de búsqueda</span></div>' +
        '<div class="panel__body" style="font-size:calc(11.5px * var(--text-scale));color:var(--ink-3);line-height:1.7">' +
          'Busca por nombre de producto, cliente, concepto de gasto o texto dentro de tus notas.<br>' +
          'También puedes buscar aplicaciones: <em>ventas, reportes, calculadora…</em><br>' +
          'Atajo: <kbd>Ctrl</kbd> + <kbd>K</kbd> desde cualquier ventana.' +
        '</div></div>';
      host.querySelectorAll('[data-open]').forEach(function (b) {
        b.addEventListener('click', function () { XP.wm.open(b.dataset.open); });
      });
    }

    function run() {
      query = input.value;
      results();
    }

    win.content.querySelector('#search-go').addEventListener('click', run);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
    input.addEventListener('input', UI.debounce(run, 220));

    if (query) results(); else initial();
    setTimeout(function () { input.focus(); input.select(); }, 100);
  }

  XP.wm.register({
    id: 'buscar',
    title: 'Buscar',
    desktopLabel: 'Buscar',
    icon: 'buscar',
    width: 760,
    height: 560,
    description: 'Busca en productos, ventas y notas',
    mount: mount
  });
})();
