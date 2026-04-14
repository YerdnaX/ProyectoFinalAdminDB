/**
 * public/js/academic-cursos.js
 * Lista y gestión de cursos
 */
(function () {
  let page = 1, buscar = '', creditos = '';
  const LIMIT = 10;
  const tbody = document.getElementById('tbody-cursos');
  const inBus = document.getElementById('input-buscar');
  const selCr = document.getElementById('sel-creditos');

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>`;
    try {
      const { data } = await axios.get('/api/academic/cursos', { params: { page, limit: LIMIT, buscar, creditos } });
      if (!data.ok) throw new Error(data.error);
      renderTabla(data.data, data.total);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--rojo-peligro);">${e.message}</td></tr>`;
    }
  }

  function renderTabla(rows, total) {
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;">Sin resultados</td></tr>`;
    } else {
      tbody.innerHTML = rows.map(c => `
        <tr>
          <td><span style="font-family:monospace;color:var(--verde-principal);font-weight:700;">${esc(c.codigo)}</span></td>
          <td><div class="nombre-principal">${esc(c.nombre)}</div>
              <div class="detalle-secundario">${esc(c.descripcion?.slice(0,60)||'')}</div></td>
          <td style="text-align:center;font-weight:700;">${c.creditos}</td>
          <td>${U.colones(c.costo_credito)}</td>
          <td class="texto-muted" style="font-size:.8rem;">${esc(c.prerequisitos||'—')}</td>
          <td>${c.activo ? '<span class="badge badge-activo">Activo</span>' : '<span class="badge badge-inactivo">Inactivo</span>'}</td>
          <td><div class="acciones-fila">
            <button class="btn btn-secundario btn-sm" onclick="editarCurso(${c.id_curso})">Editar</button>
          </div></td>
        </tr>`).join('');
    }
    U.renderPaginacion('#paginacion-cursos', { total, page, limit: LIMIT, onPage: p => { page = p; cargar(); } });
  }

  window.editarCurso = async function (id) {
    try {
      const { data } = await axios.get(`/api/academic/cursos/${id}`);
      if (!data.ok) throw new Error(data.error);
      const c = data.data;
      const form = document.getElementById('form-editar-curso');
      if (!form) return;
      form.querySelector('[name=nombre]').value      = c.nombre || '';
      form.querySelector('[name=codigo]').value      = c.codigo || '';
      form.querySelector('[name=creditos]').value    = c.creditos || '';
      form.querySelector('[name=costo_credito]').value = c.costo_credito || '';
      form.querySelector('[name=descripcion]').value = c.descripcion || '';
      form.dataset.id = id;
      U.openModal('modal-editar-curso');
    } catch (e) { U.toast('Error al cargar curso', 'error'); }
  };

  document.getElementById('form-editar-curso')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target, btn = form.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const { data } = await axios.put(`/api/academic/cursos/${form.dataset.id}`, Object.fromEntries(new FormData(form)));
      if (!data.ok) throw new Error(data.error);
      U.toast('Curso actualizado', 'exito');
      U.closeModal('modal-editar-curso');
      cargar();
    } catch (err) { U.toast('Error: ' + (err.response?.data?.error || err.message), 'error');
    } finally { U.hideLoading(btn); }
  });

  document.getElementById('form-crear-curso')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target, btn = form.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const { data } = await axios.post('/api/academic/cursos', Object.fromEntries(new FormData(form)));
      if (!data.ok) throw new Error(data.error);
      U.toast('Curso creado', 'exito');
      U.closeModal('modal-crear-curso');
      form.reset();
      cargar();
    } catch (err) { U.toast('Error: ' + (err.response?.data?.error || err.message), 'error');
    } finally { U.hideLoading(btn); }
  });

  let debounce;
  inBus?.addEventListener('input', e => { clearTimeout(debounce); debounce = setTimeout(() => { buscar = e.target.value.trim(); page = 1; cargar(); }, 400); });
  selCr?.addEventListener('change', e => { creditos = e.target.value; page = 1; cargar(); });

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargar();
})();
