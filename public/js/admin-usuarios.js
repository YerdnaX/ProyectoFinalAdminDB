/**
 * public/js/admin-usuarios.js
 * Gestión de usuarios: listar, buscar, crear, editar, desactivar
 */
(function () {
  let page = 1, buscar = '', rolFiltro = '', estadoFiltro = '';
  const LIMIT = 10;

  const tbody   = document.getElementById('tbody-usuarios');
  const pgInfo  = document.getElementById('pg-info');
  const pgBtns  = document.getElementById('pg-botones');
  const inBuscar= document.getElementById('input-buscar');
  const selRol  = document.getElementById('sel-rol');
  const selEst  = document.getElementById('sel-estado');

  // ── Carga de tabla ─────────────────────────────────────────────────────
  async function cargar() {  // returns promise implicitly (async)
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>`;
    try {
      const params = { page, limit: LIMIT };
      if (buscar)      params.buscar  = buscar;
      if (rolFiltro)   params.rol     = rolFiltro;
      if (estadoFiltro) params.estado = estadoFiltro;
      const { data } = await axios.get('/api/usuarios', { params });
      if (!data.ok) throw new Error(data.error);
      renderTabla(data.data, data.total);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--rojo-peligro);">Error: ${e.message}</td></tr>`;
    }
  }

  function renderTabla(rows, total) {
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gris-suave);">Sin resultados</td></tr>`;
    } else {
      tbody.innerHTML = rows.map(u => {
        const ini  = U.initials(`${u.nombre} ${u.apellido}`);
        const est  = u.activo ? '<span class="badge badge-activo">Activo</span>' : '<span class="badge badge-error">Inactivo</span>';
        const fecha = u.fecha_creacion || '—';
        return `
          <tr>
            <td><div style="display:flex;align-items:center;gap:.75rem;">
              <div class="avatar">${ini}</div>
              <div><div class="nombre-principal">${esc(u.nombre)} ${esc(u.apellido)}</div>
                   <div class="detalle-secundario">${esc(u.correo)}</div></div>
            </div></td>
            <td class="texto-muted">${esc(u.identificador_sso||'—')}</td>
            <td><span class="badge badge-info">${esc(u.rol||'—')}</span></td>
            <td>${est}</td>
            <td class="texto-muted">${fecha}</td>
            <td><div class="acciones-fila">
              <a href="/admin/usuarios/${u.id_usuario}" class="btn btn-secundario btn-sm">Ver</a>
              <button class="btn btn-secundario btn-sm" onclick="editarUsuario(${u.id_usuario})">Editar</button>
              ${u.activo ? `<button class="btn btn-sm" style="background:var(--rojo-peligro-bg);color:var(--rojo-peligro);" onclick="toggleUsuario(${u.id_usuario},0)">Desactivar</button>` : `<button class="btn btn-sm" style="background:var(--verde-bg);color:var(--verde-principal);" onclick="toggleUsuario(${u.id_usuario},1)">Activar</button>`}
            </div></td>
          </tr>`;
      }).join('');
    }

    // Paginación
    U.renderPaginacion('#paginacion-usuarios', { total, page, limit: LIMIT,
      onPage: p => { page = p; cargar(); }
    });
  }

  // ── Evento: buscar / filtrar ───────────────────────────────────────────
  let debounce;
  inBuscar?.addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { buscar = e.target.value.trim(); page = 1; cargar(); }, 400);
  });
  selRol?.addEventListener('change',  e => { rolFiltro = e.target.value; page = 1; cargar(); });
  selEst?.addEventListener('change',  e => { estadoFiltro = e.target.value; page = 1; cargar(); });

  // ── Crear usuario ──────────────────────────────────────────────────────
  const formCrear = document.getElementById('form-crear-usuario');
  formCrear?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = formCrear.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const body = Object.fromEntries(new FormData(formCrear));
      const { data } = await axios.post('/api/usuarios', body);
      if (!data.ok) throw new Error(data.error);
      U.toast('Usuario creado correctamente', 'exito');
      U.closeModal('modal-crear');
      formCrear.reset();
      cargar();
    } catch (e) {
      U.toast('Error: ' + e.response?.data?.error || e.message, 'error');
    } finally { U.hideLoading(btn); }
  });

  // ── Editar usuario ─────────────────────────────────────────────────────
  window.editarUsuario = async function (id) {
    try {
      const { data } = await axios.get(`/api/usuarios/${id}`);
      if (!data.ok) throw new Error(data.error);
      const u = data.data;
      const form = document.getElementById('form-editar-usuario');
      if (!form) return;
      form.querySelector('[name=nombre]').value   = u.nombre || '';
      form.querySelector('[name=apellido]').value  = u.apellido || '';
      form.querySelector('[name=correo]').value    = u.correo || '';
      form.querySelector('[name=id_rol]').value    = u.id_rol || '';
      form.dataset.id = id;
      U.openModal('modal-editar');
    } catch (e) { U.toast('Error al cargar usuario', 'error'); }
  };

  const formEditar = document.getElementById('form-editar-usuario');
  formEditar?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = formEditar.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const id   = formEditar.dataset.id;
      const body = Object.fromEntries(new FormData(formEditar));
      const { data } = await axios.put(`/api/usuarios/${id}`, body);
      if (!data.ok) throw new Error(data.error);
      U.toast('Usuario actualizado', 'exito');
      U.closeModal('modal-editar');
      cargar();
    } catch (e) {
      U.toast('Error: ' + (e.response?.data?.error || e.message), 'error');
    } finally { U.hideLoading(btn); }
  });

  // ── Activar / desactivar ───────────────────────────────────────────────
  window.toggleUsuario = async function (id, activo) {
    if (!confirm(activo ? '¿Activar este usuario?' : '¿Desactivar este usuario?')) return;
    try {
      const { data } = await axios.put(`/api/usuarios/${id}`, { activo });
      if (!data.ok) throw new Error(data.error);
      U.toast(activo ? 'Usuario activado' : 'Usuario desactivado', 'exito');
      cargar();
    } catch (e) { U.toast('Error: ' + e.message, 'error'); }
  };

  // ── Cargar lista de roles en selects ──────────────────────────────────
  async function cargarRoles() {
    try {
      const { data } = await axios.get('/api/usuarios/roles/lista');
      if (!data.ok) return;
      const roles = data.data || [];
      // Poblar filtro de rol
      if (selRol) {
        const primerOpt = selRol.querySelector('option[value=""]');
        selRol.innerHTML = '';
        selRol.insertAdjacentHTML('beforeend', `<option value="">Todos los roles</option>`);
        roles.forEach(r => selRol.insertAdjacentHTML('beforeend', `<option value="${esc(r.nombre)}">${esc(r.nombre)}</option>`));
      }
      // Poblar selects de formularios (crear / editar)
      document.querySelectorAll('select[name=id_rol]').forEach(sel => {
        sel.innerHTML = '<option value="">Seleccionar rol…</option>';
        roles.forEach(r => sel.insertAdjacentHTML('beforeend', `<option value="${r.id_rol}">${esc(r.nombre)}</option>`));
      });
    } catch (_) {}
  }

  // ── Auto-abrir modal editar si URL tiene ?editar=ID ────────────────────
  function checkAutoEditar() {
    const params = new URLSearchParams(window.location.search);
    const idEditar = params.get('editar');
    if (idEditar && !isNaN(idEditar)) {
      editarUsuario(parseInt(idEditar));
      // Limpiar param de la URL sin recargar
      const url = new URL(window.location.href);
      url.searchParams.delete('editar');
      window.history.replaceState({}, '', url.toString());
    }
  }

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  cargarRoles();
  cargar().then(() => checkAutoEditar());
})();
