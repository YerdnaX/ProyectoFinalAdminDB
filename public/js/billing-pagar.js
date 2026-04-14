/**
 * public/js/billing-pagar.js
 * Estudiante: realizar pago de una factura
 */
(function () {
  const idEst = document.querySelector('meta[name=id-estudiante]')?.content
              || document.body.dataset.idEstudiante
              || 1;

  const tbody    = document.getElementById('tbody-facturas-pend');
  const formPago = document.getElementById('form-pagar');
  const selFac   = document.getElementById('sel-factura');

  // Cargar facturas pendientes del estudiante
  async function cargarFacturas() {
    try {
      const { data } = await axios.get(`/api/billing/facturas/estudiante/${idEst}`);
      if (!data.ok) throw new Error(data.error);
      const pendientes = data.data.filter(f => f.estado !== 'Pagada' && f.estado !== 'Anulada');

      if (tbody) {
        if (!pendientes.length) {
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--cyan-exito);">✅ No tienes facturas pendientes</td></tr>';
        } else {
          tbody.innerHTML = pendientes.map(f => `
            <tr>
              <td><span style="font-family:monospace;">${esc(f.numero_factura)}</span></td>
              <td class="texto-muted">${esc(f.periodo)}</td>
              <td style="font-weight:600;">${U.colones(f.total)}</td>
              <td style="color:var(--rojo-peligro);font-weight:600;">${U.colones(f.saldo)}</td>
              <td>${U.badgeEstado(f.estado)}</td>
            </tr>`).join('');
        }
      }

      if (selFac) {
        selFac.innerHTML = '<option value="">Seleccionar factura…</option>';
        pendientes.forEach(f => {
          selFac.insertAdjacentHTML('beforeend',
            `<option value="${f.id_factura}" data-saldo="${f.saldo}">${esc(f.numero_factura)} — Saldo: ${U.colones(f.saldo)}</option>`
          );
        });
      }
    } catch (e) {
      U.toast('Error al cargar facturas: ' + e.message, 'error');
    }
  }

  selFac?.addEventListener('change', () => {
    const opt = selFac.selectedOptions[0];
    const saldo = opt?.dataset?.saldo;
    const montoEl = document.getElementById('inp-monto');
    if (montoEl && saldo) montoEl.value = parseFloat(saldo).toFixed(2);
  });

  formPago?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = formPago.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const body = {
        id_factura:  selFac?.value,
        monto:       document.getElementById('inp-monto')?.value,
        metodo_pago: document.getElementById('sel-metodo')?.value,
      };
      if (!body.id_factura || !body.monto || !body.metodo_pago)
        throw new Error('Completa todos los campos');

      const { data } = await axios.post('/api/billing/pagar', body);
      if (!data.ok) throw new Error(data.error);

      U.toast(`Pago registrado. Referencia: ${data.referencia}`, 'exito');
      formPago.reset();
      cargarFacturas();

      // Mostrar comprobante inline
      const compEl = document.getElementById('comprobante-resultado');
      if (compEl) {
        compEl.style.display = 'block';
        compEl.innerHTML = `
          <div class="alerta alerta-verde">
            <span class="alerta-icono">✅</span>
            <div>
              <div><strong>Pago registrado exitosamente</strong></div>
              <div>Referencia: <code>${esc(data.referencia)}</code> · Nuevo estado: ${esc(data.nuevo_estado)}</div>
            </div>
          </div>`;
      }
    } catch (err) {
      U.toast('Error: ' + (err.response?.data?.error || err.message), 'error');
    } finally { U.hideLoading(btn); }
  });

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargarFacturas();
})();
