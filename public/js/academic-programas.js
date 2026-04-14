/**
 * public/js/academic-programas.js
 * Programas académicos: listar, crear, editar
 */
(function () {
  const tbody = document.getElementById('tbody-programas');

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>`;
    try {
      const { data } = await axios.get('/api/academic/programas');
      if (!data.ok) throw new Error(data.error);
      renderTabla(data.data || data.programas || []);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--rojo-peligro);">${e.message}</td></tr>`;
    }
  }

  function renderTabla(rows) {
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;">Sin programas</td></tr>`; return; }
    tbody.innerHTML = rows.map(p => `
      <tr>
        <td><div class="nombre-principal">${esc(p.nombre)}</div></td>
        <td class="texto-muted">${esc(p.descripcion?.slice(0,60)||'—')}</td>
        <td style="text-align:center;font-weight:700;">${p.total_estudiantes||0}</td>
        <td style="text-align:center;">${p.total_planes||0}</td>
        <td>
          ${p.activo ? '<span class="badge badge-activo">Activo</span>' : '<span class="badge badge-inactivo">Inactivo</span>'}
          <button class="btn btn-secundario btn-sm" style="margin-left:.5rem;" onclick="editarPrograma(${p.id_programa})">Editar</button>
        </td>
      </tr>`).join('');
  }

  window.editarPrograma = async function (id) {
    try {
      const { data } = await axios.get('/api/academic/programas');
      const rows = data.data || data.programas || [];
      const p = rows.find(x => x.id_programa === id);
      if (!p) return;
      const form = document.getElementById('form-editar-programa');
      if (!form) return;
      form.querySelector('[name=nombre]').value      = p.nombre||'';
      form.querySelector('[name=descripcion]').value = p.descripcion||'';
      form.querySelector('[name=activo]').value      = p.activo ? '1' : '0';
      form.dataset.id = id;
      U.openModal('modal-editar-programa');
    } catch (e) { U.toast('Error', 'error'); }
  };

  document.getElementById('form-crear-programa')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target, btn = form.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const { data } = await axios.post('/api/academic/programas', Object.fromEntries(new FormData(form)));
      if (!data.ok) throw new Error(data.error);
      U.toast('Programa creado', 'exito');
      U.closeModal('modal-crear-programa');
      form.reset();
      cargar();
    } catch (err) { U.toast('Error: '+(err.response?.data?.error||err.message),'error');
    } finally { U.hideLoading(btn); }
  });

  document.getElementById('form-editar-programa')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target, btn = form.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const { data } = await axios.put(`/api/academic/programas/${form.dataset.id}`, Object.fromEntries(new FormData(form)));
      if (!data.ok) throw new Error(data.error);
      U.toast('Programa actualizado', 'exito');
      U.closeModal('modal-editar-programa');
      cargar();
    } catch (err) { U.toast('Error: '+(err.response?.data?.error||err.message),'error');
    } finally { U.hideLoading(btn); }
  });

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargar();
})();
