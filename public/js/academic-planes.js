/**
 * public/js/academic-planes.js
 * Planes de estudio: listar, crear
 */
(function () {
  const tbody = document.getElementById('tbody-planes');

  /* ── Carga tabla ─────────────────────────────────────────────── */
  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>`;
    try {
      const { data } = await axios.get('/api/academic/planes');
      if (!data.ok) throw new Error(data.error);
      renderTabla(data.data || []);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--rojo-peligro);">${e.message}</td></tr>`;
    }
  }

  function renderTabla(rows) {
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gris-suave);">Sin planes registrados.</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map(p => `
      <tr>
        <td><span style="font-family:monospace;font-weight:700;">${esc(p.codigo)}</span></td>
        <td><div class="nombre-principal">${esc(p.nombre)}</div></td>
        <td class="texto-muted">${esc(p.programa || '—')}</td>
        <td class="texto-muted">${esc(p.fecha_inicio || '—')}</td>
        <td class="texto-muted">${esc(p.fecha_fin || '—')}</td>
        <td style="text-align:center;">${p.total_cursos || 0}</td>
        <td>${p.activo ? '<span class="badge badge-activo">Activo</span>' : '<span class="badge badge-inactivo">Inactivo</span>'}</td>
        <td><div class="acciones-fila"></div></td>
      </tr>`).join('');
  }

  /* ── Poblar select de programas ──────────────────────────────── */
  async function cargarProgramas() {
    try {
      const { data } = await axios.get('/api/academic/programas');
      const sel = document.getElementById('plan-programa');
      if (!sel) return;
      const first = sel.options[0];
      sel.innerHTML = '';
      sel.appendChild(first || new Option('Seleccionar programa…', ''));
      (data.data || []).forEach(p => {
        const opt = new Option(`${esc(p.codigo)} — ${esc(p.nombre)}`, p.id_programa);
        sel.appendChild(opt);
      });
    } catch (_) {}
  }

  /* ── Abrir modal para CREAR ──────────────────────────────────── */
  document.getElementById('btn-nuevo-plan')?.addEventListener('click', async () => {
    document.getElementById('plan-id').value = '';
    document.getElementById('form-plan').reset();
    document.getElementById('modal-plan-titulo').textContent = 'Nuevo plan de estudio';
    await cargarProgramas();
    U.openModal('modal-plan');
  });

  /* ── Submit: crear plan ──────────────────────────────────────── */
  document.getElementById('form-plan')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('[type=submit]');

    const codigo   = document.getElementById('plan-codigo').value.trim();
    const nombre   = document.getElementById('plan-nombre').value.trim();
    const programa = document.getElementById('plan-programa').value;
    const inicio   = document.getElementById('plan-inicio').value;

    if (!codigo)   { U.toast('El código es obligatorio.', 'error'); document.getElementById('plan-codigo').focus(); return; }
    if (!nombre)   { U.toast('El nombre es obligatorio.', 'error'); document.getElementById('plan-nombre').focus(); return; }
    if (!programa) { U.toast('Debes seleccionar un programa.', 'error'); document.getElementById('plan-programa').focus(); return; }
    if (!inicio)   { U.toast('La vigencia inicio es obligatoria.', 'error'); document.getElementById('plan-inicio').focus(); return; }

    U.showLoading(btn);
    try {
      const body = Object.fromEntries(new FormData(e.target));
      const { data } = await axios.post('/api/academic/planes', body);
      if (!data.ok) throw new Error(data.error);
      U.toast('Plan creado correctamente.', 'exito');
      U.closeModal('modal-plan');
      e.target.reset();
      cargar();
    } catch (err) {
      U.toast('Error: ' + (err.response?.data?.error || err.message), 'error');
    } finally { U.hideLoading(btn); }
  });

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  cargar();
})();
