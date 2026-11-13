/* ============================================================
   XP Negocio 2026 · Calculadora
   ============================================================ */
(function () {
  'use strict';
  var F = XP.fmt;

  function mount(win) {
    var expr = '';
    var last = '';
    var justEval = false;

    win.setTitle('Calculadora');
    win.setSubtitle('Estándar · también con el teclado');

    win.content.innerHTML =
      '<div class="app"><div class="calc"><div class="calc__body">' +
        '<div class="calc__display"><div class="calc__expr" id="calc-expr">&nbsp;</div><div class="calc__value" id="calc-val">0</div></div>' +
        '<div class="calc__keys">' +
          '<button class="calc__key calc__key--fn" data-k="C">C</button>' +
          '<button class="calc__key calc__key--fn" data-k="CE">CE</button>' +
          '<button class="calc__key calc__key--fn" data-k="back">⌫</button>' +
          '<button class="calc__key calc__key--op" data-k="/">÷</button>' +
          '<button class="calc__key" data-k="7">7</button><button class="calc__key" data-k="8">8</button><button class="calc__key" data-k="9">9</button>' +
          '<button class="calc__key calc__key--op" data-k="*">×</button>' +
          '<button class="calc__key" data-k="4">4</button><button class="calc__key" data-k="5">5</button><button class="calc__key" data-k="6">6</button>' +
          '<button class="calc__key calc__key--op" data-k="-">−</button>' +
          '<button class="calc__key" data-k="1">1</button><button class="calc__key" data-k="2">2</button><button class="calc__key" data-k="3">3</button>' +
          '<button class="calc__key calc__key--op" data-k="+">+</button>' +
          '<button class="calc__key" data-k="sign">±</button><button class="calc__key" data-k="0">0</button><button class="calc__key" data-k=".">.</button>' +
          '<button class="calc__key calc__key--eq" data-k="=">=</button>' +
        '</div>' +
        '<div style="margin-top:8px;display:flex;gap:5px">' +
          '<button class="calc__key" data-k="%">%</button>' +
          '<button class="calc__key calc__key--wide" data-k="clearAll" style="flex:1">Limpiar todo</button>' +
        '</div>' +
      '</div></div></div>';

    var exprEl = win.content.querySelector('#calc-expr');
    var valEl = win.content.querySelector('#calc-val');

    function display() {
      exprEl.innerHTML = expr ? expr.replace(/\*/g, '×').replace(/\//g, '÷') : '&nbsp;';
      var preview = '';
      try {
        if (expr && /[+\-*/]/.test(expr.slice(1))) preview = String(evaluate(expr));
      } catch (e) { preview = ''; }
      if (justEval && last) { valEl.textContent = last; return; }
      valEl.textContent = preview || expr || '0';
    }

    function evaluate(str) {
      var clean = String(str).replace(/×/g, '*').replace(/÷/g, '/').replace(/[^0-9+\-*/().% ]/g, '');
      if (!clean) return 0;
      // convierte "50%" en "(50/100)"
      clean = clean.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
      var fn = new Function('"use strict"; return (' + clean + ')');
      var r = fn();
      if (typeof r !== 'number' || !isFinite(r)) throw new Error('No válido');
      return Math.round(r * 1e10) / 1e10;
    }

    function press(k) {
      XP.ui.sounds.click();
      if (k === 'C') { expr = ''; justEval = false; display(); return; }
      if (k === 'CE' || k === 'clearAll') { expr = ''; last = ''; justEval = false; display(); return; }
      if (k === 'back') { expr = expr.slice(0, -1); justEval = false; display(); return; }
      if (k === '=') {
        try {
          var r = evaluate(expr);
          last = F.num(r);
          justEval = true;
          exprEl.textContent = expr.replace(/\*/g, '×').replace(/\//g, '÷') + ' =';
          valEl.textContent = last;
          expr = String(r);
        } catch (e) {
          valEl.textContent = 'Error';
          XP.ui.sounds.error();
        }
        return;
      }
      if (k === 'sign') {
        if (!expr) { expr = '-'; }
        else if (/^-/.test(expr)) expr = expr.slice(1);
        else expr = '-' + expr;
        display(); return;
      }
      if (k === '%') { expr += '%'; display(); return; }
      if (justEval && /[0-9.]/.test(k)) { expr = ''; justEval = false; }
      if (justEval && /[+\-*/]/.test(k)) justEval = false;
      if (/[+\-*/]/.test(k) && /[+\-*/]$/.test(expr)) expr = expr.slice(0, -1);
      if (k === '.' && /\.\d*$/.test(expr)) return;
      expr += k;
      display();
    }

    win.content.querySelectorAll('[data-k]').forEach(function (b) {
      b.addEventListener('click', function () { press(b.dataset.k); });
    });

    function onKey(e) {
      if (!win.el.classList.contains('is-focused')) return;
      var k = e.key;
      if (/^[0-9]$/.test(k) || ['+', '-', '*', '/', '.', '%', '(', ')'].indexOf(k) >= 0) { e.preventDefault(); press(k); }
      else if (k === 'Enter' || k === '=') { e.preventDefault(); press('='); }
      else if (k === 'Backspace') { e.preventDefault(); press('back'); }
      else if (k === 'Escape') { e.preventDefault(); press('C'); }
      else if (k === 'Delete') { e.preventDefault(); press('CE'); }
    }
    document.addEventListener('keydown', onKey);
    win.cleanup = function () { document.removeEventListener('keydown', onKey); };

    display();
  }

  XP.wm.register({
    id: 'calculadora',
    title: 'Calculadora',
    desktopLabel: 'Calculadora',
    icon: 'calculadora',
    width: 340,
    height: 460,
    description: 'Cálculos rápidos de caja',
    mount: mount
  });
})();
