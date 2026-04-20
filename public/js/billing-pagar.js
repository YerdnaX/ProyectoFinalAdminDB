/**
 * Estudiante: realizar pago de facturas pendientes
 */
(function () {
  const idEst = window._idEstudiante;
  const params = new URLSearchParams(window.location.search);
  const facturaPreseleccionada = params.get('factura');

  const tbody = document.getElementById('tbody-facturas-pend');
  const formPago = document.getElementById('form-pagar');
  const selFactura = document.getElementById('sel-factura');
  const inpMonto = document.getElementById('inp-monto');

  async function cargarFacturas() {
    try {
      const { data } = await axios.get(`/api/billing/facturas/estudiante/${idEst}`);
      if (!data.ok) throw new Error(data.error || 'No se pudo cargar facturas');

      const facturas = Array.isArray(data.data) ? data.data : [];
      const pendientes = facturas.filter(f => f.estado !== 'Pagada' && f.estado !== 'Anulada' && parseFloat(f.saldo || 0) > 0);

      if (tbody) {
        tbody.innerHTML = pendientes.length
          ? pendientes.map(f => `
              <tr>
                <td><span style="font-family:monospace;">${esc(f.numero_factura)}</span></td>
                <td class="texto-muted">${esc(f.periodo)}</td>
                <td style="font-weight:600;">${U.colones(f.total || 0)}</td>
                <td style="color:var(--rojo-peligro);font-weight:700;">${U.colones(f.saldo || 0)}</td>
                <td>${U.badgeEstado(f.estado)}</td>
              </tr>`).join('')
          : '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--cyan-exito);">No tienes facturas pendientes.</td></tr>';
      }

      if (selFactura) {
        selFactura.innerHTML = '<option value="">Seleccionar factura...</option>';
        pendientes.forEach(f => {
          selFactura.insertAdjacentHTML(
            'beforeend',
            `<option value="${f.id_factura}" data-saldo="${f.saldo}">${esc(f.numero_factura)} - Saldo: ${U.colones(f.saldo || 0)}</option>`
          );
        });

        if (facturaPreseleccionada && pendientes.some(f => String(f.id_factura) === String(facturaPreseleccionada))) {
          selFactura.value = String(facturaPreseleccionada);
          actualizarMontoSegunFactura();
        }
      }
    } catch (e) {
      U.toast('Error al cargar facturas: ' + e.message, 'error');
    }
  }

  function actualizarMontoSegunFactura() {
    const opt = selFactura?.selectedOptions?.[0];
    const saldo = opt?.dataset?.saldo;
    if (inpMonto && saldo) inpMonto.value = parseFloat(saldo).toFixed(2);
  }

  selFactura?.addEventListener('change', actualizarMontoSegunFactura);

  formPago?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = formPago.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const idFactura = parseInt(selFactura?.value || '', 10);
      const monto = parseFloat(inpMonto?.value || '0');
      const metodo = document.getElementById('sel-metodo')?.value;
      if (!Number.isInteger(idFactura) || !monto || monto <= 0 || !metodo) {
        throw new Error('Completa todos los campos obligatorios');
      }

      const { data } = await axios.post('/api/billing/pagar', {
        id_factura: idFactura,
        monto,
        metodo_pago: metodo
      });
      if (!data.ok) throw new Error(data.error || 'No se pudo registrar el pago');

      U.toast(`Pago registrado. Referencia: ${data.referencia}`, 'exito');
      formPago.reset();
      await cargarFacturas();

      const compEl = document.getElementById('comprobante-resultado');
      if (compEl) {
        compEl.style.display = 'block';
        compEl.innerHTML = `
          <div class="alerta alerta-verde">
            <span class="alerta-icono">OK</span>
            <div>
              <div><strong>Pago registrado exitosamente</strong></div>
              <div>Referencia: <code>${esc(data.referencia)}</code> · Nuevo estado: ${esc(data.nuevo_estado)}</div>
            </div>
          </div>`;
      }
    } catch (err) {
      U.toast('Error: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      U.hideLoading(btn);
    }
  });

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  cargarFacturas();
})();
