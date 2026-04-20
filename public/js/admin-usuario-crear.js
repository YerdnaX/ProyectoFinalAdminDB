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

  function validar() {
    const nombre   = document.getElementById('crear-nombre').value.trim();
    const apellido = document.getElementById('crear-apellidos').value.trim();
    const correo   = document.getElementById('crear-correo').value.trim();
    const sso      = document.getElementById('crear-sso').value.trim();
    const rol      = document.getElementById('crear-rol').value;
    const pass1    = document.getElementById('crear-contrasena').value;
    const pass2    = document.getElementById('crear-contrasena2').value;

    if (!nombre)   { U.toast('El nombre es obligatorio.', 'error'); document.getElementById('crear-nombre').focus(); return false; }
    if (!apellido) { U.toast('El apellido es obligatorio.', 'error'); document.getElementById('crear-apellidos').focus(); return false; }
    if (!correo)   { U.toast('El correo es obligatorio.', 'error'); document.getElementById('crear-correo').focus(); return false; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(correo)) { U.toast('El formato del correo no es válido.', 'error'); document.getElementById('crear-correo').focus(); return false; }
    if (!sso)      { U.toast('El identificador SSO es obligatorio.', 'error'); document.getElementById('crear-sso').focus(); return false; }
    if (!rol)      { U.toast('Debes seleccionar un rol.', 'error'); document.getElementById('crear-rol').focus(); return false; }
    if (!pass1)    { U.toast('La contraseña es obligatoria.', 'error'); document.getElementById('crear-contrasena').focus(); return false; }
    if (pass1 !== pass2)  { U.toast('Las contraseñas no coinciden.', 'error'); document.getElementById('crear-contrasena2').focus(); return false; }
    return true;
  }

  async function crear(e) {
    e.preventDefault();
    if (!validar()) return;
    const btn = document.getElementById('btn-crear-submit');
    U.showLoading(btn);
    try {
      const { data } = await axios.post('/api/usuarios', {
        nombre:           document.getElementById('crear-nombre').value.trim(),
        apellido:         document.getElementById('crear-apellidos').value.trim(),
        correo:           document.getElementById('crear-correo').value.trim(),
        identificador_sso: document.getElementById('crear-sso').value.trim(),
        id_rol:           document.getElementById('crear-rol').value,
        activo:           document.getElementById('crear-activo').checked ? 1 : 0,
        contrasena:       document.getElementById('crear-contrasena').value
      });
      if (!data.ok) throw new Error(data.error || 'Error al crear usuario');
      U.toast('Usuario creado correctamente.', 'exito');
      setTimeout(() => { window.location.href = '/admin/usuarios'; }, 800);
    } catch (err) {
      U.toast(err.response?.data?.error || err.message || 'Error al crear usuario.', 'error');
      U.hideLoading(btn);
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
