/**
 * public/js/billing-estado.js
 * Estudiante: estado de cuenta (estado_cuenta + saldo)
 */
(function () {
  const idEst = window._idEstudiante;

  async function cargar() {
    try {
      const { data } = await axios.get(`/api/billing/estado-cuenta/${idEst}`);
      if (!data.ok) throw new Error(data.error);

      const p = data.perfil;
      if (p) {
        setText('est-nombre',  p.nombre);
        setText('est-carne',   p.carne);
        setText('est-saldo',   U.colones(p.saldo_pendiente));
        const saldoEl = document.getElementById('est-saldo');
        if (saldoEl) saldoEl.style.color = parseFloat(p.saldo_pendiente) > 0 ? 'var(--rojo-peligro)' : 'var(--cyan-exito)';
        if (p.bloqueado_financiero) {
          const blq = document.getElementById('alerta-bloqueo');
          if (blq) blq.style.display = 'flex';
        }
      }

      const tbody = document.getElementById('tbody-estados');
      if (tbody) {
        if (!data.estados?.length) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">Sin registros de estado de cuenta.</td></tr>';
        } else {
          tbody.innerHTML = data.estados.map(e => `
            <tr>
              <td class="texto-muted">${esc(e.fecha_generacion)}</td>
              <td>${esc(e.periodo)}</td>
              <td style="text-align:right;font-weight:600;">${U.colones(e.monto_total)}</td>
              <td style="text-align:right;color:var(--cyan-exito);font-weight:600;">${U.colones(e.monto_pagado)}</td>
              <td style="text-align:right;color:${parseFloat(e.saldo_pendiente)>0?'var(--rojo-peligro)':'var(--cyan-exito)'};font-weight:600;">${U.colones(e.saldo_pendiente)}</td>
              <td>${U.badgeEstado(e.estado)}</td>
            </tr>`).join('');

          // Actualizar totales del pie
          const totalCargos  = data.estados.reduce((s, e) => s + parseFloat(e.monto_total  || 0), 0);
          const totalAbonos  = data.estados.reduce((s, e) => s + parseFloat(e.monto_pagado || 0), 0);
          const saldoActual  = p ? parseFloat(p.saldo_pendiente || 0) : data.estados.reduce((s, e) => s + parseFloat(e.saldo_pendiente || 0), 0);
          setText('est-total-cargos', U.colones(totalCargos));
          setText('est-total-abonos', U.colones(totalAbonos));
          const saldoPieEl = document.getElementById('est-saldo-pie');
          if (saldoPieEl) {
            saldoPieEl.textContent = U.colones(saldoActual);
            saldoPieEl.style.color = saldoActual > 0 ? 'var(--rojo-peligro)' : 'var(--cyan-exito)';
          }
        }
      }
    } catch (err) {
      U.toast('Error al cargar estado de cuenta: ' + err.message, 'error');
    }
  }

  function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val || '—'; }
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargar();
})();
