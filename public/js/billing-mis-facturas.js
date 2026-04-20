(function () {
  const ID_EST = window._idEstudiante;
  const LIMIT = 10;

  async function cargar(page) {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const tbody = document.getElementById('tbody-mis-facturas');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando...</td></tr>';

    try {
      const resp = await axios.get(`/api/billing/facturas/estudiante/${ID_EST}`, {
        params: { page: pageNum, limit: LIMIT }
      });
      const data = resp.data;
      const facturas = Array.isArray(data.data) ? data.data : [];
      const total = Number(data.total || facturas.length || 0);

      const pendientes = facturas.filter(f => f.estado !== 'Pagada' && f.estado !== 'Anulada' && parseFloat(f.saldo || 0) > 0);
      const alerta = document.getElementById('alerta-pendientes');
      if (pendientes.length > 0) {
        document.getElementById('alerta-pendientes-texto').innerHTML =
          `Tienes <strong>${pendientes.length}</strong> factura(s) pendiente(s). <a href="/billing/pagar">Pagar ahora</a>`;
        alerta.style.display = '';
      } else {
        alerta.style.display = 'none';
      }

      if (!facturas.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">No hay facturas registradas.</td></tr>';
      } else {
        tbody.innerHTML = facturas.map(f => {
          const saldo = parseFloat(f.saldo || 0);
          const pendiente = saldo > 0;
          const acciones = pendiente
            ? `<a href="/billing/pagar?factura=${f.id_factura}" class="btn btn-primario btn-sm">Pagar</a>`
            : '';

          return `<tr>
            <td><span style="font-family:monospace;font-weight:700;">${esc(f.numero_factura || f.id_factura)}</span></td>
            <td>${esc(f.periodo || '-')}</td>
            <td class="texto-muted">${esc(f.fecha_emision || '-')}</td>
            <td style="text-align:right;font-weight:600;">${U.colones(f.total || 0)}</td>
            <td style="text-align:right;font-weight:600;color:${pendiente ? 'var(--rojo-peligro)' : 'var(--cyan-exito)'};">${U.colones(saldo)}</td>
            <td>${U.badgeEstado(f.estado || '-')}</td>
            <td>
              <div class="acciones-fila">
                <button class="btn btn-secundario btn-sm" onclick="verDetalle(${f.id_factura})">Ver detalle</button>
                ${acciones}
              </div>
            </td>
          </tr>`;
        }).join('');
      }

      U.renderPaginacion('#paginacion-mis-facturas', {
        total,
        page: pageNum,
        limit: LIMIT,
        onPage: cargar
      });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--rojo-peligro);">Error al cargar facturas.</td></tr>';
    }
  }

  window.verDetalle = async function (idFactura) {
    if (window.BillingDetalleFactura?.open) {
      return window.BillingDetalleFactura.open(idFactura);
    }
    U.toast('No se pudo abrir el detalle de factura.', 'error');
  };

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  document.addEventListener('DOMContentLoaded', () => cargar(1));
})();
