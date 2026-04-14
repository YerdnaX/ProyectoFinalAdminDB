/**
 * public/js/academic-periodos.js
 * Períodos académicos: listar, crear, editar
 */
(function () {
  const tbody = document.getElementById('tbody-periodos');

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>`;
    try {
      const { data } = await axios.get('/api/academic/periodos');
      if (!data.ok) throw new Error(data.error);
      renderTabla(data.data || []);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--rojo-peligro);">${e.message}</td></tr>`;
    }
  }

  function renderTabla(rows) {
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;">Sin períodos</td></tr>`; return; }
    tbody.innerHTML = rows.map(p => `
      <tr>
        <td><div class="nombre-principal">${esc(p.nombre)}</div><div class="detalle-secundario">${esc(p.codigo)}</div></td>
        <td><span class="badge badge-info">${esc(p.tipo_periodo)}</span></td>
        <td class="texto-muted">${esc(p.fecha_inicio)||'—'}</td>
        <td class="texto-muted">${esc(p.fecha_fin)||'—'}</td>
        <td class="texto-muted">${esc(p.inicio_matricula)||'—'}</td>
        <td class="texto-muted">${esc(p.fin_matricula)||'—'}</td>
        <td style="text-align:center;">${p.total_secciones||0}</td>
        <td>
          ${p.activo ? '<span class="badge badge-activo">Activo</span>' : '<span class="badge badge-inactivo">Inactivo</span>'}
          <button class="btn btn-secundario btn-sm" style="margin-left:.5rem;" onclick="editarPeriodo(${p.id_periodo})">Editar</button>
        </td>
      </tr>`).join('');
  }

  window.editarPeriodo = async function (id) {
    try {
      const all = await axios.get('/api/academic/periodos');
      const p   = (all.data.data || []).find(x => x.id_periodo === id);
      if (!p) return;
      const form = document.getElementById('form-editar-periodo');
      if (!form) return;
      form.querySelector('[name=nombre]').value = p.nombre||'';
      form.querySelector('[name=codigo]').value = p.codigo||'';
      form.querySelector('[name=tipo_periodo]').value = p.tipo_periodo||'';
      form.querySelector('[name=activo]').value = p.activo ? '1' : '0';
      form.dataset.id = id;
      U.openModal('modal-editar-periodo');
    } catch (e) { U.toast('Error', 'error'); }
  };

  document.getElementById('form-crear-periodo')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target, btn = form.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const { data } = await axios.post('/api/academic/periodos', Object.fromEntries(new FormData(form)));
      if (!data.ok) throw new Error(data.error);
      U.toast('Período creado', 'exito');
      U.closeModal('modal-crear-periodo');
      form.reset();
      cargar();
    } catch (err) { U.toast('Error: '+(err.response?.data?.error||err.message),'error');
    } finally { U.hideLoading(btn); }
  });

  document.getElementById('form-editar-periodo')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target, btn = form.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const { data } = await axios.put(`/api/academic/periodos/${form.dataset.id}`, Object.fromEntries(new FormData(form)));
      if (!data.ok) throw new Error(data.error);
      U.toast('Período actualizado', 'exito');
      U.closeModal('modal-editar-periodo');
      cargar();
    } catch (err) { U.toast('Error: '+(err.response?.data?.error||err.message),'error');
    } finally { U.hideLoading(btn); }
  });

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargar();
})();
