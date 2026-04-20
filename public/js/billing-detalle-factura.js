/**
 * Modal reutilizable para detalle de factura.
 * Uso: BillingDetalleFactura.open(idFactura)
 */
(function () {
  async function open(idFactura) {
    const id = parseInt(idFactura, 10);
    if (!Number.isInteger(id) || id <= 0) {
      U.toast('Factura invalida.', 'error');
      return;
    }

    try {
      const { data } = await axios.get(`/api/billing/facturas/${id}`);
      if (!data.ok) throw new Error(data.error || 'No se pudo cargar la factura');
      const f = data.data || {};

      setText('det-fac-numero', f.numero_factura || `#${id}`);
      setText('det-fac-estudiante', `${f.estudiante || '-'} (${f.carne || '-'})`);
      setText('det-fac-periodo', f.periodo || '-');
      setText('det-fac-total', U.colones(f.total || 0));
      setText('det-fac-saldo', U.colones(f.saldo || 0));
      setHtml('det-fac-estado', U.badgeEstado(f.estado || '-'));

      const lineas = Array.isArray(f.lineas) ? f.lineas : [];
      const tbodyLineas = document.getElementById('det-fac-lineas');
      if (tbodyLineas) {
        tbodyLineas.innerHTML = lineas.length
          ? lineas.map(l => `<tr><td>${esc(l.descripcion || '-')}</td><td style="text-align:right;">${U.colones(l.monto || 0)}</td></tr>`).join('')
          : '<tr><td colspan="2" style="text-align:center;color:var(--gris-suave);">Sin detalle disponible.</td></tr>';
      }

      U.openModal('modal-detalle-factura-global');
    } catch (err) {
      U.toast('Error al cargar factura: ' + (err.response?.data?.error || err.message), 'error');
    }
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '-';
  }

  function setHtml(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html || '-';
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  window.BillingDetalleFactura = { open };
})();
