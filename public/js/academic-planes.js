/**
 * public/js/academic-planes.js
 * Planes de estudio: listar y crear
 */
(function () {
  const tbody = document.getElementById('tbody-planes');

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>`;
    try {
      const { data } = await axios.get('/api/academic/planes');
      if (!data.ok) throw new Error(data.error);
      renderTabla(data.data || []);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--rojo-peligro);">${e.message}</td></tr>`;
    }
  }

  function renderTabla(rows) {
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;">Sin planes</td></tr>`; return; }
    tbody.innerHTML = rows.map(p => `
      <tr>
        <td><div class="nombre-principal">${esc(p.nombre_plan)}</div></td>
        <td>${esc(p.programa||'—')}</td>
        <td style="text-align:center;">${p.fecha_inicio ? new Date(p.fecha_inicio).getFullYear() : '—'}</td>
        <td style="text-align:center;font-weight:700;">${p.total_cursos||0}</td>
        <td>${p.activo ? '<span class="badge badge-activo">Activo</span>' : '<span class="badge badge-inactivo">Inactivo</span>'}</td>
      </tr>`).join('');
  }

  document.getElementById('form-crear-plan')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target, btn = form.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const { data } = await axios.post('/api/academic/planes', Object.fromEntries(new FormData(form)));
      if (!data.ok) throw new Error(data.error);
      U.toast('Plan creado', 'exito');
      U.closeModal('modal-crear-plan');
      form.reset();
      cargar();
    } catch (err) { U.toast('Error: '+(err.response?.data?.error||err.message),'error');
    } finally { U.hideLoading(btn); }
  });

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargar();
})();
