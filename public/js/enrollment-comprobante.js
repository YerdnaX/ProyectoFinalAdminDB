(function () {
  const ID_EST = 1; // TODO: replace with session

  async function cargar() {
    try {
      const params = new URLSearchParams(window.location.search);
      const idParam = params.get('id');
      const url = idParam
        ? `/api/enrollment/comprobante/${idParam}`
        : `/api/enrollment/comprobante/estudiante/${ID_EST}`;

      const resp = await axios.get(url);
      const data = resp.data.data || resp.data;
      if (!data || !data.id_matricula) {
        document.getElementById('comp-vacio').style.display = '';
        return;
      }

      const m = data;
      document.getElementById('comp-vacio').style.display = 'none';
      document.getElementById('comprobante-cuerpo').style.display = '';

      // alerta estado
      const alerta = document.getElementById('alerta-estado');
      const alertaTxt = document.getElementById('alerta-estado-texto');
      if (m.estado === 'Confirmada') {
        alerta.className = 'alerta alerta-exito mb-4';
        alertaTxt.innerHTML = `<span class="alerta-titulo">¡Matrícula confirmada exitosamente!</span> Tu matrícula para el ${m.periodo || 'periodo actual'} fue procesada el ${m.fecha ? new Date(m.fecha).toLocaleDateString('es-CR', { year:'numeric', month:'long', day:'numeric' }) : '—'}.`;
      } else {
        alerta.className = 'alerta alerta-alerta mb-4';
        alertaTxt.innerHTML = `<span class="alerta-titulo">Matrícula en proceso.</span> Estado actual: <strong>${m.estado}</strong>.`;
      }
      alerta.style.display = '';

      // encabezado
      document.getElementById('comp-numero').textContent = m.numero || `MAT-${m.id_matricula}`;
      document.getElementById('comp-periodo-fecha').textContent =
        `${m.periodo || '—'} — ${m.estado === 'Confirmada' ? 'Confirmado el' : 'Registrado el'} ${m.fecha ? new Date(m.fecha).toLocaleDateString('es-CR', { year:'numeric', month:'long', day:'numeric' }) : '—'}`;

      // estudiante
      document.getElementById('comp-nombre').textContent = m.nombre_estudiante || '—';
      document.getElementById('comp-carne').textContent = m.carne || '—';
      document.getElementById('comp-programa').textContent = m.programa || '—';
      document.getElementById('comp-plan').textContent = m.plan || '—';

      // cursos
      const tbody = document.getElementById('tbody-comp-cursos');
      const cursos = m.cursos || [];
      const totalCred = cursos.reduce((s, c) => s + (c.creditos || 0), 0);
      if (cursos.length) {
        tbody.innerHTML = cursos.map(c => `<tr>
          <td style="font-family:monospace;font-weight:700;">${c.codigo}</td>
          <td>${c.nombre}</td>
          <td>${c.seccion || '—'}</td>
          <td>${c.horario || '—'}</td>
          <td>${c.aula || '—'}</td>
          <td style="text-align:center;font-weight:700;">${c.creditos}</td>
        </tr>`).join('') +
          `<tr style="background:var(--verde-bg);">
            <td colspan="5" style="font-weight:700;text-align:right;padding-right:1.25rem;">Total de créditos:</td>
            <td style="text-align:center;font-weight:700;font-size:1.125rem;color:var(--verde-principal);">${totalCred}</td>
          </tr>`;
      } else {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:var(--gris-suave);">Sin cursos registrados.</td></tr>';
      }

      // cobro
      document.getElementById('comp-subtotal').textContent = U.colones(m.subtotal || 0);
      document.getElementById('comp-recargos').textContent = U.colones(m.recargos || 0);
      document.getElementById('comp-descuentos').textContent = `−${U.colones(m.descuentos || 0)}`;
      document.getElementById('comp-total').textContent = U.colones(m.total || 0);

      // factura
      document.getElementById('comp-factura').textContent = m.numero_factura || '—';
      document.getElementById('comp-estado-pago').innerHTML = U.badgeEstado(m.estado_pago || m.estado);
      if (m.estado_pago !== 'Pagada' && parseFloat(m.saldo_factura || 0) > 0) {
        document.getElementById('comp-pagar-btn').style.display = '';
      }

      // verificación
      document.getElementById('comp-verificacion').textContent =
        `Verificación: ${m.numero || `MAT-${m.id_matricula}`}-${(m.carne || 'UNI').substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    } catch (e) {
      document.getElementById('comp-vacio').style.display = '';
      document.getElementById('comprobante-cuerpo').style.display = 'none';
    }
  }

  document.addEventListener('DOMContentLoaded', cargar);
})();
