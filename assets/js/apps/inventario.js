/* ============================================================
   XP Negocio 2026 · Inventario
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util, F = XP.fmt, UI = XP.ui;

  function catInfo(id) {
    return XP.store.categories.find(function (c) { return c.id === id; }) || { label: id, color: '#8aa7bf' };
  }

  function mount(win) {
    var filterCat = 'todos';
    var search = '';
    var sort = 'name';
    var showInactive = false;

    win.setTitle('Inventario');
    win.setSubtitle('Productos, costos, precios y existencias');
    win.content.innerHTML = '<div class="app">' +
      '<div class="app__bar">' +
        '<div class="app__bar-title"><h3>Inventario</h3><p>Controla tus productos y su rentabilidad</p></div>' +
        '<div class="grow"></div>' +
        '<button class="btn btn--sm" data-act="export">' + XP.icon('download', 13) + ' Exportar</button>' +
        '<button class="btn btn--primary btn--sm" data-act="new">' + XP.icon('plus', 13) + ' Nuevo producto</button>' +
      '</div>' +
      '<div class="app__scroll"><div class="app__grid" id="inv-body"></div></div>' +
    '</div>';

    var body = win.content.querySelector('#inv-body');

    function productStats() {
      var prods = XP.store.products.filter(function (p) { return !p.deletedAt; });
      var active = prods.filter(function (p) { return p.active; });
      var cost = 0, retail = 0, units = 0, low = 0;
      active.forEach(function (p) {
        if (!p.trackStock) return;
        cost += U.num(p.stock) * U.num(p.cost);
        retail += U.num(p.stock) * U.num(p.price);
        units += U.num(p.stock);
        if (U.num(p.stock) <= U.num(p.minStock)) low++;
      });
      return { count: active.length, cost: U.round(cost), retail: U.round(retail), units: units, low: low, profit: U.round(retail - cost) };
    }

    function render() {
      var st = productStats();
      var list = XP.store.products.filter(function (p) {
        if (!showInactive && (p.deletedAt || !p.active)) return false;
        if (filterCat !== 'todos' && p.category !== filterCat) return false;
        if (search && p.name.toLowerCase().indexOf(search.toLowerCase()) < 0) return false;
        return true;
      });
      list.sort(function (a, b) {
        if (sort === 'stock') return U.num(a.stock) - U.num(b.stock);
        if (sort === 'value') return (U.num(b.stock) * U.num(b.cost)) - (U.num(a.stock) * U.num(a.cost));
        if (sort === 'margin') return marginOf(b) - marginOf(a);
        return a.name.localeCompare(b.name);
      });

      body.innerHTML =
        '<section class="stats">' +
          UI.stat({ icon: 'box', label: 'Productos activos', value: F.int(st.count), sub: st.units + ' unidades en stock' }) +
          UI.stat({ icon: 'wallet', label: 'Invertido en inventario', value: F.money(st.cost), sub: 'a precio de costo', tone: 'amber' }) +
          UI.stat({ icon: 'tag', label: 'Valor de venta', value: F.money(st.retail), sub: 'si se vende todo', tone: 'green' }) +
          UI.stat({ icon: 'trending', label: 'Ganancia potencial', value: F.money(st.profit), sub: st.retail > 0 ? 'margen ' + F.pct((st.profit / st.retail) * 100) : '—', tone: 'violet' }) +
          UI.stat({ icon: 'alert', label: 'Stock bajo', value: F.int(st.low), sub: 'productos por reponer', tone: st.low ? 'red' : 'green' }) +
        '</section>' +

        '<section class="panel">' +
          '<div class="panel__head" style="gap:8px;flex-wrap:wrap">' +
            '<span class="panel__title">' + XP.icon('list', 14) + ' Productos <small>' + list.length + ' registros</small></span>' +
            '<div class="filters" style="margin-left:auto">' +
              '<div class="searchbox">' + XP.icon('search', 13) + '<input id="inv-search" type="search" placeholder="Buscar…" value="' + U.esc(search) + '"></div>' +
              '<select id="inv-cat"><option value="todos">Todas las categorías</option>' +
                XP.store.categories.map(function (c) { return '<option value="' + c.id + '"' + (filterCat === c.id ? ' selected' : '') + '>' + U.esc(c.label) + '</option>'; }).join('') +
              '</select>' +
              '<select id="inv-sort">' +
                [['name', 'Nombre'], ['stock', 'Menor stock'], ['value', 'Mayor valor'], ['margin', 'Mayor margen']].map(function (o) {
                  return '<option value="' + o[0] + '"' + (sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
                }).join('') +
              '</select>' +
              '<label class="check" style="font-size:calc(10.5px * var(--text-scale))"><input type="checkbox" id="inv-inactive"' + (showInactive ? ' checked' : '') + '> Incluir inactivos</label>' +
            '</div>' +
          '</div>' +
          '<div class="panel__body panel__body--flush">' + table(list) + '</div>' +
          '<div class="panel__foot"><span>' + XP.icon('info', 12) + ' Los productos de saldo móvil no descuentan stock.</span>' +
            '<span>Margen promedio: <strong>' + avgMargin(list) + '</strong></span></div>' +
        '</section>';

      // eventos
      body.querySelector('#inv-search').addEventListener('input', UI.debounce(function (e) { search = e.target.value.trim(); render(); }, 180));
      body.querySelector('#inv-cat').addEventListener('change', function (e) { filterCat = e.target.value; render(); });
      body.querySelector('#inv-sort').addEventListener('change', function (e) { sort = e.target.value; render(); });
      body.querySelector('#inv-inactive').addEventListener('change', function (e) { showInactive = e.target.checked; render(); });
      body.querySelectorAll('[data-edit]').forEach(function (b) { b.addEventListener('click', function () { editProduct(b.dataset.edit); }); });
      body.querySelectorAll('[data-stock]').forEach(function (b) { b.addEventListener('click', function () { adjustStock(b.dataset.stock); }); });
      body.querySelectorAll('[data-del]').forEach(function (b) { b.addEventListener('click', function () { removeProduct(b.dataset.del); }); });
      body.querySelectorAll('[data-restore]').forEach(function (b) { b.addEventListener('click', function () { XP.store.restoreProduct(b.dataset.restore); XP.toast('Producto restaurado', 'success'); render(); }); });
      var inlineNew = body.querySelector('[data-new-inline]');
      if (inlineNew) inlineNew.addEventListener('click', newProduct);
    }

    function marginOf(p) {
      var price = U.num(p.price), cost = U.num(p.cost);
      return price > 0 ? ((price - cost) / price) * 100 : 0;
    }
    function avgMargin(list) {
      if (!list.length) return '—';
      var m = list.reduce(function (a, p) { return a + marginOf(p); }, 0) / list.length;
      return F.pct(m);
    }

    function table(list) {
      if (!list.length) {
        return UI.empty('box', 'Sin productos', 'Agrega tu primer producto para empezar a vender.', '<button class="btn btn--primary btn--sm" data-new-inline>Nuevo producto</button>');
      }
      var rows = list.map(function (p) {
        var cat = catInfo(p.category);
        var low = p.trackStock && U.num(p.stock) <= U.num(p.minStock);
        var margin = marginOf(p);
        var inactive = p.deletedAt || !p.active;
        return '<tr' + (inactive ? ' style="opacity:.55"' : '') + '>' +
          '<td><div class="row" style="gap:7px"><span class="cat-dot" style="background:' + cat.color + '"></span>' +
            '<div><div class="strong" style="font-size:calc(12px * var(--text-scale))">' + U.esc(p.name) + (inactive ? ' <span class="badge badge--grey">Inactivo</span>' : '') + '</div>' +
            '<small class="muted">' + U.esc(cat.label) + ' · ' + U.esc(p.unit || 'ud') + '</small></div></div></td>' +
          '<td class="right">' + F.money(p.cost) + '</td>' +
          '<td class="right strong">' + F.money(p.price) + '</td>' +
          '<td class="right"><span class="badge ' + (margin >= 40 ? 'badge--green' : margin >= 20 ? '' : 'badge--amber') + '">' + F.pct(margin) + '</span></td>' +
          '<td class="right"><span class="stock-pill ' + (low ? 'low' : 'ok') + '">' + (p.trackStock ? F.num(p.stock) + ' ' + U.esc(p.unit) : '∞') + '</span>' +
            (p.trackStock ? '<br><small class="muted">mín. ' + p.minStock + '</small>' : '') + '</td>' +
          '<td class="right muted">' + (p.trackStock ? F.money(U.num(p.stock) * U.num(p.cost)) : '—') + '</td>' +
          '<td><div class="row-actions">' +
            (inactive ? '<button class="icon-btn icon-btn--ok" data-restore="' + p.id + '" title="Restaurar">' + XP.icon('restore', 14) + '</button>' :
              '<button class="icon-btn" data-stock="' + p.id + '" title="Ajustar stock">' + XP.icon('box', 14) + '</button>' +
              '<button class="icon-btn" data-edit="' + p.id + '" title="Editar">' + XP.icon('edit', 14) + '</button>' +
              '<button class="icon-btn icon-btn--danger" data-del="' + p.id + '" title="Eliminar">' + XP.icon('trash', 14) + '</button>') +
          '</div></td></tr>';
      }).join('');
      return '<div class="table-wrap" style="border:0;border-radius:0"><table class="data-table"><thead><tr>' +
        '<th>Producto</th><th class="right">Costo</th><th class="right">Precio</th><th class="right">Margen</th><th class="right">Stock</th><th class="right">Valor</th><th></th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>';
    }

    function productFields(p) {
      p = p || {};
      return [
        { name: 'name', label: 'Nombre del producto', value: p.name || '', required: true, full: true, placeholder: 'Ej. Cohiba Siglo I' },
        { name: 'category', label: 'Categoría', type: 'select', value: p.category || 'cigarros', options: XP.store.categories.map(function (c) { return { value: c.id, label: c.label }; }) },
        { name: 'unit', label: 'Unidad', value: p.unit || 'ud', placeholder: 'ud, caja, recarga…' },
        { name: 'cost', label: 'Costo', type: 'number', step: '0.01', min: 0, value: p.cost != null ? p.cost : '', required: true, prefix: XP.store.settings.currencySymbol, hint: 'Lo que pagas al proveedor' },
        { name: 'price', label: 'Precio de venta', type: 'number', step: '0.01', min: 0, value: p.price != null ? p.price : '', required: true, prefix: XP.store.settings.currencySymbol, hint: 'Lo que cobras al cliente' },
        { name: 'stock', label: 'Stock actual', type: 'number', step: '1', min: 0, value: p.stock != null ? p.stock : 0, hint: 'Solo aplica a productos con existencias' },
        { name: 'minStock', label: 'Stock mínimo', type: 'number', step: '1', min: 0, value: p.minStock != null ? p.minStock : XP.store.settings.minStock, hint: 'Aviso de reposición' },
        { name: 'trackStock', label: 'Controlar existencias', type: 'checkbox', value: p.trackStock !== false, checkboxLabel: 'Descontar del inventario al vender', full: true }
      ];
    }

    function validateMargin(v) {
      if (U.num(v.price) < U.num(v.cost)) {
        throw new Error('El precio de venta no debería ser menor que el costo.');
      }
    }

    function newProduct() {
      UI.formDialog({
        title: 'Nuevo producto', subtitle: 'Agrega un producto a tu catálogo', icon: 'box', submitText: 'Crear producto',
        fields: productFields(),
        onSubmit: function (v) {
          validateMargin(v);
          XP.store.addProduct({
            name: v.name, category: v.category, unit: v.unit || 'ud',
            cost: U.round(v.cost), price: U.round(v.price),
            stock: U.round(v.stock || 0), minStock: U.round(v.minStock || 0),
            trackStock: v.category === 'saldo' ? false : !!v.trackStock
          });
          XP.ui.sounds.success();
          XP.toast('Producto creado: ' + v.name, 'success');
          render();
        }
      });
    }

    function editProduct(id) {
      var p = XP.store.products.find(function (x) { return x.id === id; });
      if (!p) return;
      UI.formDialog({
        title: 'Editar producto', subtitle: p.name, icon: 'box', submitText: 'Guardar cambios',
        fields: productFields(p),
        onSubmit: function (v) {
          validateMargin(v);
          XP.store.updateProduct(id, {
            name: v.name, category: v.category, unit: v.unit || 'ud',
            cost: U.round(v.cost), price: U.round(v.price),
            stock: U.round(v.stock || 0), minStock: U.round(v.minStock || 0),
            trackStock: v.category === 'saldo' ? false : !!v.trackStock
          });
          XP.ui.sounds.success();
          XP.toast('Producto actualizado', 'success');
          render();
        }
      });
    }

    function adjustStock(id) {
      var p = XP.store.products.find(function (x) { return x.id === id; });
      if (!p) return;
      if (!p.trackStock) { XP.toast('Este producto no controla existencias', 'info'); return; }
      UI.formDialog({
        title: 'Ajustar stock', subtitle: p.name + ' · actual: ' + p.stock + ' ' + p.unit, icon: 'box', submitText: 'Guardar',
        fields: [
          { name: 'qty', label: 'Cantidad a sumar o restar', type: 'number', step: '1', value: 0, required: true, full: true, hint: 'Usa números negativos para descontar (ej. -2)' },
          { name: 'reason', label: 'Motivo', type: 'select', value: 'compra', full: true, options: [
            { value: 'compra', label: 'Compra a proveedor' }, { value: 'ajuste', label: 'Ajuste de conteo' },
            { value: 'merma', label: 'Merma o pérdida' }, { value: 'devolucion', label: 'Devolución' }
          ] }
        ],
        onSubmit: function (v) {
          var next = U.num(p.stock) + U.num(v.qty);
          if (next < 0) throw new Error('El stock no puede quedar negativo.');
          XP.store.updateProduct(id, { stock: U.round(next) });
          XP.ui.sounds.success();
          XP.toast('Stock actualizado: ' + next + ' ' + p.unit, 'success');
          render();
        }
      });
    }

    async function removeProduct(id) {
      var p = XP.store.products.find(function (x) { return x.id === id; });
      if (!p) return;
      var ok = await UI.confirm({
        title: 'Eliminar producto',
        message: '¿Enviar "' + p.name + '" a la papelera de reciclaje? Las ventas ya registradas se conservan.',
        confirmText: 'Eliminar', danger: true
      });
      if (!ok) return;
      XP.store.deleteProduct(id);
      XP.toast('Producto enviado a la papelera', 'info');
      render();
    }

    function exportCSV() {
      var list = XP.store.products.filter(function (p) { return !p.deletedAt; });
      var rows = [['Producto', 'Categoría', 'Costo', 'Precio', 'Margen %', 'Stock', 'Stock mínimo', 'Unidad', 'Valor inventario']];
      list.forEach(function (p) {
        rows.push([p.name, catInfo(p.category).label, p.cost, p.price, marginOf(p).toFixed(1), p.trackStock ? p.stock : '', p.minStock, p.unit, p.trackStock ? U.round(p.stock * p.cost) : '']);
      });
      UI.csv('inventario-' + U.dateKey(new Date()) + '.csv', rows);
      XP.toast('Inventario exportado', 'success');
    }

    win.content.querySelector('[data-act="new"]').addEventListener('click', newProduct);
    win.content.querySelector('[data-act="export"]').addEventListener('click', exportCSV);

    win.live = true;
    win.onChange = render;
    render();
  }

  XP.wm.register({
    id: 'inventario',
    title: 'Inventario',
    desktopLabel: 'Inventario',
    icon: 'inventario',
    width: 1000,
    height: 620,
    description: 'Productos, stock y precios',
    mount: mount
  });
})();
