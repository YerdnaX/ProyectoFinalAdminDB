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

  /* ── Pago manual ─────────────────────────────────────────────── */
  document.getElementById('btn-pago-manual')?.addEventListener('click', () => {
    document.getElementById('form-pago-manual')?.reset();
    document.getElementById('pago-id-factura').value = '';
    document.getElementById('pago-info-factura').style.display = 'none';
    U.openModal('modal-pago-manual');
  });

  // Buscar factura por número
  document.getElementById('btn-buscar-factura')?.addEventListener('click', async () => {
    const numero = document.getElementById('pago-numero-factura').value.trim();
    if (!numero) { U.toast('Ingresa el número de factura.', 'error'); return; }
    const infoEl  = document.getElementById('pago-info-factura');
    const detalle = document.getElementById('pago-factura-detalle');
    try {
      const { data } = await axios.get('/api/billing/facturas', { params: { buscar: numero, limit: 5 } });
      const facturas = data.data || [];
      const f = facturas.find(x => x.numero_factura === numero) || facturas[0];
      if (!f) { U.toast('Factura no encontrada.', 'error'); infoEl.style.display = 'none'; return; }
      if (f.estado === 'Pagada') { U.toast('Esta factura ya está pagada.', 'error'); infoEl.style.display = 'none'; return; }

      document.getElementById('pago-id-factura').value = f.id_factura;
      document.getElementById('pago-monto').value = parseFloat(f.saldo || 0).toFixed(2);
      detalle.innerHTML = `
        <strong>${esc(f.numero_factura)}</strong> &nbsp;·&nbsp; ${esc(f.estudiante || '—')} (${esc(f.carne || '—')})<br>
        Periodo: ${esc(f.periodo || '—')} &nbsp;·&nbsp;
        Total: ${U.colones(f.total)} &nbsp;·&nbsp;
        <span style="color:var(--rojo-peligro);font-weight:600;">Saldo: ${U.colones(f.saldo)}</span>`;
      infoEl.style.display = '';
    } catch (_) { U.toast('Error al buscar factura.', 'error'); }
  });

  // También buscar al presionar Enter en el campo
  document.getElementById('pago-numero-factura')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btn-buscar-factura')?.click(); }
  });

  // Submit pago manual
  document.getElementById('form-pago-manual')?.addEventListener('submit', async e => {
    e.preventDefault();
    const idFactura = document.getElementById('pago-id-factura').value;
    const monto     = document.getElementById('pago-monto').value;
    const metodo_p  = document.getElementById('pago-metodo').value;
    const btn       = document.getElementById('btn-pago-submit');

    if (!idFactura)  { U.toast('Primero busca y selecciona una factura.', 'error'); return; }
    if (!monto || parseFloat(monto) <= 0) { U.toast('El monto debe ser mayor a cero.', 'error'); document.getElementById('pago-monto').focus(); return; }
    if (!metodo_p)   { U.toast('Selecciona el método de pago.', 'error'); document.getElementById('pago-metodo').focus(); return; }

    U.showLoading(btn);
    try {
      const { data } = await axios.post('/api/billing/pagar', {
        id_factura:  idFactura,
        monto:       parseFloat(monto),
        metodo_pago: metodo_p,
        referencia_pasarela: document.getElementById('pago-referencia').value.trim() || undefined,
        observacion: document.getElementById('pago-observacion').value.trim() || undefined
      });
      if (!data.ok) throw new Error(data.error);
      U.toast('Pago registrado correctamente.', 'exito');
      U.closeModal('modal-pago-manual');
      cargar();
    } catch (err) {
      U.toast('Error: ' + (err.response?.data?.error || err.message), 'error');
    } finally { U.hideLoading(btn); }
  });

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargar();
})();
