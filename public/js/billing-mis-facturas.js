(function () {
  const ID_EST = 1; // TODO: replace with session
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
          ? `<a href="/billing/pagar" class="btn btn-primario btn-sm">Pagar</a>`
          : `<button class="btn btn-secundario btn-sm">🖨️</button>`;
        return `<tr>
          <td><span style="font-family:monospace;font-weight:700;">${f.numero || f.id_factura}</span></td>
          <td>${f.periodo || '—'}</td>
          <td class="texto-muted">${f.fecha_emision ? new Date(f.fecha_emision).toLocaleDateString('es-CR') : '—'}</td>
          <td style="text-align:right;font-weight:600;">${U.colones(f.total || 0)}</td>
          <td style="text-align:right;font-weight:600;color:${saldoColor};">${U.colones(saldo)}</td>
          <td>${U.badgeEstado(f.estado)}</td>
          <td><div class="acciones-fila"><button class="btn btn-secundario btn-sm">Ver detalle</button>${acciones}</div></td>
        </tr>`;
      }).join('');

      U.renderPaginacion('#paginacion-mis-facturas', { total, page, limit: LIMIT, onPage: cargar });
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--rojo-peligro);">Error al cargar facturas.</td></tr>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => cargar(1));
})();
