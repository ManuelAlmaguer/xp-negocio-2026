/* ============================================================
   XP Negocio 2026 · Gastos
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util, F = XP.fmt, UI = XP.ui;

  function catLabel(id) {
    var c = XP.store.expenseCats.find(function (x) { return x.id === id; });
    return c ? c.label : (id || 'Otros');
  }

  var COLORS = ['#e0603a', '#e8a317', '#7a5cd6', '#2f8fe8', '#43a83a', '#c2457a', '#6b7f94'];

  function mount(win, opts) {
    var rangeId = 'mes';

    win.setTitle('Gastos');
    win.setSubtitle('Salidas de dinero y costos operativos');

    win.content.innerHTML = '<div class="app">' +
      '<div class="app__bar">' +
        '<div class="app__bar-title"><h3>Gastos</h3><p>Registra todo lo que sale de la caja</p></div>' +
        '<div class="range-tabs" id="gst-range">' +
          XP.ranges.presets().filter(function (p) { return ['hoy', 'semana', 'mes', 'mesAnterior', 'año'].indexOf(p.id) >= 0; })
            .map(function (p) { return '<button data-range="' + p.id + '" class="' + (rangeId === p.id ? 'is-active' : '') + '">' + p.label + '</button>'; }).join('') +
        '</div>' +
        '<div class="grow"></div>' +
        '<button class="btn btn--sm" data-act="export">' + XP.icon('download', 13) + ' CSV</button>' +
        '<button class="btn btn--primary btn--sm" data-act="new">' + XP.icon('plus', 13) + ' Nuevo gasto</button>' +
      '</div>' +
      '<div class="app__scroll"><div class="app__grid" id="gst-body"></div></div>' +
    '</div>';

    var body = win.content.querySelector('#gst-body');

    function render() {
      var range = XP.ranges.get(rangeId);
      var m = XP.store.metrics(range.from, range.to);
      var expenses = m.expenses.slice().sort(function (a, b) { return U.parse(b.date) - U.parse(a.date); });
      var total = U.sum(expenses, function (o) { return o.amount; });
      var avg = expenses.length ? total / expenses.length : 0;
      var max = expenses.slice().sort(function (a, b) { return b.amount - a.amount; })[0];
      var byCat = {};
      expenses.forEach(function (o) {
        var k = o.category || 'otros';
        byCat[k] = (byCat[k] || 0) + U.num(o.amount);
      });
      var cats = Object.keys(byCat).map(function (k, i) {
        return { id: k, label: catLabel(k), value: U.round(byCat[k]), color: COLORS[i % COLORS.length] };
      }).sort(function (a, b) { return b.value - a.value; });

      body.innerHTML =
        '<section class="stats">' +
          UI.stat({ icon: 'wallet', label: 'Gastos del periodo', value: F.money(total), sub: range.label, tone: 'red' }) +
          UI.stat({ icon: 'list', label: 'Registros', value: F.int(expenses.length), sub: 'movimientos', tone: 'amber' }) +
          UI.stat({ icon: 'chart', label: 'Gasto promedio', value: F.money(avg), sub: 'por registro' }) +
          UI.stat({ icon: 'alert', label: 'Mayor gasto', value: max ? F.money(max.amount) : '—', sub: max ? U.esc(max.concept) : 'sin datos', tone: 'violet' }) +
          UI.stat({ icon: 'percent', label: 'Sobre ventas', value: m.income ? F.pct((total / m.income) * 100) : '—', sub: 'del ingreso del periodo', tone: 'amber' }) +
        '</section>' +

        '<section class="app__grid app__grid--dash">' +
          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('list', 14) + ' Gastos registrados</span>' +
            '<span class="badge badge--grey">' + expenses.length + '</span></div>' +
            '<div class="panel__body panel__body--flush">' + tableHTML(expenses) + '</div></div>' +
          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('percent', 14) + ' Por categoría</span></div>' +
            '<div class="panel__body"><div class="donut-wrap"><div id="gst-donut"></div><div class="legend" id="gst-legend" style="flex-direction:column;align-items:flex-start;gap:6px"></div></div>' +
            (cats.length ? '' : '<p class="muted small" style="text-align:center;margin-top:8px">Sin gastos en el periodo</p>') + '</div></div>' +
        '</section>';

      XP.charts.donut(win.content.querySelector('#gst-donut'), {
        items: cats, centerValue: F.moneyShort(total), centerLabel: 'gastos', size: 160
      });
      XP.charts.legend(win.content.querySelector('#gst-legend'), cats.map(function (c) {
        return { label: c.label, color: c.color, value: F.money(c.value) };
      }));

      body.querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { form(find(b.dataset.edit)); }); });
      body.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { remove(b.dataset.del); }); });
      var inline = body.querySelector('[data-new-inline]');
      if (inline) inline.addEventListener('click', function () { form(); });
    }

    function find(id) { return XP.store.operations.find(function (x) { return x.id === id; }); }

    function tableHTML(list) {
      if (!list.length) return UI.empty('gastos', 'Sin gastos', 'No hay gastos registrados en este periodo.', '<button class="btn btn--primary btn--sm" data-new-inline>Registrar gasto</button>');
      var rows = list.map(function (o) {
        return '<tr>' +
          '<td class="nowrap"><div class="strong" style="font-size:calc(11.5px * var(--text-scale))">' + F.date(o.date) + '</div><small class="muted">' + F.time(o.date) + '</small></td>' +
          '<td><div class="strong" style="font-size:calc(11.5px * var(--text-scale))">' + U.esc(o.concept) + '</div>' + (o.note ? '<small class="muted">' + U.esc(o.note) + '</small>' : '') + '</td>' +
          '<td><span class="badge badge--amber">' + U.esc(catLabel(o.category)) + '</span></td>' +
          '<td class="right strong" style="color:var(--red-500)">−' + F.money(o.amount) + '</td>' +
          '<td><div class="row-actions">' +
            '<button class="icon-btn" data-edit="' + o.id + '" title="Editar">' + XP.icon('edit', 13) + '</button>' +
            '<button class="icon-btn icon-btn--danger" data-del="' + o.id + '" title="Eliminar">' + XP.icon('trash', 13) + '</button>' +
          '</div></td></tr>';
      }).join('');
      return '<div class="table-wrap" style="border:0;border-radius:0"><table class="data-table"><thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th class="right">Monto</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    }

    function form(op) {
      var isEdit = !!op;
      op = op || {};
      UI.formDialog({
        title: isEdit ? 'Editar gasto' : 'Nuevo gasto',
        subtitle: 'Los gastos se descuentan de la ganancia bruta',
        icon: 'gastos',
        submitText: isEdit ? 'Guardar cambios' : 'Registrar gasto',
        fields: [
          { name: 'concept', label: 'Concepto', value: op.concept || '', required: true, full: true, placeholder: 'Ej. Compra de mercancía, transporte…' },
          { name: 'amount', label: 'Monto', type: 'number', step: '0.01', min: 0, value: op.amount || '', required: true, prefix: XP.store.settings.currencySymbol },
          { name: 'date', label: 'Fecha y hora', type: 'datetime-local', value: op.date || U.dateTimeLocal(new Date()), required: true },
          { name: 'category', label: 'Categoría', type: 'select', value: op.category || 'mercancia', options: XP.store.expenseCats.map(function (c) { return { value: c.id, label: c.label }; }) },
          { name: 'note', label: 'Nota', value: op.note || '', full: true, placeholder: 'Detalle opcional' }
        ],
        onSubmit: function (v) {
          if (isEdit) {
            XP.store.updateOperation(op.id, { concept: v.concept, amount: U.round(v.amount), date: v.date, category: v.category, note: v.note });
            XP.toast('Gasto actualizado', 'success');
          } else {
            XP.store.addOperation({ kind: 'gasto', concept: v.concept, amount: U.round(v.amount), date: v.date, category: v.category, note: v.note });
            XP.ui.sounds.success();
            XP.toast('Gasto registrado: ' + F.money(v.amount), 'success');
          }
          render();
        }
      });
    }

    async function remove(id) {
      var o = find(id);
      if (!o) return;
      var ok = await UI.confirm({ title: 'Eliminar gasto', message: '¿Enviar "' + o.concept + '" a la papelera?', confirmText: 'Eliminar', danger: true });
      if (!ok) return;
      XP.store.deleteOperation(id);
      XP.toast('Gasto enviado a la papelera', 'info');
      render();
    }

    function exportCSV() {
      var range = XP.ranges.get(rangeId);
      var list = XP.store.metrics(range.from, range.to).expenses;
      var rows = [['Fecha', 'Concepto', 'Categoría', 'Monto', 'Nota']];
      list.forEach(function (o) { rows.push([F.dateTime(o.date), o.concept, catLabel(o.category), o.amount, o.note || '']); });
      UI.csv('gastos-' + U.dateKey(new Date()) + '.csv', rows);
      XP.toast('Gastos exportados', 'success');
    }

    win.content.querySelectorAll('[data-range]').forEach(function (b) {
      b.addEventListener('click', function () {
        rangeId = b.dataset.range;
        win.content.querySelectorAll('[data-range]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        render();
      });
    });
    win.content.querySelector('[data-act="new"]').addEventListener('click', function () { form(); });
    win.content.querySelector('[data-act="export"]').addEventListener('click', exportCSV);

    win.live = true;
    win.onChange = render;
    render();

    if (opts && opts.action === 'new') setTimeout(function () { form(); }, 250);
  }

  XP.wm.register({
    id: 'gastos',
    title: 'Gastos',
    desktopLabel: 'Gastos',
    icon: 'gastos',
    width: 940,
    height: 600,
    description: 'Salidas de dinero y costos',
    mount: mount
  });
})();
