(function () {
  async function cargarRoles() {
    try {
      const { data } = await axios.get('/api/usuarios/roles/lista');
      const sel = document.getElementById('crear-rol');
      (data.data || []).forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id_rol;
        opt.textContent = r.nombre;
        sel.appendChild(opt);
      });
    } catch (_) {}
  }

  function actualizarPreview() {
    const nombre = document.getElementById('crear-nombre').value.trim();
    const apellido = document.getElementById('crear-apellidos').value.trim();
    const rolSel = document.getElementById('crear-rol');
    const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ');

    document.getElementById('preview-avatar').textContent = U.initials(nombreCompleto || '?');
    document.getElementById('preview-nombre').textContent = nombreCompleto || 'El nombre aparecerá aquí';
    document.getElementById('preview-rol').textContent =
      rolSel.options[rolSel.selectedIndex]?.text || '—';
  }

  async function crear(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-crear-submit');
    U.showLoading(btn);
    try {
      const { data } = await axios.post('/api/usuarios', {
        nombre:           document.getElementById('crear-nombre').value.trim(),
        apellido:         document.getElementById('crear-apellidos').value.trim(),
        correo:           document.getElementById('crear-correo').value.trim(),
        identificador_sso: document.getElementById('crear-sso').value.trim(),
        id_rol:           document.getElementById('crear-rol').value,
        activo:           document.getElementById('crear-activo').checked ? 1 : 0
      });
      if (!data.ok) throw new Error(data.error || 'Error al crear usuario');
      U.toast('Usuario creado correctamente.', 'exito');
      setTimeout(() => { window.location.href = '/admin/usuarios'; }, 800);
    } catch (err) {
      U.toast(err.response?.data?.error || err.message || 'Error al crear usuario.', 'error');
      U.hideLoading(btn, 'Crear usuario');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    cargarRoles();
    ['crear-nombre', 'crear-apellidos', 'crear-rol'].forEach(id => {
      document.getElementById(id)?.addEventListener('input',  actualizarPreview);
      document.getElementById(id)?.addEventListener('change', actualizarPreview);
    });
    document.getElementById('btn-crear-submit')?.addEventListener('click', crear);
  });
})();
