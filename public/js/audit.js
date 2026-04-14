/**
 * public/js/audit.js
 * Bitácora de auditoría con filtros, paginación y registro
 */
(function () {
  let page = 1;
  const LIMIT = 20;
  const fields = { usuario: '', entidad: '', accion: '', desde: '', hasta: '' };

  const tbody  = document.getElementById('tbody-bitacora');
  const selEnt = document.getElementById('sel-entidad');

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>`;
    try {
      const params = { page, limit: LIMIT, ...fields };
      const { data } = await axios.get('/api/audit', { params });
      if (!data.ok) throw new Error(data.error);

      // Poblar select de entidades si está vacío
      if (selEnt && data.entidades?.length) {
        const cur = selEnt.value;
        selEnt.innerHTML = '<option value="">Todas las entidades</option>';
        data.entidades.forEach(e => selEnt.insertAdjacentHTML('beforeend', `<option value="${esc(e)}">${esc(e)}</option>`));
        selEnt.value = cur;
      }

      renderTabla(data.data, data.total);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--rojo-peligro);">${e.message}</td></tr>`;
    }
  }

  function renderTabla(rows, total) {
    const accionBadge = { INSERT:'badge-activo', UPDATE:'badge-info', DELETE:'badge-error', LOGIN:'badge-pendiente', LOGOUT:'badge-inactivo', SELECT:'badge-info' };
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;">Sin registros</td></tr>`;
    } else {
      tbody.innerHTML = rows.map(r => `
        <tr>
          <td class="texto-muted">${esc(r.fecha)}</td>
          <td class="texto-muted">${esc(r.hora)}</td>
          <td>${esc(r.usuario)}</td>
          <td><span class="badge badge-info">${esc(r.rol)}</span></td>
          <td><span class="badge ${accionBadge[r.accion]||'badge-info'}">${esc(r.accion)}</span></td>
          <td><span style="font-family:monospace;font-size:.8rem;">${esc(r.entidad)}</span></td>
          <td style="font-size:.8125rem;">${esc(r.descripcion||'—')}</td>
          <td class="texto-muted" style="font-size:.8rem;">${esc(r.ip_origen||'—')}</td>
        </tr>`).join('');
    }
    U.renderPaginacion('#paginacion-bitacora', { total, page, limit: LIMIT, onPage: p => { page = p; cargar(); } });
  }

  // Bindear filtros
  ['usuario','accion','desde','hasta'].forEach(id => {
    const el = document.getElementById(`fil-${id}`);
    if (el) el.addEventListener('input', () => { fields[id] = el.value; page = 1; cargar(); });
  });
  selEnt?.addEventListener('change', () => { fields.entidad = selEnt.value; page = 1; cargar(); });
  document.getElementById('btn-filtrar')?.addEventListener('click', () => { page = 1; cargar(); });

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargar();
})();
