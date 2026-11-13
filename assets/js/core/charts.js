/* ============================================================
   XP Negocio 2026 · Gráficos SVG ligeros (sin dependencias)
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util;

  function compact(n) {
    var v = Number(n) || 0;
    var a = Math.abs(v);
    if (a >= 1e6) return (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.0', '') + 'M';
    if (a >= 1e3) return (v / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace('.0', '') + 'k';
    return String(Math.round(v));
  }

  function niceMax(max) {
    if (max <= 0) return 100;
    var pow = Math.pow(10, Math.floor(Math.log10(max)));
    var norm = max / pow;
    var step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return step * pow;
  }

  function esc(s) { return U.esc(s); }

  var Charts = {
    compact: compact,

    line: function (el, opts) {
      if (!el) return;
      var labels = opts.labels || [];
      var series = opts.series || [];
      var W = 640, H = opts.height || 220;
      var padL = 46, padR = 14, padT = 16, padB = 26;
      var n = labels.length;
      if (!n) { el.innerHTML = '<p class="chart-empty">Sin datos en este periodo</p>'; return; }

      var max = 0, min = 0;
      series.forEach(function (s) {
        s.values.forEach(function (v) { max = Math.max(max, Number(v) || 0); min = Math.min(min, Number(v) || 0); });
      });
      var top = niceMax(max || 10);
      var bottom = min < 0 ? -niceMax(Math.abs(min)) : 0;
      var span = top - bottom || 1;

      function X(i) { return padL + (n === 1 ? (W - padL - padR) / 2 : (i * (W - padL - padR)) / (n - 1)); }
      function Y(v) { return padT + (H - padT - padB) * (1 - ((Number(v) || 0) - bottom) / span); }

      var grid = '';
      for (var g = 0; g <= 4; g++) {
        var val = bottom + (span * g) / 4;
        var y = Y(val);
        grid += '<line x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y.toFixed(1) + '" class="chart-grid"/>';
        grid += '<text x="' + (padL - 8) + '" y="' + (y + 3.5).toFixed(1) + '" class="chart-axis" text-anchor="end">' + compact(val) + '</text>';
      }

      var step = Math.max(1, Math.ceil(n / 9));
      var xlabels = '';
      labels.forEach(function (l, i) {
        if (i % step !== 0 && i !== n - 1) return;
        xlabels += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 8) + '" class="chart-axis" text-anchor="middle">' + esc(l) + '</text>';
      });

      var body = '';
      series.forEach(function (s, si) {
        var color = s.color || '#2f8fe8';
        var pts = s.values.map(function (v, i) { return [X(i), Y(v)]; });
        var d = pts.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
        if (opts.area !== false && si === 0) {
          var area = d + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + Y(bottom) + ' L' + pts[0][0].toFixed(1) + ' ' + Y(bottom) + ' Z';
          body += '<path d="' + area + '" fill="url(#chart-grad-' + si + ')" opacity=".55"/>';
        }
        body += '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" class="chart-line"/>';
        s.values.forEach(function (v, i) {
          if (n <= 40) body += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="2.6" fill="#fff" stroke="' + color + '" stroke-width="1.8"><title>' + esc(labels[i]) + ': ' + compact(v) + '</title></circle>';
        });
      });

      var defs = series.map(function (s, si) {
        var color = s.color || '#2f8fe8';
        return '<linearGradient id="chart-grad-' + si + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".45"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient>';
      }).join('');

      el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" preserveAspectRatio="none"><defs>' + defs + '</defs>' + grid + xlabels + body + '</svg>';
    },

    bars: function (el, opts) {
      if (!el) return;
      var labels = opts.labels || [], values = opts.values || [];
      var W = 640, H = opts.height || 220;
      var padL = 46, padR = 14, padT = 16, padB = 26;
      var n = values.length;
      if (!n) { el.innerHTML = '<p class="chart-empty">Sin datos en este periodo</p>'; return; }
      var max = Math.max.apply(null, values.concat([0]));
      var min = Math.min.apply(null, values.concat([0]));
      var top = niceMax(max || 10);
      var bottom = min < 0 ? -niceMax(Math.abs(min)) : 0;
      var span = top - bottom || 1;
      var innerW = W - padL - padR;
      var slot = innerW / n;
      var bw = Math.max(3, Math.min(34, slot * 0.62));
      var y0 = padT + (H - padT - padB) * (1 - (0 - bottom) / span);

      var grid = '';
      for (var g = 0; g <= 4; g++) {
        var val = bottom + (span * g) / 4;
        var y = padT + (H - padT - padB) * (1 - (val - bottom) / span);
        grid += '<line x1="' + padL + '" y1="' + y.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y.toFixed(1) + '" class="chart-grid"/>';
        grid += '<text x="' + (padL - 8) + '" y="' + (y + 3.5).toFixed(1) + '" class="chart-axis" text-anchor="end">' + compact(val) + '</text>';
      }

      var step = Math.max(1, Math.ceil(n / 10));
      var xlabels = '', bars = '';
      labels.forEach(function (l, i) {
        if (i % step === 0 || i === n - 1) xlabels += '<text x="' + (padL + slot * i + slot / 2).toFixed(1) + '" y="' + (H - 8) + '" class="chart-axis" text-anchor="middle">' + esc(l) + '</text>';
        var v = values[i] || 0;
        var y = padT + (H - padT - padB) * (1 - (v - bottom) / span);
        var h = Math.abs(y0 - y);
        var color = typeof opts.color === 'function' ? opts.color(v, i) : (opts.color || '#2f8fe8');
        bars += '<rect x="' + (padL + slot * i + (slot - bw) / 2).toFixed(1) + '" y="' + Math.min(y, y0).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, h).toFixed(1) + '" rx="' + Math.min(4, bw / 2).toFixed(1) + '" fill="' + color + '" class="chart-bar" style="animation-delay:' + (i * 14) + 'ms"><title>' + esc(l) + ': ' + compact(v) + '</title></rect>';
      });

      el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" preserveAspectRatio="none">' + grid + xlabels + bars + '</svg>';
    },

    donut: function (el, opts) {
      if (!el) return;
      var items = (opts.items || []).filter(function (i) { return Number(i.value) > 0; });
      var total = items.reduce(function (a, b) { return a + Number(b.value); }, 0);
      if (!total) { el.innerHTML = '<p class="chart-empty">Sin datos</p>'; return; }
      var size = opts.size || 168, r = 62, c = size / 2, stroke = 20;
      var circ = 2 * Math.PI * r;
      var off = 0;
      var arcs = items.map(function (it) {
        var frac = Number(it.value) / total;
        var len = frac * circ;
        var seg = '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="' + (it.color || '#2f8fe8') + '" stroke-width="' + stroke + '" stroke-dasharray="' + (len - 2).toFixed(2) + ' ' + (circ - len + 2).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 ' + c + ' ' + c + ')" stroke-linecap="round"><title>' + esc(it.label) + ': ' + Math.round(frac * 100) + '%</title></circle>';
        off += len;
        return seg;
      }).join('');
      var center = '';
      if (opts.centerValue != null) {
        center = '<text x="' + c + '" y="' + (c - 2) + '" text-anchor="middle" class="donut-value">' + esc(opts.centerValue) + '</text>' +
          '<text x="' + c + '" y="' + (c + 16) + '" text-anchor="middle" class="donut-label">' + esc(opts.centerLabel || '') + '</text>';
      }
      el.innerHTML = '<svg viewBox="0 0 ' + size + ' ' + size + '" class="donut" style="width:' + size + 'px;height:' + size + 'px">' +
        '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="rgba(17,52,94,.08)" stroke-width="' + stroke + '"/>' + arcs + center + '</svg>';
    },

    legend: function (el, items) {
      if (!el) return;
      el.innerHTML = items.map(function (it) {
        return '<span class="legend__item"><i style="background:' + (it.color || '#2f8fe8') + '"></i>' + esc(it.label) +
          (it.value != null ? '<b>' + esc(it.value) + '</b>' : '') + '</span>';
      }).join('');
    },

    spark: function (el, opts) {
      if (!el) return;
      var vals = opts.values || [];
      if (!vals.length) { el.innerHTML = ''; return; }
      var W = 120, H = opts.height || 34;
      var max = Math.max.apply(null, vals), min = Math.min.apply(null, vals);
      var span = (max - min) || 1;
      var d = vals.map(function (v, i) {
        var x = (i * W) / Math.max(1, vals.length - 1);
        var y = H - 3 - ((v - min) / span) * (H - 6);
        return (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
      }).join(' ');
      el.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" class="spark"><path d="' + d + '" fill="none" stroke="' + (opts.color || '#43a83a') + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
  };

  XP.charts = Charts;
})();
