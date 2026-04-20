/**
 * Comprobante administrativo por matricula
 */
(function () {
  const idMatricula = window._idMatricula;

  async function cargar() {
    if (!idMatricula || isNaN(idMatricula)) return mostrarVacio();
    try {
      const resp = await axios.get(`/api/enrollment/comprobante/${idMatricula}`);
      const m = resp.data.data || resp.data;
      if (!m || !m.id_matricula) return mostrarVacio();

      document.getElementById('comp-vacio').style.display = 'none';
      document.getElementById('comprobante-cuerpo').style.display = '';

      const alerta = document.getElementById('alerta-estado');
      const alertaTxt = document.getElementById('alerta-estado-texto');
      if (m.estado === 'Confirmada') {
        alerta.className = 'alerta alerta-exito mb-4';
        alertaTxt.innerHTML = `<span class="alerta-titulo">Matricula confirmada.</span> Periodo: ${esc(m.periodo || '-')}.`;
      } else {
        alerta.className = 'alerta alerta-alerta mb-4';
        alertaTxt.innerHTML = `<span class="alerta-titulo">Matricula en proceso.</span> Estado: <strong>${esc(m.estado || '-')}</strong>.`;
      }
      alerta.style.display = '';

      document.getElementById('comp-numero').textContent = m.numero || `MAT-${m.id_matricula}`;
      document.getElementById('comp-periodo-fecha').textContent =
        `${m.periodo || '-'} - ${m.fecha ? new Date(m.fecha).toLocaleDateString('es-CR') : '-'}`;
      document.getElementById('comp-nombre').textContent = m.nombre_estudiante || '-';
      document.getElementById('comp-carne').textContent = m.carne || '-';
      document.getElementById('comp-programa').textContent = m.programa || '-';
      document.getElementById('comp-plan').textContent = m.plan || '-';

      const cursos = Array.isArray(m.cursos) ? m.cursos : [];
      const totalCred = cursos.reduce((sum, c) => sum + (Number(c.creditos) || 0), 0);
      const tbody = document.getElementById('tbody-comp-cursos');
      tbody.innerHTML = cursos.length
        ? cursos.map(c => `<tr>
            <td style="font-family:monospace;font-weight:700;">${esc(c.codigo)}</td>
            <td>${esc(c.nombre)}</td>
            <td>${esc(c.seccion || '-')}</td>
            <td>${esc(c.horario || '-')}</td>
            <td>${esc(c.aula || '-')}</td>
            <td style="text-align:center;font-weight:700;">${Number(c.creditos) || 0}</td>
          </tr>`).join('') + `<tr style="background:var(--verde-bg);">
            <td colspan="5" style="font-weight:700;text-align:right;padding-right:1.25rem;">Total de creditos:</td>
            <td style="text-align:center;font-weight:700;font-size:1.125rem;color:var(--verde-principal);">${totalCred}</td>
          </tr>`
        : '<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:var(--gris-suave);">Sin cursos registrados.</td></tr>';

      document.getElementById('comp-subtotal').textContent = U.colones(m.subtotal || 0);
      document.getElementById('comp-recargos').textContent = U.colones(m.recargos || 0);
      document.getElementById('comp-descuentos').textContent = `-${U.colones(m.descuentos || 0)}`;
      document.getElementById('comp-total').textContent = U.colones(m.total || 0);
      document.getElementById('comp-factura').textContent = m.numero_factura || '-';
      document.getElementById('comp-estado-pago').innerHTML = U.badgeEstado(m.estado_pago || m.estado || 'Pendiente');

      if (m.estado_pago !== 'Pagada' && parseFloat(m.saldo_factura || 0) > 0) {
        const btn = document.getElementById('comp-gestionar-btn');
        if (btn) btn.style.display = '';
      }

      document.getElementById('comp-verificacion').textContent =
        `Verificacion: ${m.numero || `MAT-${m.id_matricula}`}-${String(m.carne || 'UNI').substring(0, 3).toUpperCase()}`;
    } catch (_) {
      mostrarVacio();
    }
  }

  function mostrarVacio() {
    const vacio = document.getElementById('comp-vacio');
    const cuerpo = document.getElementById('comprobante-cuerpo');
    if (vacio) vacio.style.display = '';
    if (cuerpo) cuerpo.style.display = 'none';
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  document.addEventListener('DOMContentLoaded', cargar);
})();
