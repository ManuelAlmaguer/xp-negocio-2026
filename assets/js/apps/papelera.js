/* ============================================================
   XP Negocio 2026 · Papelera de reciclaje
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util, F = XP.fmt, UI = XP.ui;

  function mount(win) {
    var tab = 'operations';

    win.setTitle('Papelera de reciclaje');
    win.setSubtitle('Elementos eliminados · se pueden restaurar');

    win.content.innerHTML = '<div class="app">' +
      '<div class="app__bar"><div class="app__bar-title"><h3>Papelera de reciclaje</h3><p>Restaura o elimina definitivamente</p></div>' +
        '<div class="grow"></div>' +
        '<button class="btn btn--sm" data-act="refresh">' + XP.icon('refresh', 13) + ' Actualizar</button>' +
        '<button class="btn btn--danger btn--sm" data-act="empty">' + XP.icon('trash', 13) + ' Vaciar papelera</button>' +
      '</div>' +
      '<div class="trash-tabs" id="trash-tabs"></div>' +
      '<div class="trash-note">' + XP.icon('info', 12) + ' Los elementos eliminados no afectan tus cuentas. Puedes restaurarlos cuando quieras.</div>' +
      '<div class="app__scroll"><div id="trash-body"></div></div>' +
    '</div>';

    var body = win.content.querySelector('#trash-body');

    function render() {
      var d = XP.store.deleted();
      var tabs = [
        { id: 'operations', label: 'Operaciones', count: d.operations.length },
        { id: 'products', label: 'Productos', count: d.products.length },
        { id: 'notes', label: 'Notas', count: d.notes.length }
      ];
      win.content.querySelector('#trash-tabs').innerHTML = tabs.map(function (t) {
        return '<button class="trash-tab' + (tab === t.id ? ' is-active' : '') + '" data-tab="' + t.id + '">' + t.label + ' <span class="badge badge--grey" style="margin-left:4px">' + t.count + '</span></button>';
      }).join('');
      win.content.querySelectorAll('[data-tab]').forEach(function (b) {
        b.addEventListener('click', function () { tab = b.dataset.tab; render(); });
      });

      if (tab === 'operations') return renderOps(d.operations);
      if (tab === 'products') return renderProducts(d.products);
      return renderNotes(d.notes);
    }

    function renderOps(list) {
      if (!list.length) { body.innerHTML = UI.empty('trash', 'Sin operaciones eliminadas', 'Cuando elimines una venta, gasto o inversión aparecerá aquí.'); return; }
      var rows = list.map(function (o) {
        var detail = o.kind === 'venta' ? o.productName : o.kind === 'gasto' ? o.concept : (o.direction === 'retiro' ? 'Retiro de capital' : 'Aporte de capital');
        var amount = o.kind === 'venta' ? o.total : o.amount;
        return '<tr><td class="nowrap">' + F.date(o.date) + '</td>' +
          '<td><span class="badge badge--grey">' + (o.kind === 'venta' ? 'Venta' : o.kind === 'gasto' ? 'Gasto' : 'Inversión') + '</span></td>' +
          '<td>' + U.esc(detail || '—') + '</td><td class="right strong">' + F.money(amount) + '</td>' +
          '<td class="nowrap muted">' + F.dateTime(o.deletedAt) + '</td>' +
          '<td><div class="row-actions"><button class="btn btn--sm" data-restore="' + o.id + '">' + XP.icon('restore', 12) + ' Restaurar</button>' +
          '<button class="icon-btn icon-btn--danger" data-purge="' + o.id + '" title="Eliminar definitivamente">' + XP.icon('trash', 13) + '</button></div></td></tr>';
      }).join('');
      body.innerHTML = tableWrap(['Fecha', 'Tipo', 'Detalle', 'Monto', 'Eliminado', ''], rows);
      bindOps();
    }

    function renderProducts(list) {
      if (!list.length) { body.innerHTML = UI.empty('trash', 'Sin productos eliminados', 'Los productos que elimines se guardan aquí.'); return; }
      var rows = list.map(function (p) {
        return '<tr><td class="strong">' + U.esc(p.name) + '</td><td>' + U.esc(p.category) + '</td>' +
          '<td class="right">' + F.money(p.price) + '</td><td class="right">' + (p.trackStock ? p.stock : '∞') + '</td>' +
          '<td class="nowrap muted">' + F.dateTime(p.deletedAt) + '</td>' +
          '<td><div class="row-actions"><button class="btn btn--sm" data-restore="' + p.id + '">' + XP.icon('restore', 12) + ' Restaurar</button>' +
          '<button class="icon-btn icon-btn--danger" data-purge="' + p.id + '" title="Eliminar definitivamente">' + XP.icon('trash', 13) + '</button></div></td></tr>';
      }).join('');
      body.innerHTML = tableWrap(['Producto', 'Categoría', 'Precio', 'Stock', 'Eliminado', ''], rows);
      bindProducts();
    }

    function renderNotes(list) {
      if (!list.length) { body.innerHTML = UI.empty('trash', 'Sin notas eliminadas', 'Las notas que elimines se guardan aquí.'); return; }
      var rows = list.map(function (n) {
        return '<tr><td class="strong">' + U.esc(n.title || 'Sin título') + '</td>' +
          '<td class="muted">' + U.esc(String(n.body || '').slice(0, 70)) + (String(n.body || '').length > 70 ? '…' : '') + '</td>' +
          '<td class="nowrap muted">' + F.dateTime(n.deletedAt) + '</td>' +
          '<td><div class="row-actions"><button class="btn btn--sm" data-restore="' + n.id + '">' + XP.icon('restore', 12) + ' Restaurar</button>' +
          '<button class="icon-btn icon-btn--danger" data-purge="' + n.id + '" title="Eliminar definitivamente">' + XP.icon('trash', 13) + '</button></div></td></tr>';
      }).join('');
      body.innerHTML = tableWrap(['Título', 'Contenido', 'Eliminada', ''], rows);
      bindNotes();
    }

    function tableWrap(heads, rows) {
      return '<div class="table-wrap"><table class="data-table"><thead><tr>' + heads.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }

    function bindCommon(restore, purge) {
      body.querySelectorAll('[data-restore]').forEach(function (b) {
        b.addEventListener('click', function () { restore(b.dataset.restore); XP.toast('Elemento restaurado', 'success'); render(); });
      });
      body.querySelectorAll('[data-purge]').forEach(function (b) {
        b.addEventListener('click', async function () {
          var ok = await UI.confirm({ title: 'Eliminar definitivamente', message: 'Esta acción no se puede deshacer. ¿Continuar?', confirmText: 'Eliminar', danger: true });
          if (!ok) return;
          purge(b.dataset.purge);
          XP.toast('Eliminado definitivamente', 'info');
          render();
        });
      });
    }
    function bindOps() { bindCommon(function (id) { XP.store.restoreOperation(id); }, function (id) { XP.store.purgeOperation(id); }); }
    function bindProducts() { bindCommon(function (id) { XP.store.restoreProduct(id); }, function (id) { XP.store.purgeProduct(id); }); }
    function bindNotes() { bindCommon(function (id) { XP.store.restoreNote(id); }, function (id) { XP.store.purgeNote(id); }); }

    win.content.querySelector('[data-act="refresh"]').addEventListener('click', render);
    win.content.querySelector('[data-act="empty"]').addEventListener('click', async function () {
      var d = XP.store.deleted();
      var total = d.operations.length + d.products.length + d.notes.length;
      if (!total) { XP.toast('La papelera ya está vacía', 'info'); return; }
      var ok = await UI.confirm({ title: 'Vaciar papelera', message: 'Se eliminarán definitivamente ' + total + ' elementos. Esta acción no se puede deshacer.', confirmText: 'Vaciar papelera', danger: true });
      if (!ok) return;
      d.operations.forEach(function (o) { XP.store.purgeOperation(o.id); });
      d.products.forEach(function (p) { XP.store.purgeProduct(p.id); });
      d.notes.forEach(function (n) { XP.store.purgeNote(n.id); });
      XP.toast('Papelera vaciada', 'success');
      render();
    });

    win.live = true;
    win.onChange = render;
    render();
  }

  XP.wm.register({
    id: 'papelera',
    title: 'Papelera de reciclaje',
    desktopLabel: 'Papelera de reciclaje',
    icon: 'papelera',
    width: 880,
    height: 560,
    description: 'Elementos eliminados y restauración',
    mount: mount
  });
})();
