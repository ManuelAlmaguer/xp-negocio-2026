/* ============================================================
   XP Negocio 2026 · Contabilidad
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util, F = XP.fmt, UI = XP.ui;

  function catLabel(id) {
    var c = XP.store.expenseCats.find(function (x) { return x.id === id; });
    return c ? c.label : (id || 'Otros');
  }
  function varPct(cur, prev) {
    if (!prev) return cur ? 100 : 0;
    return U.round(((cur - prev) / Math.abs(prev)) * 100, 1);
  }

  function mount(win) {
    var rangeId = 'mes';

    win.setTitle('Contabilidad');
    win.setSubtitle('Estado de resultados y márgenes');

    win.content.innerHTML = '<div class="app">' +
      '<div class="app__bar">' +
        '<div class="app__bar-title"><h3>Contabilidad</h3><p>Ingresos, costos, gastos y rentabilidad</p></div>' +
        '<div class="range-tabs" id="acc-range">' +
          XP.ranges.presets().filter(function (p) { return ['mes', 'mesAnterior', '30d', 'año', 'todo'].indexOf(p.id) >= 0; })
            .map(function (p) { return '<button data-range="' + p.id + '" class="' + (rangeId === p.id ? 'is-active' : '') + '">' + p.label + '</button>'; }).join('') +
        '</div>' +
        '<div class="grow"></div>' +
        '<button class="btn btn--sm" data-act="print">' + XP.icon('print', 13) + ' Imprimir</button>' +
        '<button class="btn btn--sm" data-act="export">' + XP.icon('download', 13) + ' CSV</button>' +
      '</div>' +
      '<div class="app__scroll"><div class="app__grid" id="acc-body"></div></div>' +
    '</div>';

    var body = win.content.querySelector('#acc-body');

    function render() {
      var range = XP.ranges.get(rangeId);
      var m = XP.store.metrics(range.from, range.to);
      var p = XP.store.metrics(range.prev.from, range.prev.to);
      var t = XP.store.totals();
      var cats = m.byCategory.filter(function (c) { return c.total > 0; });
      var expCats = {};
      m.expenses.forEach(function (o) { expCats[o.category || 'otros'] = (expCats[o.category || 'otros'] || 0) + U.num(o.amount); });
      var expList = Object.keys(expCats).map(function (k) { return { id: k, label: catLabel(k), amount: U.round(expCats[k]) }; }).sort(function (a, b) { return b.amount - a.amount; });
      var pctOfIncome = function (v) { return m.income > 0 ? (v / m.income) * 100 : 0; };

      function row(label, value, prevValue, cls, sub) {
        var pct = pctOfIncome(value);
        return '<tr class="' + (cls || '') + '"><td>' + (sub ? '<span style="padding-left:14px;display:inline-block">' + U.esc(label) + '</span>' : U.esc(label)) + '</td>' +
          '<td>' + F.money(value) + '</td>' +
          '<td class="muted" style="font-size:calc(11px * var(--text-scale))">' + (m.income > 0 ? F.pct(pct) : '—') + '</td>' +
          '<td class="muted">' + (prevValue != null ? F.money(prevValue) : '—') + '</td>' +
          '<td class="' + (prevValue != null ? (value - prevValue >= 0 ? 'is-pos' : 'is-neg') : 'muted') + '">' + (prevValue != null ? (value - prevValue >= 0 ? '+' : '') + F.pct(varPct(value, prevValue)) : '—') + '</td></tr>';
      }

      body.innerHTML =
        '<section class="stats">' +
          UI.stat({ icon: 'money', label: 'Ingresos', value: F.money(m.income), sub: m.count + ' ventas', tone: 'green', delta: varPct(m.income, p.income) }) +
          UI.stat({ icon: 'box', label: 'Costo de ventas', value: F.money(m.cogs), sub: 'COGS · ' + (m.income ? F.pct(pctOfIncome(m.cogs)) : '—') + ' de ingresos', tone: 'amber', delta: varPct(m.cogs, p.cogs) }) +
          UI.stat({ icon: 'trending', label: 'Ganancia bruta', value: F.money(m.gross), sub: 'margen ' + F.pct(m.margin), tone: 'violet', delta: varPct(m.gross, p.gross) }) +
          UI.stat({ icon: 'wallet', label: 'Gastos operativos', value: F.money(m.expensesTotal), sub: m.expenses.length + ' registros', tone: 'red', delta: varPct(m.expensesTotal, p.expensesTotal) }) +
          UI.stat({ icon: 'chart', label: 'Ganancia neta', value: F.money(m.net), sub: 'margen ' + F.pct(m.netMargin), tone: m.net >= 0 ? 'green' : 'red', delta: varPct(m.net, p.net) }) +
        '</section>' +

        '<section class="app__grid app__grid--dash">' +
          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('contabilidad', 14) + ' Estado de resultados <small>' + U.esc(range.label) + '</small></span>' +
            '<span class="badge badge--grey">' + F.date(range.from) + ' – ' + F.date(range.to) + '</span></div>' +
            '<div class="panel__body panel__body--flush" style="padding:12px"><table class="summary-table" style="width:100%">' +
              '<thead><tr style="font-size:calc(10px * var(--text-scale));text-transform:uppercase;letter-spacing:.4px;color:var(--ink-4)">' +
                '<th style="text-align:left;padding-bottom:6px">Concepto</th><th style="text-align:right">Importe</th><th style="text-align:right">% ventas</th><th style="text-align:right">Anterior</th><th style="text-align:right">Var.</th></tr></thead>' +
              '<tbody>' +
                row('Ingresos por ventas', m.income, p.income, 'strong') +
                cats.map(function (c) { return row(c.label, c.total, null, '', true); }).join('') +
                row('(−) Costo de ventas', m.cogs, p.cogs) +
                row('Ganancia bruta', m.gross, p.gross, 'total') +
                row('(−) Gastos operativos', m.expensesTotal, p.expensesTotal) +
                expList.map(function (c) { return row(c.label, c.amount, null, '', true); }).join('') +
                row('Ganancia neta', m.net, p.net, 'total ' + (m.net >= 0 ? 'is-pos' : 'is-neg')) +
              '</tbody></table></div>' +
            '<div class="panel__foot"><span>Análisis vertical sobre ingresos del periodo</span><span>' + U.esc(XP.store.settings.currency) + '</span></div></div>' +

          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('percent', 14) + ' Indicadores</span></div>' +
            '<div class="panel__body"><div class="pct-bars">' +
              bar('Margen bruto', m.margin, 'green', F.pct(m.margin)) +
              bar('Margen neto', m.netMargin, 'violet', F.pct(m.netMargin)) +
              bar('Costo sobre ventas', pctOfIncome(m.cogs), 'amber', F.pct(pctOfIncome(m.cogs))) +
              bar('Gastos sobre ventas', pctOfIncome(m.expensesTotal), '', F.pct(pctOfIncome(m.expensesTotal))) +
            '</div>' +
            '<table class="summary-table" style="margin-top:14px">' +
              '<tr><td>Ticket promedio</td><td>' + F.money(m.ticket) + '</td></tr>' +
              '<tr><td>Unidades vendidas</td><td>' + F.int(m.units) + '</td></tr>' +
              '<tr><td>Capital actual</td><td>' + F.money(t.capital) + '</td></tr>' +
              '<tr><td>Inventario (costo)</td><td>' + F.money(t.inventoryCost) + '</td></tr>' +
              '<tr class="total"><td>Patrimonio</td><td>' + F.money(t.equity) + '</td></tr>' +
            '</table></div></div>' +
        '</section>' +

        '<section class="app__grid app__grid--2">' +
          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('clock', 14) + ' Cierre de hoy</span>' +
            '<span class="badge badge--green">' + F.dateLong(new Date()) + '</span></div>' +
            '<div class="panel__body">' + todaySummary() + '</div></div>' +
          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('chart', 14) + ' Ventas vs. ganancia <small>últimos 14 días</small></span></div>' +
            '<div class="panel__body"><div class="chart-wrap" id="acc-chart"></div></div></div>' +
        '</section>' +

        '<p class="muted" style="font-size:calc(10.5px * var(--text-scale));text-align:center;padding:2px 0 8px">Cálculo: Ganancia bruta = Ingresos − Costo de ventas · Ganancia neta = Ganancia bruta − Gastos operativos. Los costos se toman del producto al momento de la venta.</p>';

      var series = XP.store.series(U.addDays(new Date(), -13), new Date(), 'dia');
      XP.charts.line(win.content.querySelector('#acc-chart'), {
        labels: series.map(function (b) { return b.label; }),
        series: [
          { name: 'Ingresos', color: '#2f8fe8', values: series.map(function (b) { return b.income; }) },
          { name: 'Ganancia', color: '#43a83a', values: series.map(function (b) { return b.gross; }) }
        ],
        height: 180
      });
    }

    function bar(label, value, tone, text) {
      var v = Math.max(0, Math.min(100, Number(value) || 0));
      return '<div><div class="pct-bar__head"><span>' + U.esc(label) + '</span><b>' + U.esc(text) + '</b></div>' +
        '<div class="pct-bar"><span class="' + (tone || '') + '" style="width:' + v.toFixed(1) + '%"></span></div></div>';
    }

    function todaySummary() {
      var t = XP.store.metrics(U.startOfDay(new Date()), U.endOfDay(new Date()));
      return '<table class="summary-table">' +
        '<tr><td>Ventas de hoy</td><td>' + F.money(t.income) + '</td></tr>' +
        '<tr><td>Ganancia bruta</td><td class="is-pos">' + F.money(t.gross) + '</td></tr>' +
        '<tr><td>Gastos</td><td class="is-neg">' + F.money(t.expensesTotal) + '</td></tr>' +
        '<tr class="total"><td>Ganancia neta</td><td class="' + (t.net >= 0 ? 'is-pos' : 'is-neg') + '">' + F.money(t.net) + '</td></tr>' +
        '<tr><td>Operaciones</td><td>' + t.count + '</td></tr>' +
        '<tr><td>Ticket promedio</td><td>' + F.money(t.ticket) + '</td></tr>' +
      '</table>';
    }

    function exportCSV() {
      var range = XP.ranges.get(rangeId);
      var m = XP.store.metrics(range.from, range.to);
      var rows = [['Estado de resultados', range.label, F.date(range.from) + ' - ' + F.date(range.to)], []];
      rows.push(['Concepto', 'Importe', '% ventas']);
      rows.push(['Ingresos por ventas', m.income, '100']);
      m.byCategory.forEach(function (c) { rows.push(['  ' + c.label, c.total, (m.income ? (c.total / m.income * 100).toFixed(1) : '0')]); });
      rows.push(['Costo de ventas', -m.cogs, (m.income ? (m.cogs / m.income * 100).toFixed(1) : '0')]);
      rows.push(['Ganancia bruta', m.gross, (m.income ? (m.gross / m.income * 100).toFixed(1) : '0')]);
      rows.push(['Gastos operativos', -m.expensesTotal, (m.income ? (m.expensesTotal / m.income * 100).toFixed(1) : '0')]);
      rows.push(['Ganancia neta', m.net, (m.income ? (m.net / m.income * 100).toFixed(1) : '0')]);
      rows.push([]);
      rows.push(['Margen bruto %', m.margin]);
      rows.push(['Margen neto %', m.netMargin]);
      rows.push(['Ticket promedio', m.ticket]);
      UI.csv('estado-resultados-' + U.dateKey(new Date()) + '.csv', rows);
      XP.toast('Estado de resultados exportado', 'success');
    }

    function printReport() {
      var range = XP.ranges.get(rangeId);
      var m = XP.store.metrics(range.from, range.to);
      var t = XP.store.totals();
      var w = window.open('', '_blank', 'width=800,height=900');
      if (!w) { XP.toast('Permite ventanas emergentes para imprimir', 'warning'); return; }
      var rows = [
        ['Ingresos por ventas', F.money(m.income)],
        ['Costo de ventas', '−' + F.money(m.cogs)],
        ['Ganancia bruta', F.money(m.gross)],
        ['Gastos operativos', '−' + F.money(m.expensesTotal)],
        ['Ganancia neta', F.money(m.net)],
        ['Margen bruto', F.pct(m.margin)],
        ['Margen neto', F.pct(m.netMargin)],
        ['Ticket promedio', F.money(m.ticket)]
      ];
      w.document.write('<html><head><title>Estado de resultados</title><style>body{font-family:Segoe UI,Tahoma,sans-serif;padding:30px;color:#14283f}h1{font-size:calc(20px * var(--text-scale));margin:0}small{color:#5b7186}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:calc(13px * var(--text-scale))}td{padding:8px 4px;border-bottom:1px solid #e4ecf5}td:last-child{text-align:right;font-weight:600}tr:last-child td{font-weight:700;border-top:2px solid #cfdced}@media print{button{display:none}}</style></head><body>' +
        '<h1>' + U.esc(XP.store.settings.businessName) + '</h1><small>Estado de resultados · ' + U.esc(range.label) + ' · ' + F.date(range.from) + ' a ' + F.date(range.to) + '</small>' +
        '<table>' + rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('') + '</table>' +
        '<p style="font-size:calc(11px * var(--text-scale));color:#5b7186;margin-top:16px">Patrimonio: ' + F.money(t.equity) + ' · Capital: ' + F.money(t.capital) + ' · Inventario: ' + F.money(t.inventoryCost) + '</p>' +
        '<p style="font-size:calc(11px * var(--text-scale));color:#5b7186">Generado el ' + F.dateTime(new Date()) + '</p></body></html>');
      w.document.close();
      setTimeout(function () { w.print(); }, 300);
    }

    win.content.querySelectorAll('[data-range]').forEach(function (b) {
      b.addEventListener('click', function () {
        rangeId = b.dataset.range;
        win.content.querySelectorAll('[data-range]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        render();
      });
    });
    win.content.querySelector('[data-act="export"]').addEventListener('click', exportCSV);
    win.content.querySelector('[data-act="print"]').addEventListener('click', printReport);

    win.live = true;
    win.onChange = render;
    render();
  }

  XP.wm.register({
    id: 'contabilidad',
    title: 'Contabilidad',
    desktopLabel: 'Contabilidad',
    icon: 'contabilidad',
    width: 1000,
    height: 700,
    description: 'Estado de resultados y márgenes',
    mount: mount
  });
})();
