/* ============================================================
   XP Negocio 2026 · Mis documentos (bloc de notas)
   ============================================================ */
(function () {
  'use strict';
  var U = XP.util, F = XP.fmt, UI = XP.ui;

  function mount(win) {
    var currentId = null;
    var search = '';
    var saveTimer = null;

    win.setTitle('Mis documentos');
    win.setSubtitle('Bloc de notas y recordatorios');

    win.content.innerHTML = '<div class="app" style="flex:1"><div class="notes">' +
      '<aside class="notes__list">' +
        '<div class="notes__list-head"><div class="searchbox">' + XP.icon('search', 13) + '<input id="note-search" type="search" placeholder="Buscar nota…"></div>' +
          '<button class="btn btn--primary btn--sm" id="note-new" style="width:100%;margin-top:6px">' + XP.icon('plus', 12) + ' Nueva nota</button></div>' +
        '<div class="notes__items" id="note-items"></div>' +
      '</aside>' +
      '<section class="notes__editor" id="note-editor"></section>' +
    '</div></div>';

    var itemsHost = win.content.querySelector('#note-items');
    var editorHost = win.content.querySelector('#note-editor');

    function notes() {
      return XP.store.notes.filter(function (n) { return !n.deletedAt; });
    }

    function renderList() {
      var list = notes().filter(function (n) {
        return !search || (n.title + ' ' + n.body).toLowerCase().indexOf(search.toLowerCase()) >= 0;
      }).sort(function (a, b) { return U.parse(b.updatedAt || b.createdAt) - U.parse(a.updatedAt || a.createdAt); });
      if (!list.length) {
        itemsHost.innerHTML = '<p class="muted small" style="padding:12px;text-align:center">' + (search ? 'Sin resultados' : 'Sin notas') + '</p>';
        return;
      }
      itemsHost.innerHTML = list.map(function (n) {
        var preview = String(n.body || '').replace(/\s+/g, ' ').slice(0, 42);
        return '<button class="note-item' + (n.id === currentId ? ' is-active' : '') + '" data-id="' + n.id + '">' +
          '<b>' + U.esc(n.title || 'Sin título') + '</b><small>' + F.ago(n.updatedAt || n.createdAt) + ' · ' + U.esc(preview) + '</small></button>';
      }).join('');
      itemsHost.querySelectorAll('[data-id]').forEach(function (b) {
        b.addEventListener('click', function () { openNote(b.dataset.id); });
      });
    }

    function renderEmptyEditor() {
      editorHost.innerHTML = '<div style="margin:auto;padding:24px;max-width:320px;text-align:center">' +
        '<div style="opacity:.5;display:flex;justify-content:center;margin-bottom:8px">' + XP.icon('notas', 46) + '</div>' +
        '<h4 style="font-size:calc(14px * var(--text-scale));margin-bottom:4px">Bloc de notas</h4>' +
        '<p class="muted" style="font-size:calc(11.5px * var(--text-scale));line-height:1.55;margin-bottom:12px">Guarda recordatorios, contactos de proveedores o ideas para el negocio. Todo se guarda en este equipo.</p>' +
        '<button class="btn btn--primary btn--sm" id="note-new2">Crear mi primera nota</button></div>';
      var b = editorHost.querySelector('#note-new2');
      if (b) b.addEventListener('click', newNote);
    }

    function openNote(id) {
      var n = XP.store.notes.find(function (x) { return x.id === id; });
      if (!n) return;
      currentId = id;
      renderList();
      editorHost.innerHTML =
        '<div class="notes__editor-head">' +
          '<input type="text" id="note-title" placeholder="Título de la nota" value="' + U.esc(n.title) + '">' +
          '<button class="icon-btn" id="note-copy" title="Copiar">' + XP.icon('copy', 14) + '</button>' +
          '<button class="icon-btn icon-btn--danger" id="note-del" title="Eliminar">' + XP.icon('trash', 14) + '</button>' +
        '</div>' +
        '<textarea class="notes__body" id="note-body" placeholder="Escribe aquí…">' + U.esc(n.body) + '</textarea>' +
        '<div class="notes__status"><span id="note-meta">' + F.dateTime(n.updatedAt || n.createdAt) + '</span><span id="note-saved">Guardado</span></div>';

      var titleEl = editorHost.querySelector('#note-title');
      var bodyEl = editorHost.querySelector('#note-body');
      var savedEl = editorHost.querySelector('#note-saved');

      function scheduleSave() {
        clearTimeout(saveTimer);
        savedEl.textContent = 'Guardando…';
        saveTimer = setTimeout(function () {
          var note = XP.store.notes.find(function (x) { return x.id === currentId; });
          if (!note) return;
          var title = titleEl.value.trim() || 'Sin título';
          XP.store.updateNote(currentId, { title: title, body: bodyEl.value });
          savedEl.textContent = 'Guardado ' + F.time(new Date());
          editorHost.querySelector('#note-meta').textContent = F.dateTime(new Date());
          renderList();
        }, 450);
      }

      titleEl.addEventListener('input', scheduleSave);
      bodyEl.addEventListener('input', scheduleSave);
      editorHost.querySelector('#note-copy').addEventListener('click', function () { UI.copy(bodyEl.value); });
      editorHost.querySelector('#note-del').addEventListener('click', async function () {
        var ok = await UI.confirm({ title: 'Eliminar nota', message: '¿Enviar "' + (titleEl.value || 'Sin título') + '" a la papelera?', confirmText: 'Eliminar', danger: true });
        if (!ok) return;
        XP.store.deleteNote(currentId);
        currentId = null;
        XP.toast('Nota enviada a la papelera', 'info');
        renderList();
        renderEmptyEditor();
      });

      setTimeout(function () { bodyEl.focus(); }, 80);
      bodyEl.setSelectionRange(bodyEl.value.length, bodyEl.value.length);
    }

    function newNote() {
      var n = XP.store.addNote({ title: 'Nueva nota', body: '' });
      currentId = n.id;
      renderList();
      openNote(n.id);
      var t = editorHost.querySelector('#note-title');
      if (t) { t.focus(); t.select(); }
    }

    win.content.querySelector('#note-search').addEventListener('input', UI.debounce(function (e) { search = e.target.value; renderList(); }, 160));
    win.content.querySelector('#note-new').addEventListener('click', newNote);

    renderList();
    var first = notes().sort(function (a, b) { return U.parse(b.updatedAt || b.createdAt) - U.parse(a.updatedAt || a.createdAt); })[0];
    if (first) openNote(first.id); else renderEmptyEditor();

    win.onClose = function () { clearTimeout(saveTimer); };
  }

  XP.wm.register({
    id: 'notas',
    title: 'Mis documentos',
    desktopLabel: 'Mis documentos',
    icon: 'documentos',
    width: 860,
    height: 560,
    description: 'Notas, recordatorios y documentos',
    mount: mount
  });
})();
