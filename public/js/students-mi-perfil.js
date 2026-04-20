(function () {
  const ID_EST = window._idEstudiante;

  async function cargar() {
    try {
      const resp = await axios.get(`/api/students/${ID_EST}`);
      const e = resp.data.data || resp.data;
      const nombreCompleto = [e.nombre, e.apellido].filter(Boolean).join(' ');

      document.getElementById('perfil-avatar').textContent = U.initials(nombreCompleto || '?');
      document.getElementById('perfil-nombre-completo').textContent = nombreCompleto || '—';
      document.getElementById('perfil-email').textContent = e.correo || '—';
      document.getElementById('perfil-nombre').value = e.nombre || '';
      document.getElementById('perfil-apellido').value = e.apellido || '';
      document.getElementById('perfil-correo').value = e.correo || '';
      document.getElementById('perfil-carne').textContent = e.carne || '—';
      document.getElementById('perfil-estado-acad').innerHTML = U.badgeEstado(e.estado_academico || 'Regular');
      document.getElementById('perfil-programa').textContent = e.programa || '—';
      document.getElementById('perfil-plan').textContent = e.plan_estudio || '—';
      document.getElementById('perfil-ingreso').textContent = e.fecha_ingreso
        ? new Date(e.fecha_ingreso).toLocaleDateString('es-CR', { year: 'numeric', month: 'long' })
        : '—';
      document.getElementById('perfil-sso').textContent = e.identificador_sso || '—';

      // Estado cuenta
      const bloqFin = e.bloqueado_financiero;
      const bloqAcad = e.bloqueado_academico;
      document.getElementById('perfil-bloqueo-fin').innerHTML =
        bloqFin ? '<span class="badge badge-peligro">Bloqueado</span>' : '<span class="badge badge-activo">Sin bloqueo</span>';
      document.getElementById('perfil-bloqueo-acad').innerHTML =
        bloqAcad ? '<span class="badge badge-peligro">Bloqueado</span>' : '<span class="badge badge-activo">Sin bloqueo</span>';
      const saldo = parseFloat(e.saldo_pendiente || 0);
      const saldoEl = document.getElementById('perfil-saldo');
      saldoEl.textContent = U.colones(saldo);
      saldoEl.style.color = saldo > 0 ? 'var(--rojo-peligro)' : 'var(--cyan-exito)';
    } catch (e) {
      console.error('Error cargando perfil:', e);
    }
  }

  document.addEventListener('DOMContentLoaded', cargar);
})();
