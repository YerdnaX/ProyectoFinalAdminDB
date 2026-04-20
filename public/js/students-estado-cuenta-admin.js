/**
 * Estado de cuenta administrativo para un estudiante
 */
(function () {
  const idEst = window._idEstudiante;

  async function cargar() {
    if (!idEst || isNaN(idEst)) return;
    try {
      const { data } = await axios.get(`/api/billing/estado-cuenta/${idEst}`);
      if (!data.ok) throw new Error(data.error || 'No se pudo cargar el estado de cuenta');

      const p = data.perfil;
      if (p) {
        setText('est-nombre', p.nombre);
        setText('est-carne', p.carne);
        setText('est-saldo', U.colones(p.saldo_pendiente));
        const saldoEl = document.getElementById('est-saldo');
        if (saldoEl) saldoEl.style.color = parseFloat(p.saldo_pendiente) > 0 ? 'var(--rojo-peligro)' : 'var(--cyan-exito)';
        if (p.bloqueado_financiero) {
          const blq = document.getElementById('alerta-bloqueo');
          if (blq) blq.style.display = 'flex';
        }
      }

      const tbody = document.getElementById('tbody-estados');
      if (!tbody) return;
      if (!data.estados || !data.estados.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;">Sin registros</td></tr>';
        return;
      }

      tbody.innerHTML = data.estados.map(e => `
        <tr>
          <td class="texto-muted">${esc(e.fecha_generacion)}</td>
          <td>${esc(e.periodo)}</td>
          <td style="font-weight:600;">${U.colones(e.monto_total)}</td>
          <td style="color:var(--cyan-exito);font-weight:600;">${U.colones(e.monto_pagado)}</td>
          <td style="color:${parseFloat(e.saldo_pendiente) > 0 ? 'var(--rojo-peligro)' : 'var(--cyan-exito)'};font-weight:600;">${U.colones(e.saldo_pendiente)}</td>
          <td>${U.badgeEstado(e.estado)}</td>
        </tr>`).join('');
    } catch (err) {
      U.toast('Error al cargar estado de cuenta: ' + err.message, 'error');
    }
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '-';
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  cargar();
})();
