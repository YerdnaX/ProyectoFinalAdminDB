(function () {
  const ID_EST = window._idEstudiante;
  let paginaActual = 1;
  const LIMIT = 10;

  async function cargar(page) {
    paginaActual = page;
    const tbody = document.getElementById('tbody-mis-facturas');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>';
    try {
      const resp = await axios.get(`/api/billing/facturas/estudiante/${ID_EST}`, {
        params: { page, limit: LIMIT }
      });
      const data = resp.data;
      const facturas = data.data || data.facturas || data;
      const total = data.total || facturas.length;
      const pendientes = facturas.filter(f => f.estado !== 'Pagada' && parseFloat(f.saldo) > 0);

      // alerta pendientes
      const alerta = document.getElementById('alerta-pendientes');
      if (pendientes.length > 0) {
        document.getElementById('alerta-pendientes-texto').innerHTML =
          `Tienes <strong>${pendientes.length}</strong> factura(s) pendiente(s) de pago. <a href="/billing/pagar">Pagar ahora →</a>`;
        alerta.style.display = '';
      } else {
        alerta.style.display = 'none';
      }

      if (!facturas.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">No hay facturas registradas.</td></tr>';
        return;
      }

      tbody.innerHTML = facturas.map(f => {
        const saldo = parseFloat(f.saldo || 0);
        const esPendiente = saldo > 0;
        const saldoColor = esPendiente ? 'var(--rojo-peligro)' : 'var(--cyan-exito)';
        const acciones = esPendiente
          ? `<a href="/billing/pagar?factura=${f.id_factura}" class="btn btn-primario btn-sm">Pagar</a>`
          : `<button class="btn btn-secundario btn-sm" onclick="imprimirFactura(${f.id_factura})">🖨️</button>`;
        return `<tr>
          <td><span style="font-family:monospace;font-weight:700;">${f.numero_factura || f.id_factura}</span></td>
          <td>${f.periodo || '—'}</td>
          <td class="texto-muted">${f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString('es-CR') : '—'}</td>
          <td style="text-align:right;font-weight:600;">${U.colones(f.total || 0)}</td>
          <td style="text-align:right;font-weight:600;color:${saldoColor};">${U.colones(saldo)}</td>
          <td>${U.badgeEstado(f.estado)}</td>
          <td><div class="acciones-fila"><button class="btn btn-secundario btn-sm" onclick="verDetalle(${f.id_factura})">Ver detalle</button>${acciones}</div></td>
        </tr>`;
      }).join('');

      U.renderPaginacion('#paginacion-mis-facturas', { total, page, limit: LIMIT, onPage: cargar });
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--rojo-peligro);">Error al cargar facturas.</td></tr>`;
    }
  }

  window.verDetalle = async function (idFactura) {
    try {
      const resp = await axios.get(`/api/billing/facturas/${idFactura}`);
      const f = resp.data.data || resp.data;
      const lineas = (f.lineas || f.detalle || []).map(l =>
        `<tr><td>${l.descripcion || '—'}</td><td style="text-align:right;">${U.colones(l.monto || 0)}</td></tr>`
      ).join('') || '<tr><td colspan="2" style="text-align:center;color:var(--gris-suave);">Sin detalle disponible.</td></tr>';
      U.openModal('modal-detalle-factura');
      document.getElementById('modal-det-numero').textContent = f.numero_factura || `#${idFactura}`;
      document.getElementById('modal-det-periodo').textContent = f.periodo || '—';
      document.getElementById('modal-det-fecha').textContent = f.fecha_emision || '—';
      document.getElementById('modal-det-total').textContent = U.colones(f.total || 0);
      document.getElementById('modal-det-saldo').textContent = U.colones(f.saldo || 0);
      document.getElementById('modal-det-estado').innerHTML = U.badgeEstado(f.estado);
      document.getElementById('modal-det-lineas').innerHTML = lineas;
    } catch (_) { U.toast('Error al cargar detalle de factura.', 'error'); }
  };

  window.imprimirFactura = function (idFactura) {
    window.open(`/billing/factura/${idFactura}/imprimir`, '_blank');
  };

  document.addEventListener('DOMContentLoaded', () => cargar(1));
})();
