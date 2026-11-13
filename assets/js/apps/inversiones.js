/* ============================================================
   XP Negocio 2026 · Inversiones
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util, F = XP.fmt, UI = XP.ui;

  function mount(win, opts) {
    var rangeId = 'todo';

    win.setTitle('Inversiones');
    win.setSubtitle('Capital aportado, retiros y rendimiento');

    win.content.innerHTML = '<div class="app">' +
      '<div class="app__bar">' +
        '<div class="app__bar-title"><h3>Inversiones</h3><p>Controla el dinero que entra y sale del negocio</p></div>' +
        '<div class="range-tabs" id="inv-range">' +
          ['mes', 'año', 'todo'].map(function (id) {
            var p = XP.ranges.get(id);
            return '<button data-range="' + id + '" class="' + (rangeId === id ? 'is-active' : '') + '">' + (id === 'todo' ? 'Todo' : p.label) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="grow"></div>' +
        '<button class="btn btn--sm" data-act="withdraw">' + XP.icon('arrowDown', 13) + ' Retiro</button>' +
        '<button class="btn btn--primary btn--sm" data-act="new">' + XP.icon('plus', 13) + ' Nuevo aporte</button>' +
      '</div>' +
      '<div class="app__scroll"><div class="app__grid" id="inv-body"></div></div>' +
    '</div>';

    var body = win.content.querySelector('#inv-body');

    function capitalSeries() {
      var now = new Date();
      var months = [];
      for (var i = 7; i >= 0; i--) {
        var d = U.addMonths(now, -i);
        months.push({ key: d.getFullYear() + '-' + U.pad(d.getMonth() + 1), label: XP.ranges.MONTHS_SHORT[d.getMonth()], end: U.endOfMonth(d) });
      }
      var ops = XP.store.activeOperations();
      var series = months.map(function (mo) {
        var aportes = 0, retiros = 0, profit = 0, gastos = 0;
        ops.forEach(function (o) {
          var t = U.parse(o.date).getTime();
          if (t > mo.end.getTime()) return;
          if (o.kind === 'inversion') {
            if (o.direction === 'retiro') retiros += U.num(o.amount); else aportes += U.num(o.amount);
          } else if (o.kind === 'venta') profit += U.num(o.profit);
          else if (o.kind === 'gasto') gastos += U.num(o.amount);
        });
        return { label: mo.label, value: U.round(aportes - retiros + profit - gastos), aportes: U.round(aportes), retiros: U.round(retiros) };
      });
      return series;
    }

    function render() {
      var range = XP.ranges.get(rangeId);
      var m = XP.store.metrics(range.from, range.to);
      var totals = XP.store.totals();
      var invOps = XP.store.activeOperations().filter(function (o) { return o.kind === 'inversion'; }).sort(function (a, b) { return U.parse(b.date) - U.parse(a.date); });
      var aportes = invOps.filter(function (o) { return o.direction !== 'retiro'; });
      var retiros = invOps.filter(function (o) { return o.direction === 'retiro'; });
      var series = capitalSeries();

      body.innerHTML =
        '<section class="stats">' +
          UI.stat({ icon: 'arrowUp', label: 'Total aportado', value: F.money(totals.aportes), sub: aportes.length + ' aportes', tone: 'green' }) +
          UI.stat({ icon: 'arrowDown', label: 'Total retirado', value: F.money(totals.retiros), sub: retiros.length + ' retiros', tone: 'amber' }) +
          UI.stat({ icon: 'wallet', label: 'Inversión neta', value: F.money(totals.investmentNet), sub: 'capital invertido', tone: 'violet' }) +
          UI.stat({ icon: 'trending', label: 'Ganancia acumulada', value: F.money(totals.net), sub: 'neta, tras gastos', tone: 'green' }) +
          UI.stat({ icon: 'percent', label: 'ROI', value: F.pct(totals.roi), sub: 'sobre inversión neta', tone: totals.roi >= 0 ? 'green' : 'red' }) +
        '</section>' +

        '<section class="app__grid app__grid--dash">' +
          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('chart', 14) + ' Evolución del capital <small>últimos 8 meses</small></span>' +
            '<span class="badge badge--green">Hoy: ' + F.money(totals.capital) + '</span></div>' +
            '<div class="panel__body"><div class="chart-wrap" id="inv-chart"></div></div></div>' +
          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('info', 14) + ' Cómo se calcula</span></div>' +
            '<div class="panel__body"><table class="summary-table">' +
              '<tr><td>Aportes de capital</td><td class="is-pos">+' + F.money(totals.aportes) + '</td></tr>' +
              '<tr><td>Retiros de capital</td><td class="is-neg">−' + F.money(totals.retiros) + '</td></tr>' +
              '<tr><td>Ganancia neta acumulada</td><td class="is-pos">+' + F.money(totals.net) + '</td></tr>' +
              '<tr class="total"><td>Capital actual</td><td>' + F.money(totals.capital) + '</td></tr>' +
            '</table>' +
            '<p class="muted" style="font-size:calc(10.5px * var(--text-scale));margin-top:10px;line-height:1.5">El capital actual es el dinero disponible del negocio: aportes − retiros + ganancias netas. El inventario se muestra aparte como patrimonio.</p></div></div>' +
        '</section>' +

        '<section class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('list', 14) + ' Movimientos de capital</span>' +
          '<span class="badge badge--grey">' + invOps.length + ' registros</span></div>' +
          '<div class="panel__body panel__body--flush">' + tableHTML(invOps) + '</div>' +
          '<div class="panel__foot"><span>Periodo mostrado: ' + U.esc(range.label) + ' · ' + F.money(m.investmentNet) + ' neto</span>' +
            '<span>Patrimonio (capital + inventario): <strong>' + F.money(totals.equity) + '</strong></span></div></section>';

      XP.charts.line(win.content.querySelector('#inv-chart'), {
        labels: series.map(function (s) { return s.label; }),
        series: [{ name: 'Capital', color: '#7a5cd6', values: series.map(function (s) { return s.value; }) }],
        height: 210
      });

      body.querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { edit(b.dataset.edit); }); });
      body.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { remove(b.dataset.del); }); });
      var inline = body.querySelector('[data-new-inline]');
      if (inline) inline.addEventListener('click', function () { form(); });
    }

    function tableHTML(list) {
      if (!list.length) return UI.empty('inversiones', 'Sin inversiones', 'Registra tu primer aporte de capital para empezar a medir la rentabilidad.', '<button class="btn btn--primary btn--sm" data-new-inline>Nuevo aporte</button>');
      var rows = list.map(function (o) {
        var isRetiro = o.direction === 'retiro';
        return '<tr>' +
          '<td class="nowrap"><div class="strong" style="font-size:calc(11.5px * var(--text-scale))">' + F.date(o.date) + '</div><small class="muted">' + F.time(o.date) + '</small></td>' +
          '<td><span class="badge ' + (isRetiro ? 'badge--amber' : 'badge--green') + '">' + (isRetiro ? 'Retiro' : 'Aporte') + '</span></td>' +
          '<td>' + U.esc(o.source || '—') + (o.note ? '<br><small class="muted">' + U.esc(o.note) + '</small>' : '') + '</td>' +
          '<td class="right strong" style="color:' + (isRetiro ? 'var(--red-500)' : 'var(--green-600)') + '">' + (isRetiro ? '−' : '+') + F.money(o.amount) + '</td>' +
          '<td><div class="row-actions">' +
            '<button class="icon-btn" data-edit="' + o.id + '" title="Editar">' + XP.icon('edit', 13) + '</button>' +
            '<button class="icon-btn icon-btn--danger" data-del="' + o.id + '" title="Eliminar">' + XP.icon('trash', 13) + '</button>' +
          '</div></td></tr>';
      }).join('');
      return '<div class="table-wrap" style="border:0;border-radius:0"><table class="data-table"><thead><tr><th>Fecha</th><th>Tipo</th><th>Origen / destino</th><th class="right">Monto</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    }

    function form(op) {
      var isEdit = !!op;
      op = op || { direction: 'aporte', date: U.dateTimeLocal(new Date()) };
      UI.formDialog({
        title: isEdit ? 'Editar movimiento de capital' : 'Nuevo movimiento de capital',
        subtitle: 'Aportes y retiros afectan el capital disponible',
        icon: 'inversiones',
        submitText: isEdit ? 'Guardar cambios' : 'Registrar',
        fields: [
          { name: 'direction', label: 'Tipo de movimiento', type: 'select', value: op.direction || 'aporte', options: [
            { value: 'aporte', label: 'Aporte de capital (entra dinero)' },
            { value: 'retiro', label: 'Retiro de capital (sale dinero)' }
          ] },
          { name: 'amount', label: 'Monto', type: 'number', step: '0.01', min: 0, value: op.amount || '', required: true, prefix: XP.store.settings.currencySymbol },
          { name: 'date', label: 'Fecha y hora', type: 'datetime-local', value: op.date, required: true },
          { name: 'source', label: 'Origen / destino', value: op.source || '', placeholder: 'Ej. Ahorro personal, banco…' },
          { name: 'note', label: 'Nota', type: 'textarea', value: op.note || '', full: true, placeholder: 'Detalle opcional' }
        ],
        onSubmit: function (v) {
          if (v.direction === 'retiro') {
            var cap = XP.store.totals().capital;
            if (U.num(v.amount) > cap) throw new Error('El retiro (' + F.money(v.amount) + ') supera el capital disponible (' + F.money(cap) + ').');
          }
          if (isEdit) {
            XP.store.updateOperation(op.id, { direction: v.direction, amount: U.round(v.amount), date: v.date, source: v.source, note: v.note });
            XP.toast('Movimiento actualizado', 'success');
          } else {
            XP.store.addOperation({ kind: 'inversion', direction: v.direction, amount: U.round(v.amount), date: v.date, source: v.source, note: v.note });
            XP.ui.sounds.success();
            XP.toast(v.direction === 'retiro' ? 'Retiro registrado' : 'Aporte registrado', 'success');
          }
          render();
        }
      });
    }

    function edit(id) {
      var o = XP.store.operations.find(function (x) { return x.id === id; });
      if (o) form(o);
    }

    async function remove(id) {
      var o = XP.store.operations.find(function (x) { return x.id === id; });
      if (!o) return;
      var ok = await UI.confirm({ title: 'Eliminar movimiento', message: '¿Enviar este ' + (o.direction === 'retiro' ? 'retiro' : 'aporte') + ' de ' + F.money(o.amount) + ' a la papelera?', confirmText: 'Eliminar', danger: true });
      if (!ok) return;
      XP.store.deleteOperation(id);
      XP.toast('Movimiento enviado a la papelera', 'info');
      render();
    }

    win.content.querySelectorAll('[data-range]').forEach(function (b) {
      b.addEventListener('click', function () {
        rangeId = b.dataset.range;
        win.content.querySelectorAll('[data-range]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        render();
      });
    });
    win.content.querySelector('[data-act="new"]').addEventListener('click', function () { form(); });
    win.content.querySelector('[data-act="withdraw"]').addEventListener('click', function () { form({ direction: 'retiro', date: U.dateTimeLocal(new Date()) }); });

    win.live = true;
    win.onChange = render;
    render();

    if (opts && opts.action === 'new') setTimeout(function () { form(); }, 250);
  }

  XP.wm.register({
    id: 'inversiones',
    title: 'Inversiones',
    desktopLabel: 'Inversiones',
    icon: 'inversiones',
    width: 940,
    height: 620,
    description: 'Capital, aportes, retiros y ROI',
    mount: mount
  });
})();
