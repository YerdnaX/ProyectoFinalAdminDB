(function () {
  const params = new URLSearchParams(window.location.search);
  const idUsuario = params.get('id') || window.location.pathname.split('/').pop();

  async function cargar() {
    if (!idUsuario || isNaN(idUsuario)) {
      U.toast('ID de usuario no válido.', 'error');
      return;
    }
    try {
      const [resUser, resAudit] = await Promise.all([
        axios.get(`/api/usuarios/${idUsuario}`),
        axios.get('/api/audit', { params: { id_usuario: idUsuario, limit: 10 } })
      ]);
      const u = resUser.data.data || resUser.data;
      const nombreCompleto = [u.nombre, u.apellido].filter(Boolean).join(' ');

      // encabezado
      document.getElementById('det-avatar').textContent = U.initials(nombreCompleto || '?');
      document.getElementById('det-nombre').textContent = nombreCompleto || '—';
      document.getElementById('det-subtitulo').textContent =
        `${u.identificador_sso || '—'} · ${u.correo || '—'}`;

      // datos
      document.getElementById('det-id').textContent = `#${u.id_usuario}`;
      document.getElementById('det-nombre-info').textContent = nombreCompleto || '—';
      document.getElementById('det-correo').textContent = u.correo || '—';
      document.getElementById('det-carne').textContent = u.carne || '—';
      document.getElementById('det-sso').textContent = u.identificador_sso || '—';
      document.getElementById('det-rol').innerHTML = `<span class="badge badge-verde">${u.rol || '—'}</span>`;
      document.getElementById('det-estado').innerHTML = U.badgeEstado(u.activo ? 'Activo' : 'Inactivo');
      document.getElementById('det-fecha').textContent = u.fecha_creacion
        ? new Date(u.fecha_creacion).toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' })
        : '—';

      // botón toggle estado
      const btnToggle = document.getElementById('btn-toggle-estado');
      btnToggle.textContent = u.activo ? 'Desactivar cuenta' : 'Activar cuenta';
      btnToggle.className = u.activo ? 'btn btn-peligro' : 'btn btn-primario';
      btnToggle.onclick = async () => {
        try {
          await axios.put(`/api/usuarios/${idUsuario}`, { activo: u.activo ? 0 : 1 });
          U.toast(`Usuario ${u.activo ? 'desactivado' : 'activado'} correctamente.`, 'exito');
          setTimeout(() => location.reload(), 800);
        } catch (err) {
          U.toast('Error al cambiar estado.', 'error');
        }
      };

      // actividad (bitácora)
      const items = resAudit.data.data || [];
      const activ = document.getElementById('det-actividad');
      if (items.length) {
        activ.innerHTML = items.map(a => `
          <div class="timeline-item">
            <div class="timeline-punto"></div>
            <div class="timeline-fecha">${a.fecha ? `${a.fecha} ${a.hora || ''}`.trim() : '—'}</div>
            <div class="timeline-contenido">${a.descripcion || a.accion || '—'}</div>
          </div>`).join('');
      } else {
        activ.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--gris-suave);">Sin actividad registrada.</div>';
      }
    } catch (e) {
      U.toast('Error al cargar usuario.', 'error');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    cargar();
    document.getElementById('btn-editar-usuario').addEventListener('click', () => {
      window.location.href = `/admin/usuarios?editar=${idUsuario}`;
    });
  });
})();
