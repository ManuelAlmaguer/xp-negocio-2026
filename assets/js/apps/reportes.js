/* ============================================================
   XP Negocio 2026 · Reportes
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util, F = XP.fmt, UI = XP.ui;

  function mount(win) {
    var rangeId = '30d';
    var customFrom = '', customTo = '';
    var gran = 'dia';
    var cat = 'todas';

    win.setTitle('Reportes');
    win.setSubtitle('Ventas por día, semana y mes');

    win.content.innerHTML = '<div class="app">' +
      '<div class="app__bar">' +
        '<div class="app__bar-title"><h3>Reportes</h3><p>Analiza el rendimiento por periodo</p></div>' +
        '<div class="grow"></div>' +
        '<button class="btn btn--sm" data-act="print">' + XP.icon('print', 13) + ' Imprimir</button>' +
        '<button class="btn btn--sm" data-act="export">' + XP.icon('download', 13) + ' Exportar CSV</button>' +
      '</div>' +
      '<div class="app__bar" style="padding-top:6px;padding-bottom:8px">' +
        '<select id="rep-range" style="height:29px;min-height:0;font-size:calc(11.5px * var(--text-scale));max-width:160px">' +
          XP.ranges.presets().map(function (p) { return '<option value="' + p.id + '"' + (rangeId === p.id ? ' selected' : '') + '>' + p.label + '</option>'; }).join('') +
          '<option value="custom">Personalizado</option>' +
        '</select>' +
        '<div class="filters" id="rep-custom" style="display:none"><input type="date" id="rep-from"><span class="muted small">a</span><input type="date" id="rep-to"></div>' +
        '<div class="seg" id="rep-gran">' +
          [['dia', 'Por día'], ['semana', 'Por semana'], ['mes', 'Por mes']].map(function (g) {
            return '<button data-gran="' + g[0] + '" class="' + (gran === g[0] ? 'is-active' : '') + '">' + g[1] + '</button>';
          }).join('') + '</div>' +
        '<select id="rep-cat" style="height:29px;min-height:0;font-size:calc(11.5px * var(--text-scale));max-width:150px">' +
          '<option value="todas">Todas las categorías</option>' +
          XP.store.categories.map(function (c) { return '<option value="' + c.id + '"' + (cat === c.id ? ' selected' : '') + '>' + U.esc(c.label) + '</option>'; }).join('') +
        '</select>' +
        '<div class="grow"></div>' +
        '<span class="badge" id="rep-label"></span>' +
      '</div>' +
      '<div class="app__scroll"><div class="app__grid" id="rep-body"></div></div>' +
    '</div>';

    var body = win.content.querySelector('#rep-body');

    function range() {
      if (rangeId === 'custom') {
        var f = customFrom ? U.startOfDay(new Date(customFrom + 'T00:00')) : U.startOfDay(U.addDays(new Date(), -29));
        var t = customTo ? U.endOfDay(new Date(customTo + 'T00:00')) : U.endOfDay(new Date());
        if (t < f) { var tmp = f; f = t; t = U.endOfDay(tmp); }
        var span = Math.max(1, U.daysBetween(f, t) + 1);
        return { from: f, to: t, label: 'Personalizado', prev: { from: U.startOfDay(U.addDays(f, -span)), to: U.endOfDay(U.addDays(f, -1)) } };
      }
      return XP.ranges.get(rangeId);
    }

    function salesOf(ops) {
      return ops.filter(function (o) { return o.kind === 'venta' && (cat === 'todas' || o.category === cat); });
    }

    function aggregate(from, to) {
      var ops = XP.store.opsInRange(from, to);
      var sales = salesOf(ops);
      var expenses = ops.filter(function (o) { return o.kind === 'gasto'; });
      var income = U.sum(sales, function (o) { return o.total; });
      var cogs = U.sum(sales, function (o) { return o.cost; });
      var gross = U.round(income - cogs);
      var gastos = U.sum(expenses, function (o) { return o.amount; });
      return {
        sales: sales, expenses: expenses,
        income: U.round(income), cogs: U.round(cogs), gross: gross,
        expensesTotal: U.round(gastos), net: U.round(gross - gastos),
        count: sales.length, units: U.sum(sales, function (o) { return o.qty; }),
        margin: income ? U.round(gross / income * 100, 1) : 0,
        ticket: sales.length ? U.round(income / sales.length) : 0
      };
    }

    function buckets(r) {
      var list = [];
      var map = {};
      var cur = U.startOfDay(r.from);
      var end = U.startOfDay(r.to);
      while (cur <= end) {
        var key, label, bStart, bEnd;
        if (gran === 'mes') {
          key = cur.getFullYear() + '-' + U.pad(cur.getMonth() + 1);
          label = XP.ranges.MONTHS_SHORT[cur.getMonth()] + ' ' + String(cur.getFullYear()).slice(2);
          bStart = U.startOfMonth(cur); bEnd = U.endOfMonth(cur);
          cur = U.addMonths(U.startOfMonth(cur), 1);
        } else if (gran === 'semana') {
          var ws = U.startOfWeek(cur);
          key = U.dateKey(ws);
          label = 'Sem ' + U.pad(ws.getDate()) + '/' + U.pad(ws.getMonth() + 1);
          bStart = ws; bEnd = U.endOfDay(U.addDays(ws, 6));
          cur = U.addDays(ws, 7);
        } else {
          key = U.dateKey(cur);
          label = U.pad(cur.getDate()) + '/' + U.pad(cur.getMonth() + 1);
          bStart = new Date(cur); bEnd = U.endOfDay(cur);
          cur = U.addDays(cur, 1);
        }
        var b = { key: key, label: label, from: bStart, to: bEnd, income: 0, cost: 0, gross: 0, expenses: 0, net: 0, count: 0, units: 0 };
        list.push(b); map[key] = b;
      }
      var ops = XP.store.opsInRange(r.from, r.to);
      ops.forEach(function (o) {
        var d = U.parse(o.date);
        var key = gran === 'mes' ? d.getFullYear() + '-' + U.pad(d.getMonth() + 1) : gran === 'semana' ? U.dateKey(U.startOfWeek(d)) : U.dateKey(d);
        var b = map[key];
        if (!b) return;
        if (o.kind === 'venta' && (cat === 'todas' || o.category === cat)) {
          b.income += U.num(o.total); b.cost += U.num(o.cost); b.count++; b.units += U.num(o.qty);
        } else if (o.kind === 'gasto') {
          b.expenses += U.num(o.amount);
        }
      });
      list.forEach(function (b) {
        b.income = U.round(b.income); b.cost = U.round(b.cost);
        b.gross = U.round(b.income - b.cost);
        b.expenses = U.round(b.expenses);
        b.net = U.round(b.gross - b.expenses);
        b.margin = b.income ? U.round((b.gross / b.income) * 100, 1) : 0;
      });
      return list;
    }

    function delta(cur, prev) {
      if (!prev) return cur ? 100 : 0;
      return U.round(((cur - prev) / Math.abs(prev)) * 100, 1);
    }

    function render() {
      var r = range();
      var cur = aggregate(r.from, r.to);
      var prev = aggregate(r.prev.from, r.prev.to);
      var bs = buckets(r);
      var byProduct = {};
      cur.sales.forEach(function (o) {
        var k = o.productName;
        if (!byProduct[k]) byProduct[k] = { name: k, qty: 0, total: 0, profit: 0 };
        byProduct[k].qty += U.num(o.qty);
        byProduct[k].total += U.num(o.total);
        byProduct[k].profit += U.num(o.profit);
      });
      var top = Object.keys(byProduct).map(function (k) { return byProduct[k]; }).sort(function (a, b) { return b.total - a.total; }).slice(0, 8);
      var topMax = top.length ? top[0].total : 1;
      var payments = {};
      cur.sales.forEach(function (o) { payments[o.payment || 'efectivo'] = (payments[o.payment || 'efectivo'] || 0) + U.num(o.total); });
      var payList = Object.keys(payments).map(function (k) {
        var p = XP.store.payments.find(function (x) { return x.id === k; });
        return { label: p ? p.label : k, value: U.round(payments[k]) };
      });
      var payTotal = U.sum(payList, function (p) { return p.value; });

      win.content.querySelector('#rep-label').textContent = r.label + ' · ' + F.date(r.from) + ' – ' + F.date(r.to);

      body.innerHTML =
        '<section class="stats">' +
          UI.stat({ icon: 'money', label: 'Ingresos', value: F.money(cur.income), sub: cur.count + ' ventas', delta: delta(cur.income, prev.income), tone: 'green' }) +
          UI.stat({ icon: 'cart', label: 'Unidades', value: F.int(cur.units), sub: 'artículos vendidos', delta: delta(cur.units, prev.units) }) +
          UI.stat({ icon: 'trending', label: 'Ganancia bruta', value: F.money(cur.gross), sub: 'margen ' + F.pct(cur.margin), delta: delta(cur.gross, prev.gross), tone: 'violet' }) +
          UI.stat({ icon: 'wallet', label: 'Gastos', value: F.money(cur.expensesTotal), sub: 'operativos', delta: delta(cur.expensesTotal, prev.expensesTotal), tone: 'amber' }) +
          UI.stat({ icon: 'chart', label: 'Ganancia neta', value: F.money(cur.net), sub: 'después de gastos', delta: delta(cur.net, prev.net), tone: cur.net >= 0 ? 'green' : 'red' }) +
          UI.stat({ icon: 'percent', label: 'Ticket promedio', value: F.money(cur.ticket), sub: 'por venta', delta: delta(cur.ticket, prev.ticket) }) +
        '</section>' +

        '<section class="app__grid app__grid--2">' +
          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('chart', 14) + ' Ingresos por ' + (gran === 'dia' ? 'día' : gran === 'semana' ? 'semana' : 'mes') + '</span>' +
            '<span class="badge badge--grey">' + bs.length + ' periodos</span></div>' +
            '<div class="panel__body"><div class="chart-wrap" id="rep-bars"></div></div></div>' +
          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('trending', 14) + ' Ganancia y gastos</span>' +
            '<div class="legend"><span class="legend__item"><i style="background:#43a83a"></i>Ganancia</span><span class="legend__item"><i style="background:#e0603a"></i>Gastos</span></div></div>' +
            '<div class="panel__body"><div class="chart-wrap" id="rep-line"></div></div></div>' +
        '</section>' +

        '<section class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('calendar', 14) + ' Detalle por periodo</span>' +
          '<span class="badge badge--grey">' + (cat === 'todas' ? 'Todas las categorías' : XP.store.categories.find(function (c) { return c.id === cat; }).label) + '</span></div>' +
          '<div class="panel__body panel__body--flush">' + detailTable(bs) + '</div>' +
          '<div class="panel__foot"><span>Total del periodo</span><span>Ingresos <strong>' + F.money(cur.income) + '</strong> · Ganancia neta <strong>' + F.money(cur.net) + '</strong></span></div>' +
        '</section>' +

        '<section class="app__grid app__grid--2">' +
          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('star', 14) + ' Productos más vendidos</span></div>' +
            '<div class="panel__body">' + (top.length ? '<div class="pct-bars">' + top.map(function (p, i) {
              return '<div><div class="pct-bar__head"><span>' + U.esc(p.name) + ' <small class="muted">(' + p.qty + ')</small></span><b>' + F.money(p.total) + '</b></div>' +
                '<div class="pct-bar"><span class="' + ['', 'green', 'amber', 'violet'][i % 4] + '" style="width:' + Math.max(3, (p.total / topMax) * 100).toFixed(1) + '%"></span></div></div>';
            }).join('') + '</div>' : '<p class="muted small">Sin ventas en el periodo.</p>') + '</div></div>' +
          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('wallet', 14) + ' Métodos de pago</span></div>' +
            '<div class="panel__body"><div class="donut-wrap"><div id="rep-donut"></div><div class="legend" id="rep-pay" style="flex-direction:column;align-items:flex-start;gap:6px"></div></div></div></div>' +
        '</section>';

      XP.charts.bars(win.content.querySelector('#rep-bars'), {
        labels: bs.map(function (b) { return b.label; }),
        values: bs.map(function (b) { return b.income; }),
        color: '#2f8fe8', height: 200
      });
      XP.charts.line(win.content.querySelector('#rep-line'), {
        labels: bs.map(function (b) { return b.label; }),
        series: [
          { name: 'Ganancia', color: '#43a83a', values: bs.map(function (b) { return b.gross; }) },
          { name: 'Gastos', color: '#e0603a', values: bs.map(function (b) { return b.expenses; }) }
        ],
        height: 200
      });
      var colors = ['#2f8fe8', '#43a83a', '#e8a317', '#7a5cd6'];
      XP.charts.donut(win.content.querySelector('#rep-donut'), {
        items: payList.map(function (p, i) { return { label: p.label, value: p.value, color: colors[i % colors.length] }; }),
        centerValue: F.moneyShort(payTotal), centerLabel: 'cobrado', size: 150
      });
      XP.charts.legend(win.content.querySelector('#rep-pay'), payList.map(function (p, i) {
        return { label: p.label, color: colors[i % colors.length], value: F.money(p.value) };
      }));
    }

    function detailTable(bs) {
      if (!bs.length) return UI.empty('calendar', 'Sin periodos', 'Selecciona otro rango de fechas.');
      var tot = { income: 0, cost: 0, gross: 0, expenses: 0, net: 0, count: 0, units: 0 };
      var rows = bs.map(function (b) {
        tot.income += b.income; tot.cost += b.cost; tot.gross += b.gross; tot.expenses += b.expenses; tot.net += b.net; tot.count += b.count; tot.units += b.units;
        return '<tr><td class="strong">' + b.label + '</td><td class="right">' + b.count + '</td><td class="right">' + F.int(b.units) + '</td>' +
          '<td class="right strong">' + F.money(b.income) + '</td><td class="right muted">' + F.money(b.cost) + '</td>' +
          '<td class="right is-pos">' + F.money(b.gross) + '</td><td class="right is-neg">' + F.money(b.expenses) + '</td>' +
          '<td class="right strong" style="color:' + (b.net >= 0 ? 'var(--green-600)' : 'var(--red-500)') + '">' + F.money(b.net) + '</td>' +
          '<td class="right"><span class="badge ' + (b.margin >= 35 ? 'badge--green' : b.margin >= 15 ? '' : 'badge--amber') + '">' + F.pct(b.margin) + '</span></td></tr>';
      }).join('');
      return '<div class="table-wrap" style="border:0;border-radius:0"><table class="data-table"><thead><tr>' +
        '<th>Periodo</th><th class="right">Ventas</th><th class="right">Unid.</th><th class="right">Ingresos</th><th class="right">Costo</th>' +
        '<th class="right">Ganancia</th><th class="right">Gastos</th><th class="right">Neto</th><th class="right">Margen</th></tr></thead>' +
        '<tbody>' + rows + '</tbody><tfoot><tr><td>Total</td><td class="right">' + tot.count + '</td><td class="right">' + F.int(tot.units) + '</td>' +
        '<td class="right">' + F.money(tot.income) + '</td><td class="right">' + F.money(tot.cost) + '</td><td class="right is-pos">' + F.money(tot.gross) + '</td>' +
        '<td class="right is-neg">' + F.money(tot.expenses) + '</td><td class="right">' + F.money(tot.net) + '</td><td></td></tr></tfoot></table></div>';
    }

    function exportCSV() {
      var r = range();
      var bs = buckets(r);
      var rows = [['Reporte', r.label, F.date(r.from) + ' - ' + F.date(r.to)], [], ['Periodo', 'Ventas', 'Unidades', 'Ingresos', 'Costo', 'Ganancia', 'Gastos', 'Neto', 'Margen %']];
      bs.forEach(function (b) {
        rows.push([b.label, b.count, b.units, b.income, b.cost, b.gross, b.expenses, b.net, b.margin]);
      });
      UI.csv('reporte-' + U.dateKey(new Date()) + '.csv', rows);
      XP.toast('Reporte exportado', 'success');
    }

    function printReport() {
      var r = range();
      var cur = aggregate(r.from, r.to);
      var bs = buckets(r);
      var w = window.open('', '_blank', 'width=900,height=900');
      if (!w) { XP.toast('Permite ventanas emergentes para imprimir', 'warning'); return; }
      w.document.write('<html><head><title>Reporte</title><style>body{font-family:Segoe UI,Tahoma,sans-serif;padding:28px;color:#14283f}h1{font-size:calc(20px * var(--text-scale));margin:0}small{color:#5b7186}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:calc(12px * var(--text-scale))}th{text-align:left;background:#eef4fb;padding:6px;border-bottom:1px solid #cfdced}td{padding:6px;border-bottom:1px solid #e4ecf5}td:last-child,th:last-child{text-align:right}.kpi{display:flex;gap:20px;margin-top:14px;font-size:calc(12px * var(--text-scale))}</style></head><body>' +
        '<h1>' + U.esc(XP.store.settings.businessName) + '</h1><small>Reporte de ventas · ' + U.esc(r.label) + ' · ' + F.date(r.from) + ' a ' + F.date(r.to) + '</small>' +
        '<div class="kpi"><span>Ingresos: <b>' + F.money(cur.income) + '</b></span><span>Ganancia bruta: <b>' + F.money(cur.gross) + '</b></span><span>Gastos: <b>' + F.money(cur.expensesTotal) + '</b></span><span>Ganancia neta: <b>' + F.money(cur.net) + '</b></span></div>' +
        '<table><thead><tr><th>Periodo</th><th>Ventas</th><th>Unidades</th><th>Ingresos</th><th>Ganancia</th><th>Gastos</th><th>Neto</th><th>Margen</th></tr></thead><tbody>' +
        bs.map(function (b) { return '<tr><td>' + b.label + '</td><td>' + b.count + '</td><td>' + b.units + '</td><td>' + F.money(b.income) + '</td><td>' + F.money(b.gross) + '</td><td>' + F.money(b.expenses) + '</td><td>' + F.money(b.net) + '</td><td>' + F.pct(b.margin) + '</td></tr>'; }).join('') +
        '</tbody></table><p style="font-size:calc(11px * var(--text-scale));color:#5b7186;margin-top:14px">Generado el ' + F.dateTime(new Date()) + '</p></body></html>');
      w.document.close();
      setTimeout(function () { w.print(); }, 300);
    }

    // filtros
    var rangeSel = win.content.querySelector('#rep-range');
    rangeSel.addEventListener('change', function () {
      rangeId = rangeSel.value;
      win.content.querySelector('#rep-custom').style.display = rangeId === 'custom' ? 'flex' : 'none';
      if (rangeId === 'custom' && !customFrom) {
        customFrom = U.dateKey(U.addDays(new Date(), -29));
        customTo = U.dateKey(new Date());
        win.content.querySelector('#rep-from').value = customFrom;
        win.content.querySelector('#rep-to').value = customTo;
      }
      render();
    });
    win.content.querySelector('#rep-from').addEventListener('change', function (e) { customFrom = e.target.value; render(); });
    win.content.querySelector('#rep-to').addEventListener('change', function (e) { customTo = e.target.value; render(); });
    win.content.querySelectorAll('[data-gran]').forEach(function (b) {
      b.addEventListener('click', function () {
        gran = b.dataset.gran;
        win.content.querySelectorAll('[data-gran]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        render();
      });
    });
    win.content.querySelector('#rep-cat').addEventListener('change', function (e) { cat = e.target.value; render(); });
    win.content.querySelector('[data-act="export"]').addEventListener('click', exportCSV);
    win.content.querySelector('[data-act="print"]').addEventListener('click', printReport);

    win.live = true;
    win.onChange = render;
    render();
  }

  XP.wm.register({
    id: 'reportes',
    title: 'Reportes',
    desktopLabel: 'Reportes',
    icon: 'reportes',
    width: 1040,
    height: 720,
    description: 'Ventas por día, semana y mes',
    mount: mount
  });
})();
