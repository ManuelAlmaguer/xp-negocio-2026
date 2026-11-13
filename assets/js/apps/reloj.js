/* ============================================================
   XP Negocio 2026 · Reloj y calendario
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util, F = XP.fmt, UI = XP.ui;

  function mount(win) {
    var view = new Date();
    var selected = U.dateKey(new Date());

    win.setTitle('Reloj y calendario');
    win.setSubtitle('Agenda y resumen diario');

    win.content.innerHTML = '<div class="app" style="flex:1"><div class="app__scroll"><div class="app__grid app__grid--dash">' +
      '<div class="panel"><div class="calendar">' +
        '<div class="calendar__head"><button class="icon-btn" id="cal-prev">' + XP.icon('arrowLeft', 15) + '</button>' +
          '<h3 id="cal-title"></h3>' +
          '<button class="icon-btn" id="cal-next">' + XP.icon('arrowRight', 15) + '</button></div>' +
        '<div class="calendar__grid" id="cal-grid"></div>' +
        '<div class="row" style="margin-top:10px;gap:10px;font-size:calc(10px * var(--text-scale));color:var(--ink-4)">' +
          '<span class="row" style="gap:4px"><i class="dot" style="background:var(--green-500)"></i> Día con ventas</span>' +
          '<span class="row" style="gap:4px"><i class="dot" style="background:var(--blue-500)"></i> Hoy</span></div>' +
      '</div></div>' +
      '<div class="stack">' +
        '<div class="panel"><div class="panel__body" style="text-align:center">' +
          '<div id="clock-live" style="font-size:calc(34px * var(--text-scale));font-weight:600;letter-spacing:-1.5px;color:#16324f">--:--</div>' +
          '<div id="clock-date" style="font-size:calc(11.5px * var(--text-scale));color:var(--ink-3);margin-top:2px"></div>' +
        '</div></div>' +
        '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('calendar', 14) + ' Resumen del día</span></div>' +
          '<div class="panel__body" id="day-summary"></div></div>' +
        '<div class="panel"><div class="panel__head"><span class="panel__title">' + XP.icon('cart', 14) + ' Ventas del día</span></div>' +
          '<div class="mini-list" id="day-sales"></div></div>' +
      '</div>' +
    '</div></div></div>';

    var grid = win.content.querySelector('#cal-grid');
    var title = win.content.querySelector('#cal-title');

    function salesMap() {
      var map = {};
      XP.store.activeOperations().forEach(function (o) {
        if (o.kind !== 'venta') return;
        var k = U.dateKey(U.parse(o.date));
        if (!map[k]) map[k] = { total: 0, profit: 0, count: 0 };
        map[k].total += U.num(o.total);
        map[k].profit += U.num(o.profit);
        map[k].count++;
      });
      return map;
    }

    function renderCalendar() {
      var y = view.getFullYear(), m = view.getMonth();
      title.textContent = XP.ranges.monthName(m).charAt(0).toUpperCase() + XP.ranges.monthName(m).slice(1) + ' ' + y;
      var first = new Date(y, m, 1);
      var startOffset = (first.getDay() + 6) % 7;
      var daysInMonth = new Date(y, m + 1, 0).getDate();
      var prevDays = new Date(y, m, 0).getDate();
      var map = salesMap();
      var todayKey = U.dateKey(new Date());

      var cells = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(function (d) { return '<div class="calendar__dow">' + d + '</div>'; });
      for (var i = 0; i < startOffset; i++) {
        var dPrev = prevDays - startOffset + i + 1;
        cells.push('<div class="calendar__day is-out">' + dPrev + '</div>');
      }
      for (var d = 1; d <= daysInMonth; d++) {
        var key = y + '-' + U.pad(m + 1) + '-' + U.pad(d);
        var s = map[key];
        var cls = 'calendar__day' + (key === todayKey ? ' is-today' : '') + (s ? ' has-sales' : '');
        cells.push('<button class="' + cls + '" data-day="' + key + '" title="' + (s ? F.money(s.total) + ' en ventas' : 'Sin ventas') + '">' +
          '<span>' + d + '</span>' + (s ? '<em>' + F.moneyShort(s.total) + '</em>' : '') + '</button>');
      }
      var total = startOffset + daysInMonth;
      var rest = (7 - (total % 7)) % 7;
      for (var r = 1; r <= rest; r++) cells.push('<div class="calendar__day is-out">' + r + '</div>');

      grid.innerHTML = cells.join('');
      grid.querySelectorAll('[data-day]').forEach(function (b) {
        b.addEventListener('click', function () { selected = b.dataset.day; renderDay(); });
      });
    }

    function renderDay() {
      var day = new Date(selected + 'T00:00');
      var m = XP.store.metrics(U.startOfDay(day), U.endOfDay(day));
      var label = F.dateLong(day);
      win.content.querySelector('#day-summary').innerHTML =
        '<p style="font-size:calc(11px * var(--text-scale));font-weight:700;color:var(--ink-3);margin-bottom:8px">' + U.esc(label) + '</p>' +
        '<table class="summary-table">' +
          '<tr><td>Ventas</td><td>' + F.money(m.income) + '</td></tr>' +
          '<tr><td>Ganancia bruta</td><td class="is-pos">' + F.money(m.gross) + '</td></tr>' +
          '<tr><td>Gastos</td><td class="is-neg">' + F.money(m.expensesTotal) + '</td></tr>' +
          '<tr class="total"><td>Ganancia neta</td><td>' + F.money(m.net) + '</td></tr>' +
          '<tr><td>Operaciones</td><td>' + m.count + '</td></tr>' +
        '</table>';

      var sales = m.sales.slice().sort(function (a, b) { return U.parse(b.date) - U.parse(a.date); }).slice(0, 8);
      var host = win.content.querySelector('#day-sales');
      host.innerHTML = sales.length ? sales.map(function (o) {
        return '<div class="mini-row"><span class="mini-row__ico">' + XP.icon(o.category === 'saldo' ? 'money' : 'cart', 13) + '</span>' +
          '<div class="mini-row__main"><b>' + U.esc(o.productName) + '</b><small>' + F.time(o.date) + ' · ' + o.qty + ' ud</small></div>' +
          '<span class="mini-row__val" style="color:var(--green-600)">+' + F.money(o.total) + '</span></div>';
      }).join('') : '<div class="mini-row"><span class="muted small">Sin ventas este día.</span></div>';
    }

    function tick() {
      var now = new Date();
      var el = win.content.querySelector('#clock-live');
      if (!el) return;
      el.textContent = F.time(now);
      win.content.querySelector('#clock-date').textContent = F.dateLong(now);
    }

    win.content.querySelector('#cal-prev').addEventListener('click', function () {
      view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
      renderCalendar();
    });
    win.content.querySelector('#cal-next').addEventListener('click', function () {
      view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
      renderCalendar();
    });

    renderCalendar();
    renderDay();
    tick();
    var timer = setInterval(tick, 1000);
    win.cleanup = function () { clearInterval(timer); };
  }

  XP.wm.register({
    id: 'reloj',
    title: 'Reloj y calendario',
    desktopLabel: 'Reloj',
    icon: 'reloj',
    width: 820,
    height: 560,
    description: 'Calendario y resumen diario',
    mount: mount
  });
})();
