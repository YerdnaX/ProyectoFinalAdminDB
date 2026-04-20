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
  function activarCambioContrasena() {
    const btn = document.getElementById('btn-cambiar-contrasena-sso');
    if (!btn) return;

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const actual = window.prompt('Digite su contrasena actual:');
      if (actual === null) return;
      const nueva = window.prompt('Digite su nueva contrasena:');
      if (nueva === null) return;
      const confirmar = window.prompt('Confirme su nueva contrasena:');
      if (confirmar === null) return;

      if (!actual || !nueva || !confirmar) {
        U.toast('Todos los campos son obligatorios.', 'error');
        return;
      }
      if (nueva.length < 6) {
        U.toast('La nueva contrasena debe tener al menos 6 caracteres.', 'error');
        return;
      }
      if (nueva !== confirmar) {
        U.toast('Las contrasenas nuevas no coinciden.', 'error');
        return;
      }
      if (actual === nueva) {
        U.toast('La nueva contrasena debe ser diferente a la actual.', 'error');
        return;
      }

      try {
        const { data } = await axios.post('/api/auth/cambiar-contrasena', {
          contrasena_actual: actual,
          contrasena_nueva: nueva,
          contrasena_confirmacion: confirmar
        });
        if (!data?.ok) throw new Error(data?.error || 'No se pudo cambiar la contrasena');
        U.toast('Contrasena actualizada.', 'exito');
      } catch (err) {
        U.toast(err?.response?.data?.error || err.message || 'Error al cambiar contrasena.', 'error');
      }
    });
  }
  document.addEventListener('DOMContentLoaded', () => {
    cargar();
    activarCambioContrasena();
  });
})();

