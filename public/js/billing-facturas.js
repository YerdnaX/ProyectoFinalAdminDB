/**
 * public/js/billing-facturas.js
 * Admin: lista de facturas con filtros y paginación
 */
(function () {
  let page = 1, estado = '', buscar = '';
  const LIMIT = 10;

  const tbody  = document.getElementById('tbody-facturas');
  const inBus  = document.getElementById('input-buscar');
  const selEst = document.getElementById('sel-estado');
  let debounce;

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>`;
    try {
      const { data } = await axios.get('/api/billing/facturas', { params: { page, limit: LIMIT, estado, buscar } });
      if (!data.ok) throw new Error(data.error);
      renderTabla(data.data, data.total);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--rojo-peligro);">${e.message}</td></tr>`;
    }
  }

  function renderTabla(rows, total) {
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:2rem;">Sin resultados</td></tr>`;
    } else {
      tbody.innerHTML = rows.map(f => `
        <tr>
          <td><span style="font-family:monospace;font-weight:600;">${esc(f.numero_factura)}</span></td>
          <td>${esc(f.estudiante)}</td>
          <td class="texto-muted">${esc(f.carne)}</td>
          <td class="texto-muted">${esc(f.periodo)}</td>
          <td class="texto-muted">${esc(f.fecha_emision)}</td>
          <td style="font-weight:600;">${U.colones(f.total)}</td>
          <td style="color:${parseFloat(f.saldo)>0?'var(--rojo-peligro)':'var(--cyan-exito)'};font-weight:600;">${U.colones(f.saldo)}</td>
          <td>${U.badgeEstado(f.estado)}</td>
          <td><div class="acciones-fila">
            <button class="btn btn-secundario btn-sm" onclick="verFactura(${f.id_factura})">Ver</button>
          </div></td>
        </tr>`).join('');
    }
    U.renderPaginacion('#paginacion-facturas', { total, page, limit: LIMIT, onPage: p => { page = p; cargar(); } });
  }

  window.verFactura = function (id) {
    window.location.href = `/billing/facturas/${id}`;
  };

  inBus?.addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { buscar = e.target.value.trim(); page = 1; cargar(); }, 400);
  });
  selEst?.addEventListener('change', e => { estado = e.target.value; page = 1; cargar(); });

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargar();
})();
