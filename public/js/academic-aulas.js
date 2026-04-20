/**
 * public/js/academic-aulas.js
 * Aulas: listar y crear
 */
(function () {
  const tbody = document.getElementById('tbody-aulas');

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>`;
    try {
      const { data } = await axios.get('/api/academic/aulas');
      if (!data.ok) throw new Error(data.error);
      renderTabla(data.data || []);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--rojo-peligro);">${e.message}</td></tr>`;
    }
  }

  function renderTabla(rows) {
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">Sin aulas</td></tr>`; return; }
    tbody.innerHTML = rows.map(a => `
      <tr>
        <td><span style="font-family:monospace;font-weight:700;">${esc(a.codigo)}</span></td>
        <td>${esc(a.nombre)}</td>
        <td>${esc(a.edificio||'—')}</td>
        <td style="text-align:center;font-weight:700;">${a.capacidad}</td>
        <td style="text-align:center;">${a.secciones_activas||0}</td>
        <td>
          ${a.activa ? '<span class="badge badge-activo">Activa</span>' : '<span class="badge badge-inactivo">Inactiva</span>'}
          <button class="btn btn-secundario btn-sm" style="margin-left:.5rem;" onclick="editarAula(${a.id_aula})">Editar</button>
        </td>
      </tr>`).join('');
  }

  window.editarAula = async function (id) {
    try {
      const { data } = await axios.get('/api/academic/aulas');
      const a = (data.data || []).find(x => x.id_aula === id);
      if (!a) return;
      const form = document.getElementById('form-editar-aula');
      if (!form) return;
      form.querySelector('[name=nombre]').value    = a.nombre || '';
      form.querySelector('[name=edificio]').value  = a.edificio || '';
      form.querySelector('[name=capacidad]').value = a.capacidad || '';
      form.dataset.id = id;
      U.openModal('modal-editar-aula');
    } catch (e) { U.toast('Error al cargar aula', 'error'); }
  };

  /* ── Abrir modal para CREAR ──────────────────────────────────── */
  document.getElementById('btn-nueva-aula')?.addEventListener('click', () => {
    document.getElementById('form-crear-aula')?.reset();
    U.openModal('modal-crear-aula');
  });

  document.getElementById('form-crear-aula')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target, btn = form.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const { data } = await axios.post('/api/academic/aulas', Object.fromEntries(new FormData(form)));
      if (!data.ok) throw new Error(data.error);
      U.toast('Aula creada', 'exito');
      U.closeModal('modal-crear-aula');
      form.reset();
      cargar();
    } catch (err) { U.toast('Error: '+(err.response?.data?.error||err.message),'error');
    } finally { U.hideLoading(btn); }
  });

  document.getElementById('form-editar-aula')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target, btn = form.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const { data } = await axios.put(`/api/academic/aulas/${form.dataset.id}`, Object.fromEntries(new FormData(form)));
      if (!data.ok) throw new Error(data.error);
      U.toast('Aula actualizada', 'exito');
      U.closeModal('modal-editar-aula');
      cargar();
    } catch (err) { U.toast('Error: '+(err.response?.data?.error||err.message),'error');
    } finally { U.hideLoading(btn); }
  });

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargar();
})();
