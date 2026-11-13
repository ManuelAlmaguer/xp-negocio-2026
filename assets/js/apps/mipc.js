/* ============================================================
   XP Negocio 2026 · Mi PC (resumen del negocio)
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util, F = XP.fmt, UI = XP.ui;

  function pctDelta(cur, prev) {
    if (!prev) return cur > 0 ? 100 : 0;
    return U.round(((cur - prev) / Math.abs(prev)) * 100, 1);
  }

  function opIcon(op) {
    if (op.kind === 'venta') return op.category === 'saldo' ? 'money' : 'cart';
    if (op.kind === 'gasto') return 'wallet';
    return op.direction === 'retiro' ? 'arrowDown' : 'trending';
  }
  function opLabel(op) {
    if (op.kind === 'venta') return op.productName;
    if (op.kind === 'gasto') return op.concept;
    return (op.direction === 'retiro' ? 'Retiro de capital' : 'Aporte de capital') + ' · ' + (op.source || '');
  }

  function render(win, opts) {
    var rangeId = win._range || 'semana';
    var range = XP.ranges.get(rangeId);
    var m = XP.store.metrics(range.from, range.to);
    var prev = XP.store.metrics(range.prev.from, range.prev.to);
    var totals = XP.store.totals();
    var inv = XP.store.inventory();
    var s = XP.store.settings;
    /* La meta es siempre del mes en curso, no del rango seleccionado en las pestañas. */
    var monthRange = XP.ranges.get('mes');
    var monthIncome = XP.store.metrics(monthRange.from, monthRange.to).income;
    var goalPct = s.monthlyGoal > 0 ? Math.min(100, (monthIncome / s.monthlyGoal) * 100) : 0;
    var series = XP.store.series(U.addDays(new Date(), -13), new Date(), 'dia');
    var recent = XP.store.activeOperations().slice().sort(function (a, b) { return U.parse(b.date) - U.parse(a.date); }).slice(0, 7);
    var top = m.byProduct.slice(0, 5);
    var topMax = top.length ? top[0].total : 1;

    win.setTitle('Mi PC');
    win.setSubtitle('Resumen del negocio · ' + range.label);

    var tabs = XP.ranges.presets().filter(function (p) { return ['hoy', 'semana', 'mes', 'mesAnterior', 'año'].indexOf(p.id) >= 0; })
      .map(function (p) { return '<button data-range="' + p.id + '" class="' + (p.id === rangeId ? 'is-active' : '') + '">' + p.label + '</button>'; }).join('');

    var html = '<div class="app">' +
      '<div class="app__bar">' +
        '<div class="app__bar-title"><h3>Mi PC</h3><p>Inversión, capital y ganancias de ' + U.esc(s.businessName) + '</p></div>' +
        '<div class="range-tabs">' + tabs + '</div>' +
        '<div class="grow"></div>' +
        '<button class="btn btn--sm" data-act="refresh">' + XP.icon('refresh', 13) + ' Actualizar</button>' +
        '<button class="btn btn--primary btn--sm" data-act="new-sale">' + XP.icon('plus', 13) + ' Nueva venta</button>' +
      '</div>' +
      '<div class="app__scroll"><div class="app__grid">' +

        // Hero
        '<section class="hero">' +
          '<div class="hero__top">' +
            '<div>' +
              '<p class="hero__label">Capital actual en el negocio</p>' +
              '<p class="hero__value">' + F.money(totals.capital) + '</p>' +
              '<p class="hero__sub">Inversión neta + ganancias acumuladas · ' + U.esc(s.currency) + '</p>' +
            '</div>' +
            '<div class="hero__right">' +
              '<span class="hero__chip">' + XP.icon('trending', 12) + ' ROI ' + F.pct(totals.roi) + '</span>' +
              '<p class="hero__sub" style="margin-top:6px">Actualizado ' + F.time(new Date()) + '</p>' +
            '</div>' +
          '</div>' +
          '<div class="hero__metrics">' +
            '<div class="hero__metric"><small>Inversión neta</small><strong>' + F.money(totals.investmentNet) + '</strong><span>' + F.money(totals.aportes) + ' aportados</span></div>' +
            '<div class="hero__metric"><small>Ganancia neta</small><strong>' + F.money(totals.net) + '</strong><span>después de gastos</span></div>' +
            '<div class="hero__metric"><small>Valor en inventario</small><strong>' + F.money(inv.cost) + '</strong><span>' + inv.units + ' unidades</span></div>' +
            '<div class="hero__metric"><small>Patrimonio total</small><strong>' + F.money(totals.equity) + '</strong><span>capital + inventario</span></div>' +
          '</div>' +
          '<div class="hero__spark" id="hero-spark"></div>' +
          '<div class="goal"><div class="goal__row"><span>Meta de ventas del mes</span><span>' + F.money(monthIncome) + ' / ' + F.money(s.monthlyGoal) + ' · ' + Math.round(goalPct) + '%</span></div>' +
          '<div class="goal__bar"><div class="goal__fill" style="width:' + Math.max(1, goalPct).toFixed(1) + '%"></div></div></div>' +
        '</section>' +

        // KPIs
        '<section class="stats">' +
          UI.stat({ icon: 'money', label: 'Ventas del periodo', value: F.money(m.income), sub: m.count + ' operaciones · ' + F.int(m.units) + ' uds', delta: pctDelta(m.income, prev.income), tone: 'green' }) +
          UI.stat({ icon: 'trending', label: 'Ganancia bruta', value: F.money(m.gross), sub: 'Margen ' + F.pct(m.margin), delta: pctDelta(m.gross, prev.gross), tone: 'violet' }) +
          UI.stat({ icon: 'wallet', label: 'Gastos', value: F.money(m.expensesTotal), sub: 'del periodo', delta: pctDelta(m.expensesTotal, prev.expensesTotal), tone: 'amber' }) +
          UI.stat({ icon: 'chart', label: 'Ganancia neta', value: F.money(m.net), sub: 'Margen neto ' + F.pct(m.netMargin), delta: pctDelta(m.net, prev.net), tone: m.net >= 0 ? 'green' : 'red' }) +
          UI.stat({ icon: 'cart', label: 'Ticket promedio', value: F.money(m.ticket), sub: 'por venta', delta: pctDelta(m.ticket, prev.ticket) }) +
        '</section>' +

        // Gráfico + dona
        '<section class="app__grid app__grid--dash">' +
          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('chart', 14) + ' Ingresos y ganancias <small>últimos 14 días</small></span>' +
            '<div class="legend"><span class="legend__item"><i style="background:#2f8fe8"></i>Ingresos</span><span class="legend__item"><i style="background:#43a83a"></i>Ganancia</span></div></div>' +
            '<div class="panel__body"><div class="chart-wrap" id="dash-line"></div></div></div>' +
          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('percent', 14) + ' Ventas por categoría</span></div>' +
            '<div class="panel__body"><div class="donut-wrap"><div id="dash-donut"></div><div class="legend" id="dash-legend" style="flex-direction:column;align-items:flex-start;gap:6px"></div></div></div></div>' +
        '</section>' +

        // Top productos + recientes + stock
        '<section class="app__grid app__grid--3">' +
          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('star', 14) + ' Más vendidos</span><span class="badge">' + U.esc(range.label) + '</span></div>' +
            '<div class="panel__body"><div class="pct-bars">' +
              (top.length ? top.map(function (p, i) {
                return '<div><div class="pct-bar__head"><span>' + U.esc(p.name) + '</span><b>' + F.money(p.total) + '</b></div>' +
                  '<div class="pct-bar"><span class="' + ['', 'green', 'amber', 'violet'][i % 4] + '" style="width:' + Math.max(3, (p.total / topMax) * 100).toFixed(1) + '%"></span></div></div>';
              }).join('') : '<p class="muted small">Sin ventas en el periodo.</p>') +
            '</div></div></div>' +

          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('list', 14) + ' Movimientos recientes</span>' +
            '<button class="linkish" data-act="open-ops" style="font-size:calc(10.5px * var(--text-scale))">Ver todos</button></div>' +
            '<div class="mini-list">' + (recent.length ? recent.map(function (o) {
              var isSale = o.kind === 'venta';
              var val = isSale ? o.total : o.amount;
              return '<div class="mini-row"><span class="mini-row__ico">' + XP.icon(opIcon(o), 13) + '</span>' +
                '<div class="mini-row__main"><b>' + U.esc(opLabel(o)) + '</b><small>' + F.dateTime(o.date) + '</small></div>' +
                '<span class="mini-row__val" style="color:' + (isSale ? 'var(--green-600)' : o.kind === 'gasto' ? 'var(--red-500)' : 'var(--blue-700)') + '">' +
                (isSale || o.kind === 'gasto' ? (isSale ? '+' : '−') : '') + F.money(val) + '</span></div>';
            }).join('') : '<div class="mini-row"><span class="muted small">Sin movimientos todavía.</span></div>') + '</div></div>' +

          '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('box', 14) + ' Stock bajo</span>' +
            '<button class="linkish" data-act="open-inv" style="font-size:calc(10.5px * var(--text-scale))">Inventario</button></div>' +
            '<div class="mini-list">' + (inv.low.length ? inv.low.slice(0, 6).map(function (p) {
              return '<div class="mini-row"><span class="mini-row__ico" style="color:var(--red-500);background:#fdeceb">' + XP.icon('alert', 13) + '</span>' +
                '<div class="mini-row__main"><b>' + U.esc(p.name) + '</b><small>Mínimo ' + p.minStock + ' ' + U.esc(p.unit) + '</small></div>' +
                '<span class="mini-row__val" style="color:var(--red-600)">' + p.stock + ' ' + U.esc(p.unit) + '</span></div>';
            }).join('') : '<div class="mini-row"><span class="muted small">Todo el inventario está por encima del mínimo.</span></div>') + '</div></div>' +
        '</section>' +

        // Acciones rápidas
        '<section class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('grid', 14) + ' Acciones rápidas</span></div>' +
          '<div class="panel__body"><div class="quick-actions">' +
            '<button class="quick-action" data-act="new-sale">' + XP.icon('ventas', 26) + '<span><b>Registrar venta</b><small>Cigarros o saldo</small></span></button>' +
            '<button class="quick-action" data-act="new-expense">' + XP.icon('gastos', 26) + '<span><b>Nuevo gasto</b><small>Salida de caja</small></span></button>' +
            '<button class="quick-action" data-act="new-invest">' + XP.icon('inversiones', 26) + '<span><b>Inversión</b><small>Aporte o retiro</small></span></button>' +
            '<button class="quick-action" data-act="open-reports">' + XP.icon('reportes', 26) + '<span><b>Reportes</b><small>Día, semana, mes</small></span></button>' +
            '<button class="quick-action" data-act="open-accounting">' + XP.icon('contabilidad', 26) + '<span><b>Contabilidad</b><small>Estado de resultados</small></span></button>' +
          '</div></div></section>' +

      '</div></div>' +
    '</div>';

    win.content.innerHTML = html;

    // Gráficos
    var sparkHost = win.content.querySelector('#hero-spark');
    XP.charts.spark(sparkHost, { values: series.map(function (b) { return b.income; }), color: '#a7ffd0', height: 40 });

    XP.charts.line(win.content.querySelector('#dash-line'), {
      labels: series.map(function (b) { return b.label; }),
      series: [
        { name: 'Ingresos', color: '#2f8fe8', values: series.map(function (b) { return b.income; }) },
        { name: 'Ganancia', color: '#43a83a', values: series.map(function (b) { return b.gross; }) }
      ],
      height: 210
    });

    var cats = m.byCategory.filter(function (c) { return c.total > 0; });
    var totalCat = U.sum(cats, function (c) { return c.total; });
    XP.charts.donut(win.content.querySelector('#dash-donut'), {
      items: cats.map(function (c) { return { label: c.label, value: c.total, color: c.color }; }),
      centerValue: F.moneyShort(totalCat),
      centerLabel: 'ventas',
      size: 160
    });
    XP.charts.legend(win.content.querySelector('#dash-legend'), cats.map(function (c) {
      return { label: c.label + ' · ' + Math.round((c.total / (totalCat || 1)) * 100) + '%', color: c.color, value: F.money(c.total) };
    }));

    // Eventos
    win.content.querySelectorAll('[data-range]').forEach(function (b) {
      b.addEventListener('click', function () { win._range = b.dataset.range; render(win, opts); });
    });
    win.content.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () {
        var act = b.dataset.act;
        if (act === 'refresh') { render(win, opts); XP.toast('Datos actualizados', 'info'); }
        else if (act === 'new-sale') XP.wm.open('ventas');
        else if (act === 'new-expense') XP.wm.open('gastos', { action: 'new' });
        else if (act === 'new-invest') XP.wm.open('inversiones', { action: 'new' });
        else if (act === 'open-ops') XP.wm.open('operaciones');
        else if (act === 'open-inv') XP.wm.open('inventario');
        else if (act === 'open-reports') XP.wm.open('reportes');
        else if (act === 'open-accounting') XP.wm.open('contabilidad');
      });
    });

    win.live = true;
    win.onChange = function () { render(win, opts); };
  }

  XP.wm.register({
    id: 'mipc',
    title: 'Mi PC',
    desktopLabel: 'Mi PC',
    icon: 'mipc',
    width: 1040,
    height: 660,
    description: 'Inversión, capital, ganancias y resumen',
    mount: render
  });
})();
