/* ============================================================
   XP Negocio 2026 · Ventas (punto de venta)
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util, F = XP.fmt, UI = XP.ui;

  var PAY_LABELS = { efectivo: 'Efectivo', transferencia: 'Transferencia', saldo: 'Saldo móvil', credito: 'A crédito' };

  function catLabel(id) {
    var c = XP.store.categories.find(function (x) { return x.id === id; });
    return c ? c.label : id;
  }
  function catColor(id) {
    var c = XP.store.categories.find(function (x) { return x.id === id; });
    return c ? c.color : '#8aa7bf';
  }

  function mount(win) {
    var cart = [];
    var filterCat = 'todos';
    var search = '';
    var payment = 'efectivo';
    var discount = 0;
    var client = '';
    var note = '';

    win.setTitle('Ventas');
    win.setSubtitle('Punto de venta · cigarros y saldo móvil');
    win.content.innerHTML =
      '<div class="app">' +
        '<div class="app__bar">' +
          '<div class="app__bar-title"><h3>Ventas</h3><p>Selecciona productos para armar el ticket</p></div>' +
          '<div class="grow"></div>' +
          '<button class="btn btn--sm" data-act="free">' + XP.icon('money', 13) + ' Venta libre</button>' +
          '<button class="btn btn--sm" data-act="refresh">' + XP.icon('refresh', 13) + '</button>' +
        '</div>' +
        '<div class="pos">' +
          '<div class="pos__left">' +
            '<div class="pos__tools">' +
              '<div class="searchbox">' + XP.icon('search', 14) + '<input id="pos-search" type="search" placeholder="Buscar producto…" autocomplete="off"></div>' +
              '<div class="cat-chips" id="pos-cats"></div>' +
              '<span class="muted small" id="pos-count"></span>' +
            '</div>' +
            '<div class="product-grid" id="pos-products"></div>' +
          '</div>' +
          '<aside class="cart">' +
            '<div class="cart__head"><h3>' + XP.icon('cart', 15) + ' Ticket <span class="cart__count" id="cart-count">0</span></h3>' +
              '<button class="icon-btn" data-act="clear" title="Vaciar ticket">' + XP.icon('trash', 14) + '</button></div>' +
            '<div class="cart__items" id="cart-items"></div>' +
            '<div class="cart__foot" id="cart-foot"></div>' +
          '</aside>' +
        '</div>' +
      '</div>';

    var productsHost = win.content.querySelector('#pos-products');
    var catsHost = win.content.querySelector('#pos-cats');
    var itemsHost = win.content.querySelector('#cart-items');
    var footHost = win.content.querySelector('#cart-foot');

    function activeProducts() {
      return XP.store.products.filter(function (p) { return !p.deletedAt && p.active; });
    }

    function renderCats() {
      var cats = [{ id: 'todos', label: 'Todos' }].concat(XP.store.categories);
      catsHost.innerHTML = cats.map(function (c) {
        return '<button class="cat-chip' + (filterCat === c.id ? ' is-active' : '') + '" data-cat="' + c.id + '">' + U.esc(c.label) + '</button>';
      }).join('');
      catsHost.querySelectorAll('[data-cat]').forEach(function (b) {
        b.addEventListener('click', function () { filterCat = b.dataset.cat; renderCats(); renderProducts(); });
      });
    }

    function renderProducts() {
      var list = activeProducts().filter(function (p) {
        if (filterCat !== 'todos' && p.category !== filterCat) return false;
        if (search && p.name.toLowerCase().indexOf(search.toLowerCase()) < 0) return false;
        return true;
      });
      win.content.querySelector('#pos-count').textContent = list.length + ' productos';
      if (!list.length) {
        productsHost.innerHTML = UI.empty('box', 'Sin productos', 'No hay productos que coincidan. Agrega productos desde Inventario.', '<button class="btn btn--sm" data-goto-inv>Ir a Inventario</button>');
        var g = productsHost.querySelector('[data-goto-inv]');
        if (g) g.addEventListener('click', function () { XP.wm.open('inventario'); });
        return;
      }
      productsHost.innerHTML = list.map(function (p) {
        var out = p.trackStock && U.num(p.stock) <= 0;
        var low = p.trackStock && U.num(p.stock) <= U.num(p.minStock);
        return '<button class="prod-card' + (out ? ' is-out' : '') + '" data-pid="' + p.id + '"' + (out ? ' disabled' : '') + '>' +
          '<span class="prod-card__cat" style="color:' + catColor(p.category) + '">' + U.esc(catLabel(p.category)) + '</span>' +
          '<span class="prod-card__name">' + U.esc(p.name) + '</span>' +
          '<span class="prod-card__add">' + XP.icon('plus', 12) + '</span>' +
          '<span class="prod-card__foot"><span class="prod-card__price">' + F.money(p.price) + '</span>' +
          '<span class="prod-card__stock' + (low ? ' low' : '') + '">' + (p.trackStock ? p.stock + ' ' + U.esc(p.unit) : 'ilimitado') + '</span></span>' +
        '</button>';
      }).join('');
      productsHost.querySelectorAll('[data-pid]').forEach(function (b) {
        b.addEventListener('click', function () { addToCart(b.dataset.pid); });
      });
    }

    function findProduct(id) {
      return XP.store.products.find(function (p) { return p.id === id; });
    }

    function addToCart(pid) {
      var p = findProduct(pid);
      if (!p) return;
      if (p.trackStock && U.num(p.stock) <= 0) { XP.toast('Sin existencias de ' + p.name, 'warning'); return; }
      var line = cart.find(function (l) { return l.productId === pid; });
      if (line) {
        if (p.trackStock && line.qty + 1 > U.num(p.stock)) { XP.toast('No hay más stock disponible', 'warning'); return; }
        line.qty++;
      } else {
        cart.push({
          productId: p.id, name: p.name, category: p.category,
          qty: 1, unitPrice: U.num(p.price), unitCost: U.num(p.cost),
          trackStock: !!p.trackStock
        });
      }
      XP.ui.sounds.click();
      renderCart();
    }

    function totals() {
      var subtotal = U.sum(cart, function (l) { return l.unitPrice * l.qty; });
      var cost = U.sum(cart, function (l) { return l.unitCost * l.qty; });
      var disc = U.clamp(Number(discount) || 0, 0, 100);
      var total = subtotal * (1 - disc / 100);
      return { subtotal: U.round(subtotal), cost: U.round(cost), total: U.round(total), profit: U.round(total - cost), discount: disc };
    }

    function renderCart() {
      var count = U.sum(cart, function (l) { return l.qty; });
      win.content.querySelector('#cart-count').textContent = count;
      if (!cart.length) {
        itemsHost.innerHTML = '<div class="cart__empty">' + XP.icon('cart', 34) + '<br>El ticket está vacío.<br>Haz clic en un producto para agregarlo.</div>';
      } else {
        itemsHost.innerHTML = cart.map(function (l, i) {
          return '<div class="cart-item">' +
            '<div class="cart-item__main"><div class="cart-item__name">' + U.esc(l.name) + '</div>' +
              '<div class="cart-item__meta">' + F.money(l.unitPrice) + ' c/u · ' + U.esc(catLabel(l.category)) + '</div>' +
              '<div class="cart-item__qty"><button class="qty-btn" data-dec="' + i + '">−</button>' +
                '<input type="number" min="1" value="' + l.qty + '" data-qty="' + i + '">' +
                '<button class="qty-btn" data-inc="' + i + '">+</button>' +
                '<button class="icon-btn icon-btn--danger" data-del="' + i + '" title="Quitar" style="width:20px;height:20px">' + XP.icon('trash', 12) + '</button></div>' +
            '</div>' +
            '<div class="cart-item__right"><span class="cart-item__price">' + F.money(l.unitPrice * l.qty) + '</span>' +
              '<small class="muted" style="font-size:calc(9px * var(--text-scale))">gan. ' + F.money((l.unitPrice - l.unitCost) * l.qty) + '</small></div>' +
          '</div>';
        }).join('');
        itemsHost.querySelectorAll('[data-inc]').forEach(function (b) { b.onclick = function () { changeQty(Number(b.dataset.inc), 1); }; });
        itemsHost.querySelectorAll('[data-dec]').forEach(function (b) { b.onclick = function () { changeQty(Number(b.dataset.dec), -1); }; });
        itemsHost.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { cart.splice(Number(b.dataset.del), 1); renderCart(); }; });
        itemsHost.querySelectorAll('[data-qty]').forEach(function (inp) {
          inp.onchange = function () {
            var i = Number(inp.dataset.qty);
            var v = Math.max(1, Math.floor(Number(inp.value) || 1));
            var l = cart[i], p = findProduct(l.productId);
            if (p && p.trackStock) v = Math.min(v, U.num(p.stock));
            l.qty = v; renderCart();
          };
        });
      }

      var t = totals();
      footHost.innerHTML =
        '<div class="cart__line"><span>Subtotal</span><strong>' + F.money(t.subtotal) + '</strong></div>' +
        '<div class="cart__line"><span>Descuento</span><span class="row" style="gap:4px"><input type="number" min="0" max="100" step="1" id="cart-disc" value="' + t.discount + '" style="width:58px;height:24px;min-height:0;padding:2px 6px;font-size:calc(11px * var(--text-scale));text-align:right"> <small class="muted">%</small></span></div>' +
        '<div class="cart__line"><span>Ganancia estimada</span><strong style="color:var(--green-600)">' + F.money(t.profit) + '</strong></div>' +
        '<div class="cart__line cart__line--total"><span>Total</span><span>' + F.money(t.total) + '</span></div>' +
        '<div class="pay-row">' + XP.store.payments.map(function (p) {
          return '<button class="pay-btn' + (payment === p.id ? ' is-active' : '') + '" data-pay="' + p.id + '">' + U.esc(p.label) + '</button>';
        }).join('') + '</div>' +
        '<input type="text" id="cart-client" placeholder="Cliente (opcional)" value="' + U.esc(client) + '" style="height:27px;min-height:0;font-size:calc(11px * var(--text-scale));padding:4px 8px">' +
        '<input type="text" id="cart-note" placeholder="Nota del ticket (opcional)" value="' + U.esc(note) + '" style="height:27px;min-height:0;font-size:calc(11px * var(--text-scale));padding:4px 8px">' +
        '<div class="cart__actions">' +
          '<button class="btn btn--sm" data-act="clear">Cancelar</button>' +
          '<button class="btn btn--success btn--sm" data-act="checkout" ' + (cart.length ? '' : 'disabled') + '>' + XP.icon('check', 13) + ' Cobrar ' + F.money(t.total) + '</button>' +
        '</div>';

      var discInput = footHost.querySelector('#cart-disc');
      discInput.addEventListener('input', function () {
        discount = U.clamp(Number(discInput.value) || 0, 0, 100);
        var tt = totals();
        var btn = footHost.querySelector('[data-act="checkout"]');
        if (btn) btn.innerHTML = XP.icon('check', 13) + ' Cobrar ' + F.money(tt.total);
        footHost.querySelectorAll('.cart__line')[0].querySelector('strong').textContent = F.money(tt.subtotal);
        footHost.querySelectorAll('.cart__line')[2].querySelector('strong').textContent = F.money(tt.profit);
        footHost.querySelector('.cart__line--total span:last-child').textContent = F.money(tt.total);
      });
      footHost.querySelector('#cart-client').addEventListener('input', function (e) { client = e.target.value; });
      footHost.querySelector('#cart-note').addEventListener('input', function (e) { note = e.target.value; });
      footHost.querySelectorAll('[data-pay]').forEach(function (b) {
        b.addEventListener('click', function () {
          payment = b.dataset.pay;
          footHost.querySelectorAll('[data-pay]').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        });
      });
      footHost.querySelectorAll('[data-act="clear"]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!cart.length) return;
          cart = []; discount = 0; client = ''; note = ''; renderCart();
        });
      });
      footHost.querySelector('[data-act="checkout"]').addEventListener('click', checkout);
    }

    function changeQty(i, delta) {
      var l = cart[i];
      if (!l) return;
      var p = findProduct(l.productId);
      var max = p && p.trackStock ? U.num(p.stock) : Infinity;
      l.qty = Math.max(0, Math.min(max, l.qty + delta));
      if (l.qty === 0) cart.splice(i, 1);
      renderCart();
    }

    async function checkout() {
      if (!cart.length) return;
      // validar stock actual
      for (var i = 0; i < cart.length; i++) {
        var l = cart[i], p = findProduct(l.productId);
        if (p && p.trackStock && U.num(p.stock) < l.qty) {
          XP.toast('Stock insuficiente de ' + p.name + ' (quedan ' + p.stock + ')', 'error');
          return;
        }
      }
      var t = totals();
      var now = new Date();
      var saleOps = cart.map(function (l) {
        return {
          kind: 'venta',
          date: U.dateTimeLocal(now),
          productId: l.productId,
          productName: l.name,
          category: l.category,
          qty: l.qty,
          unitPrice: l.unitPrice,
          unitCost: l.unitCost,
          total: U.round(l.unitPrice * l.qty * (1 - t.discount / 100)),
          cost: U.round(l.unitCost * l.qty),
          profit: U.round(l.unitPrice * l.qty * (1 - t.discount / 100) - l.unitCost * l.qty),
          payment: payment,
          client: client,
          note: note,
          discount: t.discount,
          groupId: U.uid('sale')
        };
      });
      saleOps.forEach(function (op) { XP.store.addOperation(op); });
      cart.forEach(function (l) {
        var p = findProduct(l.productId);
        if (p && p.trackStock) XP.store.adjustStock(p.id, -l.qty);
      });

      var ticket = { ops: saleOps, total: t.total, profit: t.profit, payment: payment, client: client, date: now, discount: t.discount };
      cart = []; discount = 0; client = ''; note = '';
      renderCart();
      XP.ui.sounds.success();
      XP.toast('Venta registrada por ' + F.money(t.total), 'success');
      showTicket(ticket);

      // aviso de stock bajo
      var low = XP.store.inventory().low;
      if (low.length) {
        setTimeout(function () {
          XP.toast('Stock bajo: ' + low.slice(0, 3).map(function (p) { return p.name; }).join(', '), 'warning', { duration: 4200 });
        }, 500);
      }
    }

    function ticketHTML(t) {
      var s = XP.store.settings;
      return '<div class="ticket" style="font-family:var(--font-mono);font-size:calc(12px * var(--text-scale));color:#1b2c3f">' +
        '<div style="text-align:center;margin-bottom:10px"><strong style="font-size:calc(15px * var(--text-scale));font-family:var(--font)">' + U.esc(s.businessName) + '</strong><br>' +
        '<span style="font-size:calc(10px * var(--text-scale))">' + F.dateTime(t.date) + '</span><br><span style="font-size:calc(10px * var(--text-scale))">Ticket ' + U.esc(t.ops[0].groupId.slice(-6).toUpperCase()) + '</span></div>' +
        '<div style="border-top:1px dashed #9db0c2;margin:8px 0"></div>' +
        t.ops.map(function (o) {
          return '<div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px"><span>' + o.qty + ' × ' + U.esc(o.productName) + '</span><span>' + F.money(o.total) + '</span></div>';
        }).join('') +
        '<div style="border-top:1px dashed #9db0c2;margin:8px 0"></div>' +
        (t.discount ? '<div style="display:flex;justify-content:space-between"><span>Descuento</span><span>-' + t.discount + '%</span></div>' : '') +
        '<div style="display:flex;justify-content:space-between;font-size:calc(16px * var(--text-scale));font-weight:700;margin-top:4px"><span>TOTAL</span><span>' + F.money(t.total) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;margin-top:4px"><span>Pago</span><span>' + U.esc(PAY_LABELS[t.payment] || t.payment) + '</span></div>' +
        (t.client ? '<div style="display:flex;justify-content:space-between"><span>Cliente</span><span>' + U.esc(t.client) + '</span></div>' : '') +
        '<div style="text-align:center;margin-top:12px;font-size:calc(10px * var(--text-scale))">¡Gracias por su compra!</div></div>';
    }

    function showTicket(t) {
      var html = ticketHTML(t);
      var m = UI.openModal('<div class="dialog dialog--sm"><header class="dialog__head"><span class="dialog__ico dialog__ico--info">' + XP.icon('check', 16) + '</span>' +
        '<div class="dialog__titles"><h3>Venta registrada</h3><p>' + F.money(t.total) + ' · ' + U.esc(PAY_LABELS[t.payment] || t.payment) + '</p></div></header>' +
        '<div class="dialog__body" style="background:#fff"><div style="background:#fbfdff;border:1px dashed #c3d3e2;border-radius:8px;padding:12px">' + html + '</div></div>' +
        '<footer class="dialog__foot"><button class="btn" data-act="copy">' + XP.icon('copy', 13) + ' Copiar</button>' +
        '<button class="btn" data-act="print">' + XP.icon('print', 13) + ' Imprimir</button>' +
        '<button class="btn btn--primary" data-act="close">Listo</button></footer></div>');
      var tmp = document.createElement('div');
      tmp.innerHTML = html;
      m.el.querySelector('[data-act="close"]').addEventListener('click', function () { m.close(); });
      m.el.querySelector('[data-act="copy"]').addEventListener('click', function () { UI.copy(tmp.innerText); });
      m.el.querySelector('[data-act="print"]').addEventListener('click', function () {
        var w = window.open('', '_blank', 'width=380,height=600');
        if (!w) { XP.toast('Permite las ventanas emergentes para imprimir', 'warning'); return; }
        w.document.write('<html><head><title>Ticket</title><style>body{font-family:Consolas,monospace;padding:14px;font-size:calc(12px * var(--text-scale));color:#111}</style></head><body>' + html + '</body></html>');
        w.document.close();
        setTimeout(function () { w.print(); }, 250);
      });
    }

    function freeSale() {
      UI.formDialog({
        title: 'Venta libre',
        subtitle: 'Registra una venta que no está en el inventario (recargas, combos, etc.)',
        icon: 'money',
        submitText: 'Registrar venta',
        fields: [
          { name: 'concept', label: 'Concepto', value: 'Recarga móvil', required: true, full: true },
          { name: 'price', label: 'Precio cobrado', type: 'number', step: '0.01', min: 0, required: true, prefix: XP.store.settings.currencySymbol },
          { name: 'cost', label: 'Costo', type: 'number', step: '0.01', min: 0, value: 0, prefix: XP.store.settings.currencySymbol },
          { name: 'qty', label: 'Cantidad', type: 'number', min: 1, step: '1', value: 1 },
          { name: 'payment', label: 'Método de pago', type: 'select', value: 'efectivo', options: XP.store.payments.map(function (p) { return { value: p.id, label: p.label }; }) },
          { name: 'note', label: 'Nota', full: true, placeholder: 'Opcional' }
        ],
        onSubmit: function (v) {
          var total = U.round(v.price * v.qty);
          XP.store.addOperation({
            kind: 'venta', date: U.dateTimeLocal(new Date()), productId: null,
            productName: v.concept, category: 'saldo', qty: v.qty,
            unitPrice: v.price, unitCost: v.cost, total: total,
            cost: U.round(v.cost * v.qty), profit: U.round(total - v.cost * v.qty),
            payment: v.payment, client: '', note: v.note || ''
          });
          XP.ui.sounds.success();
          XP.toast('Venta libre registrada: ' + F.money(total), 'success');
          renderProducts();
        }
      });
    }

    // Eventos base
    win.content.querySelector('#pos-search').addEventListener('input', UI.debounce(function (e) {
      search = e.target.value.trim();
      renderProducts();
    }, 160));
    win.content.querySelector('[data-act="refresh"]').addEventListener('click', function () { renderProducts(); renderCart(); });
    win.content.querySelector('[data-act="free"]').addEventListener('click', freeSale);

    win.live = true;
    win.onChange = function () { renderProducts(); };

    renderCats();
    renderProducts();
    renderCart();
    setTimeout(function () { win.content.querySelector('#pos-search').focus(); }, 120);
  }

  XP.wm.register({
    id: 'ventas',
    title: 'Ventas',
    desktopLabel: 'Ventas',
    icon: 'ventas',
    width: 980,
    height: 640,
    description: 'Punto de venta de cigarros y saldo',
    mount: mount
  });
})();
