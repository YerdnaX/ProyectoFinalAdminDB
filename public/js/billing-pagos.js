/**
 * Admin: lista de pagos con filtros
 */
(function () {
  let page = 1;
  let metodo = '';
  let estado = '';
  let buscar = '';
  const LIMIT = 10;

  const tbody = document.getElementById('tbody-pagos');
  const selMet = document.getElementById('sel-metodo');
  const selEst = document.getElementById('sel-estado');
  const inBuscar = document.getElementById('input-buscar-pagos');
  const totalRecaudadoEl = document.getElementById('total-recaudado');
  const totalFiltradosEl = document.getElementById('total-filtrados');
  const paginaActualEl = document.getElementById('pagina-actual');
  let debounce;

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando...</td></tr>';

    try {
      const { data } = await axios.get('/api/billing/pagos', {
        params: { page, limit: LIMIT, metodo, estado, buscar }
      });
      if (!data.ok) throw new Error(data.error || 'No se pudo cargar pagos');

      if (totalRecaudadoEl) totalRecaudadoEl.textContent = U.colones(data.total_recaudado || 0);
      if (totalFiltradosEl) totalFiltradosEl.textContent = (data.total || 0).toLocaleString('es-CR');
      if (paginaActualEl) paginaActualEl.textContent = String(page);

      renderTabla(data.data || [], data.total || 0);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--rojo-peligro);">${esc(e.message)}</td></tr>`;
    }
  }

  function renderTabla(rows, total) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;">Sin resultados</td></tr>';
    } else {
      tbody.innerHTML = rows.map(p => `
        <tr>
          <td class="texto-muted">${esc(p.fecha_pago || '-')}</td>
          <td>
            <div class="nombre-principal">${esc(p.estudiante || '-')}</div>
            <div class="detalle-secundario">${esc(p.carne || '-')}</div>
          </td>
          <td><span style="font-family:monospace;">${esc(p.numero_factura || '-')}</span></td>
          <td><span class="badge badge-info">${esc(p.metodo_pago || '-')}</span></td>
          <td class="texto-muted" style="font-size:.8rem;">${esc(p.referencia_pasarela || '-')}</td>
          <td style="text-align:right;font-weight:700;color:var(--verde-principal);">${U.colones(p.monto || 0)}</td>
          <td>${U.badgeEstado(p.estado || '-')}</td>
          <td>
            <div class="acciones-fila">
              <button type="button" class="btn btn-secundario btn-sm" onclick="verFacturaPago(${Number(p.id_factura) || 0})">Ver factura</button>
            </div>
          </td>
        </tr>`).join('');
    }

    U.renderPaginacion('#paginacion-pagos', {
      total,
      page,
      limit: LIMIT,
      onPage: p2 => {
        page = p2;
        cargar();
      }
    });
  }

  selMet?.addEventListener('change', e => {
    metodo = e.target.value;
    page = 1;
    cargar();
  });

  selEst?.addEventListener('change', e => {
    estado = e.target.value;
    page = 1;
    cargar();
  });

  inBuscar?.addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      buscar = e.target.value.trim();
      page = 1;
      cargar();
    }, 300);
  });

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  window.verFacturaPago = async function (idFactura) {
    if (window.BillingDetalleFactura?.open) {
      return window.BillingDetalleFactura.open(idFactura);
    }
    U.toast('No se pudo abrir el detalle de factura.', 'error');
  };

  cargar();
})();
