/**
 * public/js/academic-programas.js
 * Programas académicos: listar, crear, editar
 */
(function () {
  const tbody = document.getElementById('tbody-programas');

  /* ── Carga tabla ─────────────────────────────────────────────── */
  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>`;
    try {
      const { data } = await axios.get('/api/academic/programas');
      if (!data.ok) throw new Error(data.error);
      renderTabla(data.data || []);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--rojo-peligro);">${e.message}</td></tr>`;
    }
  }

  function renderTabla(rows) {
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Sin programas registrados.</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map(p => `
      <tr>
        <td><span style="font-family:monospace;font-weight:700;color:var(--verde-principal);">${esc(p.codigo)}</span></td>
        <td><div class="nombre-principal">${esc(p.nombre)}</div></td>
        <td class="texto-muted">${esc(p.nivel || '—')}</td>
        <td style="text-align:center;">${p.total_planes || 0}</td>
        <td style="text-align:center;">${p.total_estudiantes || 0}</td>
        <td>${p.activo ? '<span class="badge badge-activo">Activo</span>' : '<span class="badge badge-inactivo">Inactivo</span>'}</td>
        <td><div class="acciones-fila">
          <button class="btn btn-secundario btn-sm" onclick="editarPrograma(${p.id_programa})">Editar</button>
        </div></td>
      </tr>`).join('');
  }

  /* ── Abrir modal para CREAR ──────────────────────────────────── */
  document.getElementById('btn-nuevo-programa')?.addEventListener('click', () => {
    document.getElementById('prog-id').value = '';
    document.getElementById('form-programa').reset();
    document.getElementById('modal-prog-titulo').textContent = 'Nuevo programa';
    U.openModal('modal-programa');
  });

  /* ── Abrir modal para EDITAR ─────────────────────────────────── */
  window.editarPrograma = async function (id) {
    try {
      const { data } = await axios.get('/api/academic/programas');
      const rows = data.data || [];
      const p = rows.find(x => x.id_programa === id);
      if (!p) { U.toast('Programa no encontrado', 'error'); return; }

      document.getElementById('prog-id').value         = p.id_programa;
      document.getElementById('prog-codigo').value      = p.codigo || '';
      document.getElementById('prog-nombre').value      = p.nombre || '';
      document.getElementById('prog-descripcion').value = p.descripcion || '';
      document.getElementById('prog-nivel').value       = p.nivel || '';
      document.getElementById('prog-creditos').value    = p.creditos_totales || '';
      document.getElementById('modal-prog-titulo').textContent = 'Editar programa';
      U.openModal('modal-programa');
    } catch (e) { U.toast('Error al cargar programa', 'error'); }
  };

  /* ── Submit: crear o editar ──────────────────────────────────── */
  document.getElementById('form-programa')?.addEventListener('submit', async e => {
    e.preventDefault();
    const idVal  = document.getElementById('prog-id').value;
    const codigo = document.getElementById('prog-codigo').value.trim();
    const nombre = document.getElementById('prog-nombre').value.trim();
    const nivel  = document.getElementById('prog-nivel').value;
    const btn    = e.target.querySelector('[type=submit]');

    if (!codigo) { U.toast('El código es obligatorio.', 'error'); document.getElementById('prog-codigo').focus(); return; }
    if (!nombre) { U.toast('El nombre es obligatorio.', 'error'); document.getElementById('prog-nombre').focus(); return; }
    if (!nivel)  { U.toast('El nivel académico es obligatorio.', 'error'); document.getElementById('prog-nivel').focus(); return; }

    U.showLoading(btn);
    const body = {
      codigo,
      nombre,
      descripcion: document.getElementById('prog-descripcion').value.trim(),
      nivel,
      creditos_totales: document.getElementById('prog-creditos').value || null,
      activo: 1
    };
    try {
      const { data } = idVal
        ? await axios.put(`/api/academic/programas/${idVal}`, body)
        : await axios.post('/api/academic/programas', body);
      if (!data.ok) throw new Error(data.error);
      U.toast(idVal ? 'Programa actualizado correctamente.' : 'Programa creado correctamente.', 'exito');
      U.closeModal('modal-programa');
      document.getElementById('prog-id').value = '';
      e.target.reset();
      cargar();
    } catch (err) {
      U.toast('Error: ' + (err.response?.data?.error || err.message), 'error');
    } finally { U.hideLoading(btn); }
  });

  /* ── Filtros ─────────────────────────────────────────────────── */
  document.getElementById('btn-buscar')?.addEventListener('click', cargar);
  document.getElementById('fil-buscar')?.addEventListener('keydown', e => { if (e.key === 'Enter') cargar(); });

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  cargar();
})();
