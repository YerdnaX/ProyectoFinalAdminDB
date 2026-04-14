/**
 * public/js/billing-pagos.js
 * Admin: lista de pagos con filtros y totales
 */
(function () {
  let page = 1, metodo = '', estado = '';
  const LIMIT = 10;

  const tbody  = document.getElementById('tbody-pagos');
  const selMet = document.getElementById('sel-metodo');
  const selEst = document.getElementById('sel-estado');
  const totEl  = document.getElementById('total-recaudado');

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>`;
    try {
      const { data } = await axios.get('/api/billing/pagos', { params: { page, limit: LIMIT, metodo, estado } });
      if (!data.ok) throw new Error(data.error);
      if (totEl) totEl.textContent = U.colones(data.total_recaudado);
      renderTabla(data.data, data.total);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--rojo-peligro);">${e.message}</td></tr>`;
    }
  }

  function renderTabla(rows, total) {
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;">Sin resultados</td></tr>`;
    } else {
      tbody.innerHTML = rows.map(p => `
        <tr>
          <td class="texto-muted">${esc(p.fecha_pago)}</td>
          <td>${esc(p.estudiante)}</td>
          <td class="texto-muted">${esc(p.carne)}</td>
          <td><span style="font-family:monospace;">${esc(p.numero_factura)}</span></td>
          <td style="font-weight:600;color:var(--verde-principal);">${U.colones(p.monto)}</td>
          <td><span class="badge badge-info">${esc(p.metodo_pago)}</span></td>
          <td class="texto-muted" style="font-size:.8rem;">${esc(p.referencia_pasarela||'—')}</td>
          <td>${U.badgeEstado(p.estado)}</td>
        </tr>`).join('');
    }
    U.renderPaginacion('#paginacion-pagos', { total, page, limit: LIMIT, onPage: p2 => { page = p2; cargar(); } });
  }

  selMet?.addEventListener('change', e => { metodo = e.target.value; page = 1; cargar(); });
  selEst?.addEventListener('change', e => { estado = e.target.value; page = 1; cargar(); });

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargar();
})();
