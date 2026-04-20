(function () {
  let programas = [];

  async function cargarRoles() {
    try {
      const { data } = await axios.get('/api/usuarios/roles/lista');
      const sel = document.getElementById('crear-rol');
      if (!sel) return;
      (data.data || []).forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id_rol;
        opt.textContent = r.nombre;
        sel.appendChild(opt);
      });
    } catch (_) {}
  }

  async function cargarProgramas() {
    try {
      const { data } = await axios.get('/api/academic/programas', { params: { estado: '1' } });
      if (!data?.ok) return;
      programas = data.data || [];
      const sel = document.getElementById('crear-programa');
      if (!sel) return;
      sel.innerHTML = '<option value="">Selecciona un programa...</option>' +
        programas.map(p => `<option value="${p.id_programa}">${esc(p.nombre)}</option>`).join('');
    } catch (_) {}
  }

  function esRolEstudiante() {
    const rolSel = document.getElementById('crear-rol');
    const txt = rolSel?.options[rolSel.selectedIndex]?.text || '';
    return /estudiante/i.test(txt);
  }

  function toggleCamposEstudiante() {
    const box = document.getElementById('bloque-estudiante');
    if (!box) return;
    const on = esRolEstudiante();
    box.style.display = on ? '' : 'none';
    const selProg = document.getElementById('crear-programa');
    if (selProg) selProg.required = on;
  }

  function actualizarPreview() {
    const nombre = document.getElementById('crear-nombre').value.trim();
    const apellido = document.getElementById('crear-apellidos').value.trim();
    const rolSel = document.getElementById('crear-rol');
    const nombreCompleto = [nombre, apellido].filter(Boolean).join(' ');

    document.getElementById('preview-avatar').textContent = U.initials(nombreCompleto || '?');
    document.getElementById('preview-nombre').textContent = nombreCompleto || 'El nombre aparecera aqui';
    document.getElementById('preview-rol').textContent =
      rolSel.options[rolSel.selectedIndex]?.text || '-';

    toggleCamposEstudiante();
  }

  function validar() {
    const nombre = document.getElementById('crear-nombre').value.trim();
    const apellido = document.getElementById('crear-apellidos').value.trim();
    const correo = document.getElementById('crear-correo').value.trim();
    const sso = document.getElementById('crear-sso').value.trim();
    const rol = document.getElementById('crear-rol').value;
    const pass1 = document.getElementById('crear-contrasena').value;
    const pass2 = document.getElementById('crear-contrasena2').value;

    if (!nombre)   { U.toast('El nombre es obligatorio.', 'error'); document.getElementById('crear-nombre').focus(); return false; }
    if (!apellido) { U.toast('El apellido es obligatorio.', 'error'); document.getElementById('crear-apellidos').focus(); return false; }
    if (!correo)   { U.toast('El correo es obligatorio.', 'error'); document.getElementById('crear-correo').focus(); return false; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(correo)) { U.toast('El formato del correo no es valido.', 'error'); document.getElementById('crear-correo').focus(); return false; }
    if (!sso)      { U.toast('El identificador SSO es obligatorio.', 'error'); document.getElementById('crear-sso').focus(); return false; }
    if (!rol)      { U.toast('Debes seleccionar un rol.', 'error'); document.getElementById('crear-rol').focus(); return false; }
    if (!pass1)    { U.toast('La contrasena es obligatoria.', 'error'); document.getElementById('crear-contrasena').focus(); return false; }
    if (pass1 !== pass2) { U.toast('Las contrasenas no coinciden.', 'error'); document.getElementById('crear-contrasena2').focus(); return false; }

    if (esRolEstudiante()) {
      const prog = document.getElementById('crear-programa').value;
      if (!prog) { U.toast('Debes seleccionar un programa para el estudiante.', 'error'); document.getElementById('crear-programa').focus(); return false; }
    }

    return true;
  }

  async function crear(e) {
    e.preventDefault();
    if (!validar()) return;
    const btn = document.getElementById('btn-crear-submit');
    U.showLoading(btn);
    try {
      const payload = {
        nombre: document.getElementById('crear-nombre').value.trim(),
        apellido: document.getElementById('crear-apellidos').value.trim(),
        correo: document.getElementById('crear-correo').value.trim(),
        identificador_sso: document.getElementById('crear-sso').value.trim(),
        id_rol: document.getElementById('crear-rol').value,
        activo: document.getElementById('crear-activo').checked ? 1 : 0,
        contrasena: document.getElementById('crear-contrasena').value
      };

      if (esRolEstudiante()) {
        payload.id_programa = document.getElementById('crear-programa').value;
        const carne = document.getElementById('crear-carne').value.trim();
        if (carne) payload.carne = carne;
      }

      const { data } = await axios.post('/api/usuarios', payload);
      if (!data.ok) throw new Error(data.error || 'Error al crear usuario');
      U.toast('Usuario creado correctamente.', 'exito');
      setTimeout(() => { window.location.href = '/admin/usuarios'; }, 800);
    } catch (err) {
      U.toast(err.response?.data?.error || err.message || 'Error al crear usuario.', 'error');
      U.hideLoading(btn);
    }
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await cargarRoles();
    await cargarProgramas();
    ['crear-nombre', 'crear-apellidos', 'crear-rol'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', actualizarPreview);
      document.getElementById(id)?.addEventListener('change', actualizarPreview);
    });
    document.getElementById('btn-crear-submit')?.addEventListener('click', crear);
    actualizarPreview();
  });
})();
