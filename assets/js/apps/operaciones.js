/* ============================================================
   XP Negocio 2026 · Operaciones
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util, F = XP.fmt, UI = XP.ui;

  var KIND = {
    venta: { label: 'Venta', badge: 'badge--green', icon: 'cart', sign: '+' },
    gasto: { label: 'Gasto', badge: 'badge--red', icon: 'wallet', sign: '−' },
    inversion: { label: 'Inversión', badge: 'badge--violet', icon: 'trending', sign: '' }
  };

  function mount(win, opts) {
    var kind = (opts && opts.kind) || 'todas';
    var rangeId = '30d';
    var from = '', to = '';
    var search = '';
    var payment = 'todos';
    var limit = 80;

    win.setTitle('Operaciones');
    win.setSubtitle('Historial de ventas, gastos e inversiones');

    win.content.innerHTML = '<div class="app">' +
      '<div class="app__bar">' +
        '<div class="app__bar-title"><h3>Operaciones</h3><p>Todos los movimientos del negocio</p></div>' +
        '<div class="grow"></div>' +
        '<button class="btn btn--sm" data-act="new-sale">' + XP.icon('cart', 13) + ' Venta</button>' +
        '<button class="btn btn--sm" data-act="new-expense">' + XP.icon('wallet', 13) + ' Gasto</button>' +
        '<button class="btn btn--sm" data-act="new-invest">' + XP.icon('trending', 13) + ' Inversión</button>' +
        '<button class="btn btn--sm" data-act="export">' + XP.icon('download', 13) + ' CSV</button>' +
      '</div>' +
      '<div class="app__bar" style="padding-top:6px;padding-bottom:8px">' +
        '<div class="range-tabs" id="ops-kinds">' +
          [['todas', 'Todas'], ['venta', 'Ventas'], ['gasto', 'Gastos'], ['inversion', 'Inversiones']].map(function (k) {
            return '<button data-kind="' + k[0] + '" class="' + (kind === k[0] ? 'is-active' : '') + '">' + k[1] + '</button>';
          }).join('') +
        '</div>' +
        '<select id="ops-range" style="height:29px;min-height:0;font-size:calc(11.5px * var(--text-scale));max-width:150px">' +
          XP.ranges.presets().map(function (p) { return '<option value="' + p.id + '"' + (rangeId === p.id ? ' selected' : '') + '>' + p.label + '</option>'; }).join('') +
          '<option value="custom">Personalizado</option>' +
        '</select>' +
        '<div class="filters" id="ops-custom" style="display:none">' +
          '<input type="date" id="ops-from"><span class="muted small">a</span><input type="date" id="ops-to">' +
        '</div>' +
        '<div class="searchbox">' + XP.icon('search', 13) + '<input id="ops-search" type="search" placeholder="Buscar…"></div>' +
        '<select id="ops-pay" style="height:29px;min-height:0;font-size:calc(11.5px * var(--text-scale));max-width:140px"><option value="todos">Todos los pagos</option>' +
          XP.store.payments.map(function (p) { return '<option value="' + p.id + '">' + p.label + '</option>'; }).join('') + '</select>' +
        '<div class="grow"></div>' +
        '<span class="muted small" id="ops-count"></span>' +
      '</div>' +
      '<div class="app__scroll"><div class="app__grid" id="ops-body"></div></div>' +
    '</div>';

    var body = win.content.querySelector('#ops-body');

    function currentRange() {
      if (rangeId === 'custom') {
        var f = from ? U.startOfDay(new Date(from + 'T00:00')) : new Date(2000, 0, 1);
        var t = to ? U.endOfDay(new Date(to + 'T00:00')) : U.endOfDay(new Date());
        return { from: f, to: t, label: 'Personalizado', prev: { from: f, to: f } };
      }
      return XP.ranges.get(rangeId);
    }

    function filtered() {
      var r = currentRange();
      return XP.store.opsInRange(r.from, r.to).filter(function (o) {
        if (kind !== 'todas' && o.kind !== kind) return false;
        if (payment !== 'todos' && o.payment !== payment) return false;
        if (search) {
          var hay = (o.productName || '') + ' ' + (o.concept || '') + ' ' + (o.source || '') + ' ' + (o.note || '') + ' ' + (o.client || '');
          if (hay.toLowerCase().indexOf(search.toLowerCase()) < 0) return false;
        }
        return true;
      }).sort(function (a, b) { return U.parse(b.date) - U.parse(a.date); });
    }

    function render() {
      var r = currentRange();
      var ops = filtered();
      var sales = ops.filter(function (o) { return o.kind === 'venta'; });
      var expenses = ops.filter(function (o) { return o.kind === 'gasto'; });
      var invs = ops.filter(function (o) { return o.kind === 'inversion'; });
      var income = U.sum(sales, function (o) { return o.total; });
      var profit = U.sum(sales, function (o) { return o.profit; });
      var gastos = U.sum(expenses, function (o) { return o.amount; });
      var net = profit - gastos;

      body.innerHTML =
        '<section class="stats">' +
          UI.stat({ icon: 'list', label: 'Operaciones', value: F.int(ops.length), sub: r.label }) +
          UI.stat({ icon: 'cart', label: 'Ventas', value: F.money(income), sub: sales.length + ' tickets', tone: 'green' }) +
          UI.stat({ icon: 'trending', label: 'Ganancia bruta', value: F.money(profit), sub: 'margen ' + (income ? F.pct((profit / income) * 100) : '—'), tone: 'violet' }) +
          UI.stat({ icon: 'wallet', label: 'Gastos', value: F.money(gastos), sub: expenses.length + ' registros', tone: 'amber' }) +
          UI.stat({ icon: 'chart', label: 'Ganancia neta', value: F.money(net), sub: 'tras gastos', tone: net >= 0 ? 'green' : 'red' }) +
        '</section>' +
        '<section class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('list', 14) + ' Movimientos</span>' +
          '<span class="badge badge--grey">' + ops.length + ' resultados</span></div>' +
          '<div class="panel__body panel__body--flush">' + tableHTML(ops) + '</div>' +
          (ops.length > limit ? '<div class="panel__foot"><span>Mostrando ' + limit + ' de ' + ops.length + '</span><button class="btn btn--sm" data-act="more">Cargar más</button></div>' : '') +
        '</section>';

      win.content.querySelector('#ops-count').textContent = ops.length + ' movimientos';

      body.querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { editOp(b.dataset.edit); }); });
      body.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { removeOp(b.dataset.del); }); });
      var more = body.querySelector('[data-act="more"]');
      if (more) more.addEventListener('click', function () { limit += 80; render(); });
    }

    function tableHTML(ops) {
      if (!ops.length) return UI.empty('list', 'Sin operaciones', 'No hay movimientos con los filtros seleccionados. Registra una venta o cambia el rango de fechas.');
      var shown = ops.slice(0, limit);
      var rows = shown.map(function (o) {
        var k = KIND[o.kind] || KIND.venta;
        var detail = o.kind === 'venta' ? o.productName : o.kind === 'gasto' ? o.concept : (o.direction === 'retiro' ? 'Retiro de capital' : 'Aporte de capital');
        var sub = o.kind === 'venta' ? (o.qty + ' × ' + F.money(o.unitPrice)) : o.kind === 'gasto' ? (o.category || '') : (o.source || '');
        var amount = o.kind === 'venta' ? o.total : o.amount;
        var profitCell = o.kind === 'venta' ? '<span class="is-pos">' + F.money(o.profit) + '</span>' : '<span class="muted">—</span>';
        return '<tr>' +
          '<td class="nowrap"><div class="strong" style="font-size:calc(11.5px * var(--text-scale))">' + F.date(o.date) + '</div><small class="muted">' + F.time(o.date) + '</small></td>' +
          '<td><span class="badge ' + k.badge + '">' + k.label + '</span></td>' +
          '<td><div class="strong" style="font-size:calc(11.5px * var(--text-scale))">' + U.esc(detail || '—') + '</div><small class="muted">' + U.esc(sub || '') + '</small></td>' +
          '<td class="right nowrap"><span style="font-weight:700;color:' + (o.kind === 'venta' ? 'var(--green-600)' : o.kind === 'gasto' ? 'var(--red-500)' : 'var(--blue-700)') + '">' +
            (o.kind === 'gasto' ? '−' : o.kind === 'venta' ? '+' : (o.direction === 'retiro' ? '−' : '+')) + F.money(amount) + '</span></td>' +
          '<td class="right nowrap">' + profitCell + '</td>' +
          '<td class="nowrap"><span class="chip" style="font-size:calc(9.5px * var(--text-scale))">' + U.esc(o.kind === 'venta' ? (XP.store.payments.find(function (p) { return p.id === o.payment; }) || {}).label || o.payment : '—') + '</span></td>' +
          '<td><div class="row-actions">' +
            '<button class="icon-btn" data-edit="' + o.id + '" title="Editar">' + XP.icon('edit', 13) + '</button>' +
            '<button class="icon-btn icon-btn--danger" data-del="' + o.id + '" title="Eliminar">' + XP.icon('trash', 13) + '</button>' +
          '</div></td></tr>';
      }).join('');
      return '<div class="table-wrap" style="border:0;border-radius:0"><table class="data-table"><thead><tr>' +
        '<th>Fecha</th><th>Tipo</th><th>Detalle</th><th class="right">Monto</th><th class="right">Ganancia</th><th>Pago</th><th></th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }

    function editOp(id) {
      var o = XP.store.operations.find(function (x) { return x.id === id; });
      if (!o) return;
      var fields, onSubmit;
      if (o.kind === 'venta') {
        fields = [
          { name: 'date', label: 'Fecha y hora', type: 'datetime-local', value: o.date, required: true, full: true },
          { name: 'qty', label: 'Cantidad', type: 'number', min: 1, step: '1', value: o.qty, required: true },
          { name: 'unitPrice', label: 'Precio unitario', type: 'number', min: 0, step: '0.01', value: o.unitPrice, required: true, prefix: XP.store.settings.currencySymbol },
          { name: 'payment', label: 'Método de pago', type: 'select', value: o.payment, options: XP.store.payments.map(function (p) { return { value: p.id, label: p.label }; }) },
          { name: 'client', label: 'Cliente', value: o.client || '', placeholder: 'Opcional' },
          { name: 'note', label: 'Nota', value: o.note || '', full: true, placeholder: 'Opcional' }
        ];
        onSubmit = function (v) {
          var total = U.round(v.unitPrice * v.qty);
          var cost = U.round(U.num(o.unitCost) * v.qty);
          XP.store.updateOperation(id, {
            date: v.date, qty: v.qty, unitPrice: v.unitPrice,
            total: total, cost: cost, profit: U.round(total - cost),
            payment: v.payment, client: v.client, note: v.note
          });
          XP.toast('Venta actualizada', 'success');
          render();
        };
      } else if (o.kind === 'gasto') {
        fields = [
          { name: 'date', label: 'Fecha', type: 'datetime-local', value: o.date, required: true, full: true },
          { name: 'concept', label: 'Concepto', value: o.concept, required: true, full: true },
          { name: 'category', label: 'Categoría', type: 'select', value: o.category, options: XP.store.expenseCats.map(function (c) { return { value: c.id, label: c.label }; }) },
          { name: 'amount', label: 'Monto', type: 'number', min: 0, step: '0.01', value: o.amount, required: true, prefix: XP.store.settings.currencySymbol },
          { name: 'note', label: 'Nota', value: o.note || '', full: true }
        ];
        onSubmit = function (v) {
          XP.store.updateOperation(id, { date: v.date, concept: v.concept, category: v.category, amount: U.round(v.amount), note: v.note });
          XP.toast('Gasto actualizado', 'success');
          render();
        };
      } else {
        fields = [
          { name: 'date', label: 'Fecha', type: 'datetime-local', value: o.date, required: true, full: true },
          { name: 'direction', label: 'Tipo', type: 'select', value: o.direction || 'aporte', options: [{ value: 'aporte', label: 'Aporte (entra dinero)' }, { value: 'retiro', label: 'Retiro (sale dinero)' }] },
          { name: 'amount', label: 'Monto', type: 'number', min: 0, step: '0.01', value: o.amount, required: true, prefix: XP.store.settings.currencySymbol },
          { name: 'source', label: 'Origen / destino', value: o.source || '', full: true },
          { name: 'note', label: 'Nota', value: o.note || '', full: true }
        ];
        onSubmit = function (v) {
          XP.store.updateOperation(id, { date: v.date, direction: v.direction, amount: U.round(v.amount), source: v.source, note: v.note });
          XP.toast('Inversión actualizada', 'success');
          render();
        };
      }
      UI.formDialog({ title: 'Editar ' + KIND[o.kind].label.toLowerCase(), subtitle: o.productName || o.concept || o.source, icon: 'edit', fields: fields, onSubmit: onSubmit });
    }

    async function removeOp(id) {
      var o = XP.store.operations.find(function (x) { return x.id === id; });
      if (!o) return;
      var label = o.productName || o.concept || (o.direction === 'retiro' ? 'Retiro de capital' : 'Aporte de capital');
      var ok = await UI.confirm({ title: 'Eliminar operación', message: '¿Enviar "' + label + '" a la papelera? Podrás restaurarla después.', confirmText: 'Eliminar', danger: true });
      if (!ok) return;
      XP.store.deleteOperation(id);
      XP.toast('Operación enviada a la papelera', 'info');
      render();
    }

    function exportCSV() {
      var ops = filtered();
      var rows = [['Fecha', 'Tipo', 'Detalle', 'Cantidad', 'Precio', 'Costo', 'Total', 'Ganancia', 'Pago', 'Cliente', 'Nota']];
      ops.forEach(function (o) {
        rows.push([
          F.dateTime(o.date), KIND[o.kind].label,
          o.kind === 'venta' ? o.productName : o.kind === 'gasto' ? o.concept : (o.source || ''),
          o.qty || '', o.unitPrice || '', o.cost || '', o.kind === 'venta' ? o.total : o.amount, o.profit || '',
          o.payment || '', o.client || '', o.note || ''
        ]);
      });
      UI.csv('operaciones-' + U.dateKey(new Date()) + '.csv', rows);
      XP.toast('Operaciones exportadas', 'success');
    }

    // Eventos de filtros
    win.content.querySelectorAll('[data-kind]').forEach(function (b) {
      b.addEventListener('click', function () {
        kind = b.dataset.kind;
        win.content.querySelectorAll('[data-kind]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        render();
      });
    });
    var rangeSel = win.content.querySelector('#ops-range');
    rangeSel.addEventListener('change', function () {
      rangeId = rangeSel.value;
      win.content.querySelector('#ops-custom').style.display = rangeId === 'custom' ? 'flex' : 'none';
      if (rangeId === 'custom' && !from) {
        from = U.dateKey(U.addDays(new Date(), -30));
        to = U.dateKey(new Date());
        win.content.querySelector('#ops-from').value = from;
        win.content.querySelector('#ops-to').value = to;
      }
      render();
    });
    win.content.querySelector('#ops-from').addEventListener('change', function (e) { from = e.target.value; render(); });
    win.content.querySelector('#ops-to').addEventListener('change', function (e) { to = e.target.value; render(); });
    win.content.querySelector('#ops-search').addEventListener('input', UI.debounce(function (e) { search = e.target.value.trim(); render(); }, 180));
    win.content.querySelector('#ops-pay').addEventListener('change', function (e) { payment = e.target.value; render(); });
    win.content.querySelector('[data-act="new-sale"]').addEventListener('click', function () { XP.wm.open('ventas'); });
    win.content.querySelector('[data-act="new-expense"]').addEventListener('click', function () { XP.wm.open('gastos', { action: 'new' }); });
    win.content.querySelector('[data-act="new-invest"]').addEventListener('click', function () { XP.wm.open('inversiones', { action: 'new' }); });
    win.content.querySelector('[data-act="export"]').addEventListener('click', exportCSV);

    win.live = true;
    win.onChange = render;
    render();
  }

  XP.wm.register({
    id: 'operaciones',
    title: 'Operaciones',
    desktopLabel: 'Operaciones',
    icon: 'operaciones',
    width: 1000,
    height: 620,
    description: 'Historial de ventas, gastos e inversiones',
    mount: mount
  });
})();
