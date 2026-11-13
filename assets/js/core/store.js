/* ============================================================
   XP Negocio 2026 · Núcleo de datos
   Estado, persistencia (localStorage / JSON en servidor),
   métricas, rangos de fechas y utilidades.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'xp-negocio:data:v1';
  var SESSION_KEY = 'xp-negocio:session';
  var REMEMBER_KEY = 'xp-negocio:remember';
  var API = 'api.php';

  /* ------------------------------ Utilidades ------------------------------ */
  var U = {
    uid: function (prefix) {
      return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    },
    round: function (n, d) {
      var f = Math.pow(10, d == null ? 2 : d);
      return Math.round((Number(n) || 0) * f) / f;
    },
    num: function (n) { return Number(n) || 0; },
    sum: function (arr, fn) { return arr.reduce(function (a, b) { return a + (Number(fn ? fn(b) : b) || 0); }, 0); },
    clamp: function (n, min, max) { return Math.min(max, Math.max(min, n)); },
    pad: function (n) { return String(n).padStart(2, '0'); },
    dateKey: function (d) { return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()); },
    dateTimeLocal: function (d) { return U.dateKey(d) + 'T' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()); },
    parse: function (iso) { var d = new Date(iso); return isNaN(d) ? new Date() : d; },
    startOfDay: function (d) { var x = new Date(d); x.setHours(0, 0, 0, 0); return x; },
    endOfDay: function (d) { var x = new Date(d); x.setHours(23, 59, 59, 999); return x; },
    addDays: function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; },
    addMonths: function (d, n) { var x = new Date(d); x.setMonth(x.getMonth() + n); return x; },
    startOfWeek: function (d) {
      var x = U.startOfDay(d);
      var day = (x.getDay() + 6) % 7; // lunes = 0
      return U.addDays(x, -day);
    },
    startOfMonth: function (d) { return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0); },
    endOfMonth: function (d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999); },
    daysBetween: function (a, b) { return Math.round((U.startOfDay(b) - U.startOfDay(a)) / 86400000); },
    deep: function (o) { return JSON.parse(JSON.stringify(o)); },
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    slug: function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  };

  /* ------------------------------ Rangos ------------------------------ */
  var MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  var Ranges = {
    MONTHS: MONTHS, MONTHS_SHORT: MONTHS_SHORT, DAYS: DAYS,
    presets: function () {
      return [
        { id: 'hoy', label: 'Hoy' },
        { id: 'ayer', label: 'Ayer' },
        { id: 'semana', label: 'Esta semana' },
        { id: 'mes', label: 'Este mes' },
        { id: 'mesAnterior', label: 'Mes anterior' },
        { id: '30d', label: 'Últimos 30 días' },
        { id: 'año', label: 'Este año' },
        { id: 'todo', label: 'Todo el historial' }
      ];
    },
    get: function (id, now) {
      var n = now ? new Date(now) : new Date();
      var from, to, label;
      switch (id) {
        case 'ayer':
          from = U.startOfDay(U.addDays(n, -1)); to = U.endOfDay(U.addDays(n, -1)); label = 'Ayer';
          break;
        case 'semana':
          from = U.startOfWeek(n); to = U.endOfDay(n); label = 'Esta semana';
          break;
        case 'mes':
          from = U.startOfMonth(n); to = U.endOfDay(n); label = MONTHS[n.getMonth()].charAt(0).toUpperCase() + MONTHS[n.getMonth()].slice(1) + ' ' + n.getFullYear();
          break;
        case 'mesAnterior':
          var pm = U.addMonths(n, -1);
          from = U.startOfMonth(pm); to = U.endOfMonth(pm); label = MONTHS[pm.getMonth()].charAt(0).toUpperCase() + MONTHS[pm.getMonth()].slice(1) + ' ' + pm.getFullYear();
          break;
        case '30d':
          from = U.startOfDay(U.addDays(n, -29)); to = U.endOfDay(n); label = 'Últimos 30 días';
          break;
        case 'año':
          from = new Date(n.getFullYear(), 0, 1); to = U.endOfDay(n); label = 'Año ' + n.getFullYear();
          break;
        case 'todo':
          from = new Date(2000, 0, 1); to = U.endOfDay(n); label = 'Todo el historial';
          break;
        case 'hoy':
        default:
          from = U.startOfDay(n); to = U.endOfDay(n); label = 'Hoy';
      }
      var span = Math.max(1, U.daysBetween(from, to) + 1);
      var prevTo = U.endOfDay(U.addDays(from, -1));
      var prevFrom = U.startOfDay(U.addDays(prevTo, -(span - 1)));
      return { id: id || 'hoy', from: from, to: to, label: label, prev: { from: prevFrom, to: prevTo } };
    },
    format: function (d) { return U.pad(d.getDate()) + '/' + U.pad(d.getMonth() + 1) + '/' + d.getFullYear(); },
    formatShort: function (d) { return U.pad(d.getDate()) + ' ' + MONTHS_SHORT[d.getMonth()]; },
    monthName: function (m) { return MONTHS[m]; },
    months: function (m) { return MONTHS[m] || ''; }
  };

  /* ------------------------------ Datos iniciales ------------------------------ */
  var PRODUCT_SEED = [
    { name: 'Cohiba Siglo I', category: 'cigarros', cost: 900, price: 1300, stock: 24, minStock: 6, unit: 'ud' },
    { name: 'Montecristo No. 4', category: 'cigarros', cost: 700, price: 1000, stock: 38, minStock: 8, unit: 'ud' },
    { name: 'Partagás Serie D No. 4', category: 'cigarros', cost: 850, price: 1200, stock: 16, minStock: 6, unit: 'ud' },
    { name: 'Romeo y Julieta Mille Fleurs', category: 'cigarros', cost: 600, price: 900, stock: 30, minStock: 6, unit: 'ud' },
    { name: 'H. Upmann Regalías', category: 'cigarros', cost: 650, price: 950, stock: 21, minStock: 6, unit: 'ud' },
    { name: 'Guantanamera Puritos', category: 'cigarros', cost: 180, price: 300, stock: 58, minStock: 12, unit: 'ud' },
    { name: 'Popular (cajetilla)', category: 'cigarros', cost: 25, price: 45, stock: 180, minStock: 30, unit: 'ud' },
    { name: 'Selectos (cajetilla)', category: 'cigarros', cost: 30, price: 55, stock: 140, minStock: 30, unit: 'ud' },
    { name: 'Recarga móvil 100', category: 'saldo', cost: 90, price: 110, stock: 0, minStock: 0, unit: 'recarga' },
    { name: 'Recarga móvil 250', category: 'saldo', cost: 225, price: 265, stock: 0, minStock: 0, unit: 'recarga' },
    { name: 'Recarga móvil 500', category: 'saldo', cost: 450, price: 525, stock: 0, minStock: 0, unit: 'recarga' },
    { name: 'Recarga móvil 1000', category: 'saldo', cost: 900, price: 1030, stock: 0, minStock: 0, unit: 'recarga' },
    { name: 'Encendedor', category: 'otros', cost: 60, price: 120, stock: 32, minStock: 8, unit: 'ud' }
  ];

  var PAYMENTS = [
    { id: 'efectivo', label: 'Efectivo' },
    { id: 'transferencia', label: 'Transferencia' },
    { id: 'saldo', label: 'Saldo móvil' },
    { id: 'credito', label: 'A crédito' }
  ];

  var CATEGORIES = [
    { id: 'cigarros', label: 'Cigarros', color: '#e0872c' },
    { id: 'saldo', label: 'Saldo móvil', color: '#2f8fe8' },
    { id: 'otros', label: 'Otros', color: '#43a83a' }
  ];

  var EXPENSE_CATS = [
    { id: 'mercancia', label: 'Compra de mercancía' },
    { id: 'transporte', label: 'Transporte' },
    { id: 'alquiler', label: 'Alquiler' },
    { id: 'servicios', label: 'Servicios (luz, agua, internet)' },
    { id: 'personal', label: 'Personal' },
    { id: 'impuestos', label: 'Impuestos' },
    { id: 'otros', label: 'Otros gastos' }
  ];

  function buildDemo() {
    var products = PRODUCT_SEED.map(function (p, i) {
      return {
        id: 'prd_' + (i + 1),
        name: p.name, category: p.category, cost: p.cost, price: p.price,
        stock: p.stock, minStock: p.minStock, unit: p.unit,
        trackStock: p.category !== 'saldo',
        active: true, demo: true,
        createdAt: new Date(Date.now() - 50 * 864e5).toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    var ops = [];
    var now = new Date();
    var start = U.startOfDay(U.addDays(now, -44));
    var seq = 0;

    function push(o) { o.id = 'op_' + (++seq) + '_' + Math.random().toString(36).slice(2, 6); o.demo = true; ops.push(o); }

    push({ kind: 'inversion', date: U.dateTimeLocal(new Date(start.getTime() + 9 * 36e5)), direction: 'aporte', amount: 25000, source: 'Capital inicial', note: 'Inversión inicial para arrancar el negocio' });
    push({ kind: 'inversion', date: U.dateTimeLocal(new Date(U.addDays(now, -22).setHours(10, 30))), direction: 'aporte', amount: 12000, source: 'Ahorro personal', note: 'Reposición de mercancía' });
    push({ kind: 'inversion', date: U.dateTimeLocal(new Date(U.addDays(now, -9).setHours(17, 15))), direction: 'retiro', amount: 4000, source: 'Retiro', note: 'Retiro para gastos personales' });

    for (var d = 0; d <= 44; d++) {
      var day = U.addDays(start, d);
      var dow = day.getDay();
      var salesCount = dow === 0 ? 3 + Math.floor(Math.random() * 3) : 4 + Math.floor(Math.random() * 6);
      for (var s = 0; s < salesCount; s++) {
        var prod = products[Math.floor(Math.random() * products.length)];
        var hour = 8 + Math.floor(Math.random() * 12);
        var minute = Math.floor(Math.random() * 60);
        var qty = prod.category === 'saldo' ? 1 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 4);
        var price = prod.price;
        var cost = prod.cost;
        var total = U.round(price * qty);
        push({
          kind: 'venta',
          date: U.dateTimeLocal(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute)),
          productId: prod.id, productName: prod.name, category: prod.category,
          qty: qty, unitPrice: price, unitCost: cost,
          total: total, cost: U.round(cost * qty), profit: U.round(total - cost * qty),
          payment: prod.category === 'saldo' ? 'saldo' : (Math.random() < 0.75 ? 'efectivo' : 'transferencia'),
          client: '', note: '', createdAt: new Date().toISOString()
        });
      }
      if (d % 7 === 3) {
        push({
          kind: 'gasto',
          date: U.dateTimeLocal(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12, 0)),
          concept: 'Transporte de mercancía', category: 'transporte',
          amount: 350 + Math.floor(Math.random() * 4) * 100,
          note: 'Traslado desde el proveedor', createdAt: new Date().toISOString()
        });
      }
      if (d === 20) {
        push({ kind: 'gasto', date: U.dateTimeLocal(new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 30)), concept: 'Pago de electricidad', category: 'servicios', amount: 1200, note: 'Factura del mes', createdAt: new Date().toISOString() });
      }
    }

    return { products: products, operations: ops };
  }

  function defaultSettings() {
    return {
      businessName: 'Mi Negocio',
      ownerName: 'Administrador',
      currency: 'CUP',
      currencySymbol: '$',
      defaultMargin: 35,
      minStock: 5,
      monthlyGoal: 50000,
      theme: 'bliss',
      animations: true,
      sounds: true,
      clock24: false,
      showWidgets: true,
      weatherTemp: 24,
      weatherText: 'Soleado',
      weatherIcon: 'sun',
      storage: 'local',
      demoData: true,
      lastBackup: null,
      showWelcome: true,
      lockTimeout: 0,
      /* Pantalla: escala de la interfaz (todo) y del texto (solo letras), en %. */
      uiScale: 100,
      textScale: 100,
      /* Ventanas e iconos: recuerdan su sitio entre sesiones. */
      rememberWindows: true,
      windowState: {},
      rememberIcons: true,
      iconSnap: true,
      iconPos: {}
    };
  }

  var UI_SCALE_MIN = 80, UI_SCALE_MAX = 160, TEXT_SCALE_MIN = 80, TEXT_SCALE_MAX = 150;

  function scaleValue(n, min, max, fallback) {
    var v = Math.round(U.num(n));
    if (!v) v = fallback;
    return U.clamp(v, min, max);
  }

  var state = null;
  var FALLBACK_SETTINGS = defaultSettings();
  var listeners = [];
  var saveTimer = null;
  var serverAvailable = false;
  var readyResolve, readyPromise = new Promise(function (r) { readyResolve = r; });

  function normalize(raw) {
    var base = { version: 1, settings: defaultSettings(), auth: null, products: [], operations: [], notes: [], meta: {} };
    var s = Object.assign(base, raw || {});
    s.settings = Object.assign(defaultSettings(), (raw && raw.settings) || {});
    s.products = Array.isArray(s.products) ? s.products : [];
    s.operations = Array.isArray(s.operations) ? s.operations : [];
    s.notes = Array.isArray(s.notes) ? s.notes : [];
    s.meta = s.meta || {};
    s.products.forEach(function (p) {
      /* Categoría siempre válida: un JSON importado o antiguo puede traerla vacía. */
      if (!CATEGORIES.some(function (c) { return c.id === p.category; })) p.category = 'otros';
      p.trackStock = p.category === 'saldo' ? false : (p.trackStock !== false);
      p.minStock = U.num(p.minStock);
      p.active = p.active !== false;
    });
    s.operations.forEach(function (o) {
      if (o.category && !CATEGORIES.some(function (c) { return c.id === o.category; })) o.category = 'otros';
    });
    if (!s.settings.currencySymbol) s.settings.currencySymbol = '$';
    /* Escalas saneadas: un JSON viejo o manipulado no debe romper el zoom. */
    s.settings.uiScale = scaleValue(s.settings.uiScale, UI_SCALE_MIN, UI_SCALE_MAX, 100);
    s.settings.textScale = scaleValue(s.settings.textScale, TEXT_SCALE_MIN, TEXT_SCALE_MAX, 100);
    s.settings.rememberWindows = s.settings.rememberWindows !== false;
    s.settings.rememberIcons = s.settings.rememberIcons !== false;
    s.settings.iconSnap = s.settings.iconSnap !== false;
    s.settings.windowState = (s.settings.windowState && typeof s.settings.windowState === 'object' && !Array.isArray(s.settings.windowState)) ? s.settings.windowState : {};
    Object.keys(s.settings.windowState).forEach(function (k) {
      var g = s.settings.windowState[k];
      if (!g || typeof g !== 'object') { delete s.settings.windowState[k]; return; }
      var w = U.num(g.w), h = U.num(g.h);
      if (!(w >= 240 && h >= 180)) { delete s.settings.windowState[k]; return; }
      s.settings.windowState[k] = { x: Math.round(U.num(g.x)), y: Math.round(U.num(g.y)), w: Math.round(w), h: Math.round(h), max: !!g.max };
    });
    s.settings.iconPos = (s.settings.iconPos && typeof s.settings.iconPos === 'object' && !Array.isArray(s.settings.iconPos)) ? s.settings.iconPos : {};
    Object.keys(s.settings.iconPos).forEach(function (k) {
      var p = s.settings.iconPos[k];
      if (!p || typeof p !== 'object' || p.x == null || p.y == null) { delete s.settings.iconPos[k]; return; }
      s.settings.iconPos[k] = { x: Math.round(U.num(p.x)), y: Math.round(U.num(p.y)) };
    });
    return s;
  }

  /* ------------------------------ Hash de contraseña ------------------------------ */
  function fallbackHash(str) {
    var h1 = 0x811c9dc5, h2 = 0x1000193;
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      h1 = (h1 ^ c) * 16777619 >>> 0;
      h2 = ((h2 << 5) + h2 + c) >>> 0;
    }
    return 'fb' + h1.toString(16) + h2.toString(16);
  }

  var Auth = {
    hash: async function (password, salt) {
      var data = String(salt || '') + '::' + String(password || '');
      try {
        if (window.crypto && crypto.subtle && window.TextEncoder) {
          var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
          return Array.prototype.map.call(new Uint8Array(buf), function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        }
      } catch (e) { /* fallback */ }
      return fallbackHash(data);
    },
    randomSalt: function () {
      var a = new Uint8Array(12);
      if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
      else for (var i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
      return Array.prototype.map.call(a, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    },
    check: async function (password) {
      if (!state.auth) return password === 'admin';
      var h = await Auth.hash(password, state.auth.salt);
      return h === state.auth.hash;
    },
    login: async function (user, password) {
      if (!state.auth) return false;
      if (String(user || '').trim().toLowerCase() !== String(state.auth.username).toLowerCase()) return false;
      return Auth.check(password);
    },
    setPassword: async function (password) {
      var salt = Auth.randomSalt();
      state.auth.salt = salt;
      state.auth.hash = await Auth.hash(password, salt);
      state.auth.changedAt = new Date().toISOString();
      Store.save();
    },
    setUsername: function (user) {
      state.auth.username = String(user || '').trim() || 'admin';
      Store.save();
    }
  };

  /* ------------------------------ Persistencia ------------------------------ */
  function readLocal() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeLocal(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('No se pudo guardar en localStorage', e);
      return false;
    }
  }

  function api(action, payload, method) {
    var opts = {
      method: method || (payload ? 'POST' : 'GET'),
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    };
    if (payload) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(payload);
    }
    return fetch(API + '?action=' + encodeURIComponent(action), opts).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (json) {
      if (!json || json.ok === false) throw new Error((json && json.error) || 'Respuesta inválida');
      return json;
    });
  }

  var Store = {
    util: U,
    ranges: Ranges,
    auth: Auth,
    payments: PAYMENTS,
    categories: CATEGORIES,
    expenseCats: EXPENSE_CATS,
    ready: readyPromise,

    get state() { return state; },
    /* Seguros antes de init(): el arranque (tema, animaciones) los consulta
       mientras la carga asíncrona todavía no ha resuelto. */
    get settings() { return state ? state.settings : FALLBACK_SETTINGS; },
    get products() { return state ? state.products : []; },
    get operations() { return state ? state.operations : []; },
    get notes() { return state ? state.notes : []; },
    get serverAvailable() { return serverAvailable; },

    init: async function () {
      var raw = readLocal();
      if (raw) {
        state = normalize(raw);
      } else {
        state = normalize({});
        var salt = Auth.randomSalt();
        state.auth = {
          username: 'admin',
          displayName: 'Administrador',
          salt: salt,
          hash: await Auth.hash('admin', salt),
          hint: 'admin',
          createdAt: new Date().toISOString(),
          changedAt: null
        };
        var demo = buildDemo();
        state.products = demo.products;
        state.operations = demo.operations;
        state.notes = [{
          id: U.uid('note'),
          title: 'Bienvenido a XP Negocio 2026',
          body: 'Este es tu bloc de notas. Aquí puedes guardar recordatorios, contactos de proveedores o cualquier detalle del negocio.\n\nConsejos rápidos:\n• Doble clic en un icono del escritorio para abrir su ventana.\n• Arrastra las ventanas por la barra de título.\n• En Panel de control puedes cambiar tu usuario y contraseña, la moneda y los respaldos.\n• Los datos se guardan automáticamente en este equipo.',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
        state.meta = { createdAt: new Date().toISOString(), lastSavedAt: null, revision: 1 };
        writeLocal(state);
      }

      if (state.settings.storage === 'server') {
        try {
          var ping = await api('ping');
          serverAvailable = true;
          var remote = await api('load');
          if (remote && remote.data) state = normalize(remote.data);
        } catch (e) {
          serverAvailable = false;
          state.settings.storage = 'local';
        }
      }

      state.meta = state.meta || {};
      readyResolve(state);
      return state;
    },

    save: function (immediate) {
      if (!state) return;
      state.meta.lastSavedAt = new Date().toISOString();
      state.meta.revision = (state.meta.revision || 1) + 1;
      writeLocal(state);
      if (saveTimer) clearTimeout(saveTimer);
      var persist = function () {
        if (state.settings.storage === 'server' && serverAvailable) {
          api('save', { data: state }).then(function (res) {
            serverAvailable = true;
            Store.emit('saved', res);
          }).catch(function () {
            serverAvailable = false;
            Store.emit('server-error', null);
          });
        }
        Store.emit('saved', { local: true });
      };
      if (immediate) persist(); else saveTimer = setTimeout(persist, 250);
      Store.emit('change', state);
    },

    on: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (l) { return l !== fn; }); }; },
    emit: function (evt, payload) { listeners.forEach(function (fn) { try { fn(evt, payload); } catch (e) { console.error(e); } }); },

    /* --------------------------- Operaciones --------------------------- */
    addOperation: function (op) {
      op.id = op.id || U.uid('op');
      op.createdAt = op.createdAt || new Date().toISOString();
      state.operations.push(op);
      Store.save();
      return op;
    },
    updateOperation: function (id, patch) {
      var op = state.operations.find(function (o) { return o.id === id; });
      if (!op) return null;
      Object.assign(op, patch, { updatedAt: new Date().toISOString() });
      Store.save();
      return op;
    },
    deleteOperation: function (id) {
      var op = state.operations.find(function (o) { return o.id === id; });
      if (!op) return false;
      op.deletedAt = new Date().toISOString();
      Store.save();
      return true;
    },
    restoreOperation: function (id) {
      var op = state.operations.find(function (o) { return o.id === id; });
      if (!op) return false;
      delete op.deletedAt;
      Store.save();
      return true;
    },
    purgeOperation: function (id) {
      state.operations = state.operations.filter(function (o) { return o.id !== id; });
      Store.save();
    },

    /* --------------------------- Productos --------------------------- */
    addProduct: function (p) {
      p.id = p.id || U.uid('prd');
      p.createdAt = new Date().toISOString();
      p.updatedAt = p.createdAt;
      p.active = p.active !== false;
      p.trackStock = p.category === 'saldo' ? false : (p.trackStock !== false);
      state.products.push(p);
      Store.save();
      return p;
    },
    updateProduct: function (id, patch) {
      var p = state.products.find(function (x) { return x.id === id; });
      if (!p) return null;
      Object.assign(p, patch, { updatedAt: new Date().toISOString() });
      if (p.category === 'saldo') p.trackStock = false;
      Store.save();
      return p;
    },
    deleteProduct: function (id) {
      var p = state.products.find(function (x) { return x.id === id; });
      if (!p) return false;
      p.deletedAt = new Date().toISOString();
      Store.save();
      return true;
    },
    restoreProduct: function (id) {
      var p = state.products.find(function (x) { return x.id === id; });
      if (!p) return false;
      delete p.deletedAt;
      Store.save();
      return true;
    },
    purgeProduct: function (id) {
      state.products = state.products.filter(function (x) { return x.id !== id; });
      Store.save();
    },
    adjustStock: function (id, delta) {
      var p = state.products.find(function (x) { return x.id === id; });
      if (!p || !p.trackStock) return null;
      p.stock = U.round(Math.max(0, U.num(p.stock) + U.num(delta)), 2);
      p.updatedAt = new Date().toISOString();
      Store.save();
      return p;
    },

    /* --------------------------- Notas --------------------------- */
    addNote: function (n) {
      n.id = n.id || U.uid('note');
      n.createdAt = new Date().toISOString();
      n.updatedAt = n.createdAt;
      state.notes.unshift(n);
      Store.save();
      return n;
    },
    updateNote: function (id, patch) {
      var n = state.notes.find(function (x) { return x.id === id; });
      if (!n) return null;
      Object.assign(n, patch, { updatedAt: new Date().toISOString() });
      Store.save();
      return n;
    },
    deleteNote: function (id) {
      var n = state.notes.find(function (x) { return x.id === id; });
      if (!n) return false;
      n.deletedAt = new Date().toISOString();
      Store.save();
      return true;
    },
    restoreNote: function (id) {
      var n = state.notes.find(function (x) { return x.id === id; });
      if (!n) return false;
      delete n.deletedAt;
      Store.save();
      return true;
    },
    purgeNote: function (id) { state.notes = state.notes.filter(function (x) { return x.id !== id; }); Store.save(); },

    /* --------------------------- Consultas / métricas --------------------------- */
    activeOperations: function () {
      return state.operations.filter(function (o) { return !o.deletedAt; });
    },
    opsInRange: function (from, to) {
      var f = from instanceof Date ? from.getTime() : new Date(from).getTime();
      var t = to instanceof Date ? to.getTime() : new Date(to).getTime();
      return Store.activeOperations().filter(function (o) {
        var d = U.parse(o.date).getTime();
        return d >= f && d <= t;
      });
    },
    metrics: function (from, to) {
      var ops = Store.opsInRange(from, to);
      var sales = ops.filter(function (o) { return o.kind === 'venta'; });
      var expenses = ops.filter(function (o) { return o.kind === 'gasto'; });
      var investments = ops.filter(function (o) { return o.kind === 'inversion'; });
      var income = U.sum(sales, function (o) { return o.total; });
      var cogs = U.sum(sales, function (o) { return o.cost; });
      var gross = U.round(income - cogs);
      var gastos = U.sum(expenses, function (o) { return o.amount; });
      var net = U.round(gross - gastos);
      var aportes = U.sum(investments.filter(function (o) { return o.direction !== 'retiro'; }), function (o) { return o.amount; });
      var retiros = U.sum(investments.filter(function (o) { return o.direction === 'retiro'; }), function (o) { return o.amount; });
      return {
        from: from, to: to,
        sales: sales, expenses: expenses, investments: investments, ops: ops,
        count: sales.length,
        units: U.sum(sales, function (o) { return o.qty; }),
        income: U.round(income),
        cogs: U.round(cogs),
        gross: gross,
        expensesTotal: U.round(gastos),
        net: net,
        margin: income > 0 ? U.round(gross / income * 100, 1) : 0,
        netMargin: income > 0 ? U.round(net / income * 100, 1) : 0,
        ticket: sales.length ? U.round(income / sales.length) : 0,
        aportes: U.round(aportes),
        retiros: U.round(retiros),
        investmentNet: U.round(aportes - retiros),
        byCategory: Store.groupByCategory(sales),
        byPayment: Store.groupByPayment(sales),
        byProduct: Store.groupByProduct(sales)
      };
    },
    totals: function () {
      var all = Store.metrics(new Date(2000, 0, 1), U.endOfDay(new Date()));
      var inv = Store.inventory();
      var capital = U.round(all.investmentNet + all.net);
      return {
        metrics: all,
        investmentNet: all.investmentNet,
        aportes: all.aportes,
        retiros: all.retiros,
        gross: all.gross,
        net: all.net,
        income: all.income,
        expensesTotal: all.expensesTotal,
        capital: capital,
        inventoryCost: inv.cost,
        inventoryRetail: inv.retail,
        inventoryProfit: U.round(inv.retail - inv.cost),
        equity: U.round(capital + inv.cost),
        roi: all.investmentNet > 0 ? U.round(all.net / all.investmentNet * 100, 1) : 0,
        margin: all.margin
      };
    },
    inventory: function () {
      var prods = state.products.filter(function (p) { return !p.deletedAt && p.active; });
      var cost = 0, retail = 0, units = 0, low = [];
      prods.forEach(function (p) {
        if (!p.trackStock) return;
        var s = U.num(p.stock);
        cost += s * U.num(p.cost);
        retail += s * U.num(p.price);
        units += s;
        if (s <= U.num(p.minStock)) low.push(p);
      });
      return { cost: U.round(cost), retail: U.round(retail), units: units, low: low, products: prods };
    },
    groupByCategory: function (sales) {
      var map = {};
      CATEGORIES.forEach(function (c) { map[c.id] = { id: c.id, label: c.label, color: c.color, total: 0, cost: 0, profit: 0, qty: 0, count: 0 }; });
      sales.forEach(function (o) {
        var key = o.category || 'otros';
        if (!map[key]) map[key] = { id: key, label: key, color: '#8aa7bf', total: 0, cost: 0, profit: 0, qty: 0, count: 0 };
        map[key].total += U.num(o.total);
        map[key].cost += U.num(o.cost);
        map[key].profit += U.num(o.profit);
        map[key].qty += U.num(o.qty);
        map[key].count++;
      });
      return Object.keys(map).map(function (k) { return map[k]; }).filter(function (x) { return x.count > 0; });
    },
    groupByPayment: function (sales) {
      var map = {};
      sales.forEach(function (o) {
        var k = o.payment || 'efectivo';
        map[k] = (map[k] || 0) + U.num(o.total);
      });
      return Object.keys(map).map(function (k) {
        var found = PAYMENTS.find(function (p) { return p.id === k; });
        return { id: k, label: found ? found.label : k, total: U.round(map[k]) };
      });
    },
    groupByProduct: function (sales) {
      var map = {};
      sales.forEach(function (o) {
        var k = o.productId || o.productName;
        if (!map[k]) map[k] = { id: k, name: o.productName, category: o.category, qty: 0, total: 0, cost: 0, profit: 0, count: 0 };
        map[k].qty += U.num(o.qty);
        map[k].total += U.num(o.total);
        map[k].cost += U.num(o.cost);
        map[k].profit += U.num(o.profit);
        map[k].count++;
      });
      return Object.keys(map).map(function (k) {
        var x = map[k];
        x.total = U.round(x.total); x.cost = U.round(x.cost); x.profit = U.round(x.profit);
        x.margin = x.total > 0 ? U.round(x.profit / x.total * 100, 1) : 0;
        return x;
      }).sort(function (a, b) { return b.total - a.total; });
    },
    series: function (from, to, granularity) {
      var start = U.startOfDay(from), end = U.startOfDay(to);
      var buckets = [];
      var map = {};
      var cur = new Date(start);
      while (cur <= end) {
        var key, label, bStart, bEnd;
        if (granularity === 'mes') {
          key = cur.getFullYear() + '-' + U.pad(cur.getMonth() + 1);
          label = MONTHS_SHORT[cur.getMonth()] + ' ' + String(cur.getFullYear()).slice(2);
          bStart = U.startOfMonth(cur); bEnd = U.endOfMonth(cur);
          cur = U.addMonths(U.startOfMonth(cur), 1);
        } else if (granularity === 'semana') {
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
        var b = { key: key, label: label, from: bStart, to: bEnd, income: 0, cost: 0, gross: 0, expenses: 0, net: 0, count: 0 };
        buckets.push(b);
        map[key] = b;
      }
      Store.activeOperations().forEach(function (o) {
        var d = U.parse(o.date);
        var key = granularity === 'mes' ? d.getFullYear() + '-' + U.pad(d.getMonth() + 1) : (granularity === 'semana' ? U.dateKey(U.startOfWeek(d)) : U.dateKey(d));
        var b = map[key];
        if (!b) return;
        if (o.kind === 'venta') {
          b.income += U.num(o.total); b.cost += U.num(o.cost); b.count++;
        } else if (o.kind === 'gasto') {
          b.expenses += U.num(o.amount);
        }
      });
      buckets.forEach(function (b) {
        b.income = U.round(b.income); b.cost = U.round(b.cost);
        b.gross = U.round(b.income - b.cost);
        b.expenses = U.round(b.expenses);
        b.net = U.round(b.gross - b.expenses);
      });
      return buckets;
    },
    deleted: function () {
      return {
        operations: state.operations.filter(function (o) { return o.deletedAt; }),
        products: state.products.filter(function (p) { return p.deletedAt; }),
        notes: state.notes.filter(function (n) { return n.deletedAt; })
      };
    },

    /* --------------------------- Datos / respaldos --------------------------- */
    exportJSON: function () { return JSON.stringify(state, null, 2); },
    importJSON: function (text) {
      var data = JSON.parse(text);
      if (!data || typeof data !== 'object' || !Array.isArray(data.operations)) throw new Error('El archivo no tiene un formato válido de XP Negocio.');
      state = normalize(data);
      Store.save(true);
      Store.emit('import', state);
      return true;
    },
    clearDemo: function () {
      state.operations = state.operations.filter(function (o) { return !o.demo; });
      state.products = state.products.filter(function (p) { return !p.demo; });
      state.settings.demoData = false;
      Store.save();
    },
    resetAll: async function () {
      var salt = Auth.randomSalt();
      var fresh = normalize({});
      fresh.auth = {
        username: 'admin', displayName: 'Administrador', salt: salt,
        hash: await Auth.hash('admin', salt), hint: 'admin',
        createdAt: new Date().toISOString(), changedAt: null
      };
      fresh.settings.demoData = false;
      state = fresh;
      Store.save(true);
      Store.emit('reset', state);
    },
    /* --------------------------- Pantalla / ventanas / iconos --------------------------- */
    scaleLimits: { ui: { min: UI_SCALE_MIN, max: UI_SCALE_MAX }, text: { min: TEXT_SCALE_MIN, max: TEXT_SCALE_MAX } },
    setUiScale: function (value) {
      state.settings.uiScale = scaleValue(value, UI_SCALE_MIN, UI_SCALE_MAX, 100);
      Store.save();
      return state.settings.uiScale;
    },
    setTextScale: function (value) {
      state.settings.textScale = scaleValue(value, TEXT_SCALE_MIN, TEXT_SCALE_MAX, 100);
      Store.save();
      return state.settings.textScale;
    },
    setWindowState: function (appId, rect) {
      if (!appId || !state) return;
      state.settings.windowState = state.settings.windowState || {};
      state.settings.windowState[appId] = rect;
      Store.save();
    },
    resetWindowState: function (appId) {
      if (!state) return;
      if (appId) delete state.settings.windowState[appId];
      else state.settings.windowState = {};
      Store.save();
    },
    setIconPos: function (appId, pos) {
      if (!appId || !state) return;
      state.settings.iconPos = state.settings.iconPos || {};
      if (pos) state.settings.iconPos[appId] = { x: Math.round(pos.x), y: Math.round(pos.y) };
      else delete state.settings.iconPos[appId];
      Store.save();
    },
    resetIconPos: function (appId) {
      if (!state) return;
      if (appId) delete state.settings.iconPos[appId];
      else state.settings.iconPos = {};
      Store.save();
    },

    storageInfo: function () {
      try {
        var raw = localStorage.getItem(KEY) || '';
        var bytes = new Blob([raw]).size;
        return { bytes: bytes, kb: U.round(bytes / 1024, 1), mb: U.round(bytes / 1048576, 2), total: 5 * 1024 * 1024 };
      } catch (e) { return { bytes: 0, kb: 0, mb: 0, total: 5242880 }; }
    },
    testServer: function () {
      return api('ping').then(function (r) { serverAvailable = true; return r; }).catch(function (e) { serverAvailable = false; throw e; });
    },
    backupServer: function () { return api('backup', {}); },
    loadServer: async function () {
      var res = await api('load');
      if (res && res.data) {
        state = normalize(res.data);
        writeLocal(state);
        Store.emit('import', state);
      }
      return res;
    },
    pushServer: function () { return api('save', { data: state }); },

    /* --------------------------- Sesión --------------------------- */
    session: {
      start: function (remember) {
        var payload = JSON.stringify({ user: state.auth.username, at: Date.now() });
        try {
          sessionStorage.setItem(SESSION_KEY, payload);
          if (remember) localStorage.setItem(REMEMBER_KEY, payload);
        } catch (e) { /* noop */ }
      },
      end: function () {
        try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(REMEMBER_KEY); } catch (e) { /* noop */ }
      },
      active: function () {
        try {
          return !!(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(REMEMBER_KEY));
        } catch (e) { return false; }
      }
    }
  };

  window.XP = window.XP || {};
  XP.version = '1.2.0';
  XP.store = Store;
  /* Alias usado por el login y el Panel de control. */
  XP.auth = Auth;
  XP.util = U;
  XP.ranges = Ranges;
})();
