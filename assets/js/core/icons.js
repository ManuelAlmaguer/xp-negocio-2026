/* ============================================================
   XP Negocio 2026 · Librería de iconos SVG
   Iconos pictóricos estilo XP modernizado + iconos de interfaz
   ============================================================ */
(function () {
  'use strict';

  var P = {
    mipc: '<defs><linearGradient id="ic-mp-scr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fd8ff"/><stop offset=".55" stop-color="#2f8fe8"/><stop offset="1" stop-color="#0b4fb0"/></linearGradient><linearGradient id="ic-mp-case" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f7fa"/><stop offset=".5" stop-color="#d3dbe4"/><stop offset="1" stop-color="#a7b3c1"/></linearGradient></defs>' +
      '<rect x="5" y="9" width="38" height="27" rx="3.2" fill="url(#ic-mp-case)" stroke="#7b8b9c" stroke-width="1.1"/>' +
      '<rect x="8" y="12" width="32" height="19" rx="1.6" fill="url(#ic-mp-scr)"/>' +
      '<path d="M9 13h30v7c-9 2.4-21 2.6-30 .2Z" fill="#fff" opacity=".22"/>' +
      '<path d="M21 36h6l1.6 5h-9.2Z" fill="#b9c4cf" stroke="#7b8b9c" stroke-width="1"/>' +
      '<rect x="15" y="41" width="18" height="3.4" rx="1.7" fill="#cfd8e1" stroke="#7b8b9c" stroke-width=".9"/>' +
      '<circle cx="36" cy="33.5" r="1.2" fill="#5dd35d"/>',

    documentos: '<defs><linearGradient id="ic-doc-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe89a"/><stop offset=".55" stop-color="#fcc63c"/><stop offset="1" stop-color="#e09a06"/></linearGradient><linearGradient id="ic-doc-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffdf7d"/><stop offset="1" stop-color="#f0b11b"/></linearGradient></defs>' +
      '<path d="M5 13a2.5 2.5 0 0 1 2.5-2.5h10.2l3.6 4.2h13.2A2.5 2.5 0 0 1 37 17.2v2H5Z" fill="url(#ic-doc-b)" stroke="#c88f10" stroke-width="1"/>' +
      '<path d="M4 17.5h35.6a2.4 2.4 0 0 1 2.4 2.7l-2.6 18.3a2.6 2.6 0 0 1-2.6 2.2H7.2a2.6 2.6 0 0 1-2.6-2.2L2.2 20.2A2.4 2.4 0 0 1 4 17.5Z" fill="url(#ic-doc-f)" stroke="#c88f10" stroke-width="1.1"/>' +
      '<path d="M5 19h34l-.5 4H5.6Z" fill="#fff" opacity=".45"/>' +
      '<path d="M14 27h17M14 31h12" stroke="#fff" stroke-opacity=".55" stroke-width="1.6" stroke-linecap="round"/>',

    papelera: '<defs><linearGradient id="ic-bin-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8f6ff"/><stop offset=".5" stop-color="#a9d4ef"/><stop offset="1" stop-color="#5f9dc4"/></linearGradient><linearGradient id="ic-bin-l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6fbff"/><stop offset="1" stop-color="#b9d9ee"/></linearGradient></defs>' +
      '<path d="M11 15h22l-2.6 26.2a2.6 2.6 0 0 1-2.6 2.4H16.2a2.6 2.6 0 0 1-2.6-2.4Z" fill="url(#ic-bin-b)" stroke="#4b83a8" stroke-width="1.1"/>' +
      '<path d="M16 20v18M21 20v18M26 20v18M31 20v18" stroke="#fff" stroke-opacity=".5" stroke-width="1.4"/>' +
      '<rect x="8.5" y="10.5" width="27" height="5" rx="2.5" fill="url(#ic-bin-l)" stroke="#4b83a8" stroke-width="1.1"/>' +
      '<path d="M19 7.5h6" stroke="#4b83a8" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M22 25.5a3.4 3.4 0 1 1-3.3 4.4" fill="none" stroke="#3d9c46" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M18 27.4l1.2 2.6 2.7-.9" fill="none" stroke="#3d9c46" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',

    ventas: '<defs><linearGradient id="ic-cart" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9be86f"/><stop offset=".5" stop-color="#43a83a"/><stop offset="1" stop-color="#227a22"/></linearGradient></defs>' +
      '<path d="M6 10h5.4l4.2 20.2h19.8" fill="none" stroke="#2b6f9e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M14 15h27.5l-3.6 12.5H17.2Z" fill="url(#ic-cart)" stroke="#1f6b1f" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<path d="M16 17.5h24l-.8 3H16.9Z" fill="#fff" opacity=".35"/>' +
      '<circle cx="20" cy="38" r="3.2" fill="#2f4b63"/><circle cx="33" cy="38" r="3.2" fill="#2f4b63"/>' +
      '<circle cx="20" cy="37" r="1.1" fill="#cfe6f5"/><circle cx="33" cy="37" r="1.1" fill="#cfe6f5"/>' +
      '<circle cx="39" cy="12" r="6" fill="#ffd23f" stroke="#c88f10" stroke-width="1"/><path d="M39 8.5v7M35.5 12h7" stroke="#a06a05" stroke-width="1.6" stroke-linecap="round"/>',

    inventario: '<defs><linearGradient id="ic-box-t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffcf8a"/><stop offset="1" stop-color="#e08a2c"/></linearGradient><linearGradient id="ic-box-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6b968"/><stop offset="1" stop-color="#c9731c"/></linearGradient></defs>' +
      '<path d="M24 7 42 15.5 24 24 6 15.5Z" fill="url(#ic-box-t)" stroke="#a35c10" stroke-width="1.1" stroke-linejoin="round"/>' +
      '<path d="M6 15.5 24 24v18L6 33.5Z" fill="url(#ic-box-f)" stroke="#a35c10" stroke-width="1.1" stroke-linejoin="round"/>' +
      '<path d="M42 15.5 24 24v18l18-8.5Z" fill="#e29a45" stroke="#a35c10" stroke-width="1.1" stroke-linejoin="round"/>' +
      '<path d="M15 11.6 33 20v5.6L15 17.2Z" fill="#fff" opacity=".3"/>' +
      '<path d="M24 24v18" stroke="#a35c10" stroke-width="1.1" opacity=".6"/>',

    operaciones: '<defs><linearGradient id="ic-clip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe9f3"/></linearGradient></defs>' +
      '<rect x="10" y="8" width="28" height="36" rx="3.4" fill="url(#ic-clip)" stroke="#7c93a8" stroke-width="1.2"/>' +
      '<rect x="18" y="5" width="12" height="7" rx="2.4" fill="#c3d3e0" stroke="#7c93a8" stroke-width="1.1"/>' +
      '<path d="M15 20h18M15 26h18M15 32h11" stroke="#8aa7bf" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="32" cy="35" r="6.4" fill="#43a83a" stroke="#227a22" stroke-width="1.1"/>' +
      '<path d="m29 35 2.2 2.4L35.4 33" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',

    inversiones: '<defs><linearGradient id="ic-coin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe98f"/><stop offset=".55" stop-color="#f5bf2e"/><stop offset="1" stop-color="#c98a08"/></linearGradient></defs>' +
      '<ellipse cx="18" cy="34" rx="12" ry="4.4" fill="#b07c06"/><ellipse cx="18" cy="32" rx="12" ry="4.4" fill="url(#ic-coin)" stroke="#a87300" stroke-width="1"/>' +
      '<ellipse cx="18" cy="27" rx="12" ry="4.4" fill="#b07c06"/><ellipse cx="18" cy="25" rx="12" ry="4.4" fill="url(#ic-coin)" stroke="#a87300" stroke-width="1"/>' +
      '<ellipse cx="18" cy="20" rx="12" ry="4.4" fill="#b07c06"/><ellipse cx="18" cy="18" rx="12" ry="4.4" fill="url(#ic-coin)" stroke="#a87300" stroke-width="1"/>' +
      '<path d="M18 18v.1" stroke="#a87300" stroke-width="1"/>' +
      '<path d="M27 38 40 22" stroke="#2f9c46" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path d="M33 21h8v8" fill="none" stroke="#2f9c46" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>',

    gastos: '<defs><linearGradient id="ic-wal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb27a"/><stop offset=".5" stop-color="#e0603a"/><stop offset="1" stop-color="#a83218"/></linearGradient></defs>' +
      '<rect x="5" y="13" width="38" height="26" rx="4" fill="url(#ic-wal)" stroke="#8d2a12" stroke-width="1.2"/>' +
      '<path d="M5 18h38v5H5Z" fill="#fff" opacity=".22"/>' +
      '<rect x="26" y="22" width="17" height="10" rx="3" fill="#ffe6a8" stroke="#8d2a12" stroke-width="1.1"/>' +
      '<circle cx="34" cy="27" r="2.4" fill="#c07a10"/>' +
      '<path d="M10 13V9.5a2 2 0 0 1 2.5-1.9l20 4.4" fill="none" stroke="#8d2a12" stroke-width="1.6"/>',

    contabilidad: '<defs><linearGradient id="ic-book" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fc7ff"/><stop offset=".55" stop-color="#1f7bd6"/><stop offset="1" stop-color="#0a4a9c"/></linearGradient></defs>' +
      '<path d="M10 8h26a3 3 0 0 1 3 3v30a3 3 0 0 1-3 3H10Z" fill="url(#ic-book)" stroke="#083a7a" stroke-width="1.2"/>' +
      '<rect x="7" y="8" width="6" height="36" rx="2.4" fill="#0d3f7f"/>' +
      '<path d="M18 17h13M18 23h13M18 29h8" stroke="#d8efff" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M28 34h8M32 30v8" stroke="#8ff08a" stroke-width="2.4" stroke-linecap="round"/>',

    reportes: '<defs><linearGradient id="ic-rep-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e3edf7"/></linearGradient></defs>' +
      '<rect x="6" y="9" width="36" height="31" rx="3.4" fill="url(#ic-rep-b)" stroke="#6f8aa3" stroke-width="1.2"/>' +
      '<path d="M11 34V23M18 34V16M25 34V26M32 34V20" stroke-linecap="round" stroke-width="4">' +
      '<animate attributeName="opacity" values="1" dur="1s"/></path>' +
      '<path d="M11 34V23" stroke="#4aa3e8" stroke-width="4" stroke-linecap="round"/><path d="M18 34V16" stroke="#43a83a" stroke-width="4" stroke-linecap="round"/><path d="M25 34V26" stroke="#f5bf2e" stroke-width="4" stroke-linecap="round"/><path d="M32 34V20" stroke="#e0603a" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M10 40h28" stroke="#6f8aa3" stroke-width="1.6" stroke-linecap="round"/>',

    panel: '<defs><linearGradient id="ic-gear" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a9dcff"/><stop offset=".5" stop-color="#3f8fdc"/><stop offset="1" stop-color="#14508f"/></linearGradient></defs>' +
      '<path d="M24 5.5l4.3 1.4 2 3.6 4-.9 3.1 3.1-.9 4 3.6 2 1.4 4.3-1.4 4.3-3.6 2 .9 4-3.1 3.1-4-.9-2 3.6L24 42.5l-4.3-1.4-2-3.6-4 .9-3.1-3.1.9-4-3.6-2L6.5 24l1.4-4.3 3.6-2-.9-4 3.1-3.1 4 .9 2-3.6Z" fill="url(#ic-gear)" stroke="#0b3d70" stroke-width="1.1" stroke-linejoin="round"/>' +
      '<circle cx="24" cy="24" r="8" fill="#eaf6ff" stroke="#0b3d70" stroke-width="1.1"/>' +
      '<circle cx="24" cy="24" r="3.2" fill="#3f8fdc"/>',

    calculadora: '<defs><linearGradient id="ic-calc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8ea6bd"/><stop offset="1" stop-color="#3d556c"/></linearGradient></defs>' +
      '<rect x="10" y="5" width="28" height="38" rx="3.6" fill="url(#ic-calc)" stroke="#2b3f52" stroke-width="1.2"/>' +
      '<rect x="14" y="9" width="20" height="9" rx="1.8" fill="#c8f0b8" stroke="#2b3f52" stroke-width="1"/>' +
      '<path d="M24 12v3M20 13.5h8" stroke="#4c7a3c" stroke-width="1.1"/>' +
      '<g fill="#dbe7f2"><rect x="14" y="22" width="5" height="4" rx="1.2"/><rect x="21.5" y="22" width="5" height="4" rx="1.2"/><rect x="29" y="22" width="5" height="4" rx="1.2"/><rect x="14" y="29" width="5" height="4" rx="1.2"/><rect x="21.5" y="29" width="5" height="4" rx="1.2"/><rect x="14" y="36" width="5" height="4" rx="1.2"/><rect x="21.5" y="36" width="5" height="4" rx="1.2"/></g>' +
      '<rect x="29" y="29" width="5" height="11" rx="1.4" fill="#ff9f43"/>',

    notas: '<defs><linearGradient id="ic-note" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf0"/><stop offset="1" stop-color="#f6e7a8"/></linearGradient></defs>' +
      '<path d="M9 7h26l7 7v29a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" fill="url(#ic-note)" stroke="#b39a3c" stroke-width="1.2"/>' +
      '<path d="M35 7v7h7" fill="#ffeaa0" stroke="#b39a3c" stroke-width="1.2"/>' +
      '<path d="M13 20h19M13 26h19M13 32h13" stroke="#c2a94e" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="m28 38 9-9 3 3-9 9-4 1Z" fill="#f5bf2e" stroke="#a87300" stroke-width="1"/>',

    buscar: '<defs><radialGradient id="ic-mag" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#eaf8ff"/><stop offset=".7" stop-color="#9fd0ee"/><stop offset="1" stop-color="#4b8db8"/></radialGradient></defs>' +
      '<circle cx="21" cy="21" r="13" fill="url(#ic-mag)" stroke="#3d6f92" stroke-width="2.2"/>' +
      '<path d="M13 17a9 9 0 0 1 6-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M30.5 30.5 42 42" stroke="#2b4a63" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M30.5 30.5 40 40" stroke="#8fa9bd" stroke-width="2" stroke-linecap="round"/>',

    reloj: '<defs><radialGradient id="ic-clock" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dbe9f5"/></radialGradient></defs>' +
      '<circle cx="24" cy="24" r="18" fill="url(#ic-clock)" stroke="#2f6f9e" stroke-width="2.4"/>' +
      '<circle cx="24" cy="24" r="14.5" fill="none" stroke="#b8d3e6" stroke-width="1"/>' +
      '<path d="M24 13v11l7 5" fill="none" stroke="#1d4c6e" stroke-width="2.6" stroke-linecap="round"/>' +
      '<circle cx="24" cy="24" r="2" fill="#e0603a"/>' +
      '<path d="M24 6v3M24 39v3M6 24h3M39 24h3" stroke="#2f6f9e" stroke-width="2.4" stroke-linecap="round"/>',

    ayuda: '<defs><linearGradient id="ic-help" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fd0ff"/><stop offset=".55" stop-color="#2f83d8"/><stop offset="1" stop-color="#0a4a9c"/></linearGradient></defs>' +
      '<circle cx="24" cy="24" r="18" fill="url(#ic-help)" stroke="#083a7a" stroke-width="1.2"/>' +
      '<path d="M17 18.5a7 7 0 1 1 9.5 6.5c-1.6.7-2.5 1.9-2.5 3.6v.9" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/>' +
      '<circle cx="24" cy="35" r="2.4" fill="#fff"/>'
  };

  // Iconos de interfaz (monocromos, usan currentColor)
  var U = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/><path d="M10 11v5M14 11v5"/>',
    restore: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    download: '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/>',
    upload: '<path d="M12 21V9"/><path d="m7 13 5-5 5 5"/><path d="M5 3h14"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    alert: '<path d="M12 3 2 21h20Z"/><path d="M12 9v6M12 18v.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8Z"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    arrowUp: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
    arrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    power: '<path d="M12 3v9"/><path d="M6.5 6.5a8 8 0 1 0 11 0"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    save: '<path d="M5 3h11l3 3v15H5Z"/><path d="M8 3v6h7V3M8 21v-6h8v6"/>',
    money: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h5M9.5 14.5h5"/>',
    cart: '<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M3 4h2l2.5 11h11L21 7H6"/>',
    box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    trending: '<path d="m3 17 6-6 4 4 7-7"/><path d="M15 8h5v5"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h4"/><path d="M3 9h18"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 17h12v4H6z"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5v.7"/><path d="M12 17v.5"/>',
    star: '<path d="m12 3 2.7 5.7 6.3.9-4.6 4.4 1.1 6.2-5.5-3-5.5 3 1.1-6.2L3 9.6l6.3-.9Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    wifi: '<path d="M2 8.5a15 15 0 0 1 20 0"/><path d="M5.5 12a10 10 0 0 1 13 0"/><path d="M9 15.5a5 5 0 0 1 6 0"/><circle cx="12" cy="19" r="1"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9Z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
    mute: '<path d="M4 9v6h4l5 4V5L8 9Z"/><path d="m16 9 5 6M21 9l-5 6"/>',
    database: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    tag: '<path d="m3 12 9-9h7l2 2v7l-9 9Z"/><circle cx="16" cy="8" r="1.4"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>'
  };

  function svg(name, size, cls, stroke) {
    size = size || 24;
    if (P[name]) {
      return '<svg viewBox="0 0 48 48" width="' + size + '" height="' + size + '" class="' + (cls || '') + '" aria-hidden="true">' + P[name] + '</svg>';
    }
    var d = U[name] || U.info;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" class="icon ' + (cls || '') + '" fill="none" stroke="' + (stroke || 'currentColor') + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  }

  window.XP = window.XP || {};
  XP.icon = svg;
  XP.iconPaths = P;
})();
