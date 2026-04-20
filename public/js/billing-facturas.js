/**
 * Admin: lista de facturas con filtros y detalle
 */
(function () {
  let page = 1;
  let estado = '';
  let buscar = '';
  const LIMIT = 10;

  const tbody = document.getElementById('tbody-facturas');
  const inBus = document.getElementById('input-buscar');
  const selEstado = document.getElementById('sel-estado');
  let debounce;

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando...</td></tr>';

    try {
      const { data } = await axios.get('/api/billing/facturas', {
        params: { page, limit: LIMIT, estado, buscar }
      });
      if (!data.ok) throw new Error(data.error || 'No se pudo cargar facturas');
      renderTabla(data.data || [], data.total || 0);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--rojo-peligro);">${esc(e.message)}</td></tr>`;
    }
  }

  function renderTabla(rows, total) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;">Sin resultados</td></tr>';
    } else {
      tbody.innerHTML = rows.map(f => {
        const saldo = parseFloat(f.saldo || 0);
        return `
          <tr>
            <td><span style="font-family:monospace;font-weight:700;">${esc(f.numero_factura)}</span></td>
            <td>
              <div class="nombre-principal">${esc(f.estudiante || '-')}</div>
              <div class="detalle-secundario">${esc(f.carne || '-')}</div>
            </td>
            <td class="texto-muted">${esc(f.periodo || '-')}</td>
            <td class="texto-muted">${esc(f.fecha_emision || '-')}</td>
            <td style="text-align:right;font-weight:700;">${U.colones(f.total || 0)}</td>
            <td style="text-align:right;font-weight:700;color:${saldo > 0 ? 'var(--rojo-peligro)' : 'var(--cyan-exito)'};">${U.colones(saldo)}</td>
            <td>${U.badgeEstado(f.estado || '-')}</td>
            <td>
              <div class="acciones-fila">
                <button class="btn btn-secundario btn-sm" onclick="verFactura(${f.id_factura})">Ver</button>
              </div>
            </td>
          </tr>`;
      }).join('');
    }

    U.renderPaginacion('#paginacion-facturas', {
      total,
      page,
      limit: LIMIT,
      onPage: p => {
        page = p;
        cargar();
      }
    });
  }

  window.verFactura = async function (idFactura) {
    if (window.BillingDetalleFactura?.open) {
      return window.BillingDetalleFactura.open(idFactura);
    }
    U.toast('No se pudo abrir el detalle de factura.', 'error');
  };

  inBus?.addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      buscar = e.target.value.trim();
      page = 1;
      cargar();
    }, 300);
  });

  selEstado?.addEventListener('change', e => {
    estado = e.target.value;
    page = 1;
    cargar();
  });

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  cargar();
})();
