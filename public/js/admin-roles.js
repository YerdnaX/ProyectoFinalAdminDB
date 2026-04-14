/**
 * public/js/admin-roles.js
 * Gestión de roles y permisos — carga desde la base de datos
 */
(function () {
  let rolActivo = null;
  let todosLosPermisos = [];
  let asignados = [];
  let todosLosRoles = [];

  async function cargar() {
    try {
      const { data } = await axios.get('/api/usuarios/roles/permisos');
      if (!data.ok) throw new Error(data.error);

      todosLosRoles    = data.roles    || [];
      todosLosPermisos = data.permisos || [];
      asignados        = data.asignados || [];

      const lista = document.getElementById('lista-roles');
      if (!lista) return;

      lista.innerHTML = todosLosRoles.map((r, i) => `
        <div class="rol-item" data-id="${r.id_rol}"
             style="padding:.75rem 1.25rem;display:flex;align-items:center;justify-content:space-between;cursor:pointer;${i === 0 ? 'background:var(--verde-bg);border-left:3px solid var(--verde-principal);' : ''}">
          <div>
            <div style="font-weight:600;font-size:.9rem;">${esc(r.nombre)}</div>
            <div class="texto-pequeno">${r.total_usuarios || 0} usuarios · ${r.total_permisos || 0} permisos</div>
          </div>
        </div>`).join('');

      lista.querySelectorAll('.rol-item').forEach(el => {
        el.addEventListener('click', () => seleccionarRol(parseInt(el.dataset.id)));
      });

      if (todosLosRoles.length) seleccionarRol(todosLosRoles[0].id_rol);
    } catch (e) {
      const lista = document.getElementById('lista-roles');
      if (lista) lista.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--rojo-peligro);">Error al cargar roles.</div>';
    }
  }

  function seleccionarRol(idRol) {
    rolActivo = idRol;
    const r = todosLosRoles.find(x => x.id_rol === idRol);
    if (!r) return;

    const titulo = document.getElementById('permisos-titulo');
    if (titulo) titulo.textContent = `Permisos — Rol: ${r.nombre}`;

    document.querySelectorAll('.rol-item').forEach(el => {
      const activo = parseInt(el.dataset.id) === idRol;
      el.style.background  = activo ? 'var(--verde-bg)' : '';
      el.style.borderLeft  = activo ? '3px solid var(--verde-principal)' : '';
    });

    const permisosDelRol = new Set(
      asignados.filter(a => a.id_rol === idRol).map(a => a.id_permiso)
    );

    // Agrupar permisos por prefijo del nombre (antes del primer '_')
    const grupos = {};
    todosLosPermisos.forEach(p => {
      const grupo = p.nombre.split('_')[0] || 'general';
      if (!grupos[grupo]) grupos[grupo] = [];
      grupos[grupo].push(p);
    });

    const gruposHtml = Object.entries(grupos).map(([grupo, perms]) => `
      <div class="campo-grupo" style="margin-bottom:1rem;">
        <div class="campo-grupo-titulo" style="font-weight:700;margin-bottom:.5rem;text-transform:capitalize;">${esc(grupo)}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.625rem;">
          ${perms.map(p => `<label class="campo-checkbox" style="display:flex;align-items:center;gap:.5rem;cursor:pointer;">
            <input type="checkbox" data-permiso="${p.id_permiso}" ${permisosDelRol.has(p.id_permiso) ? 'checked' : ''}>
            <span>${esc(p.descripcion || p.nombre)}</span>
          </label>`).join('')}
        </div>
      </div>`).join('');

    // Insertar en el contenedor
    let cont = document.getElementById('permisos-grupos');
    if (!cont) {
      const tituloEl = document.getElementById('permisos-titulo');
      if (tituloEl) {
        cont = document.createElement('div');
        cont.id = 'permisos-grupos';
        tituloEl.parentNode.appendChild(cont);
      }
    }
    if (cont) cont.innerHTML = todosLosPermisos.length
      ? gruposHtml
      : '<div style="padding:1rem;color:var(--gris-suave);">No hay permisos configurados en el sistema.</div>';
  }

  async function guardarPermisos() {
    if (!rolActivo) return;
    const checks = document.querySelectorAll('#permisos-grupos input[type=checkbox]:checked');
    const permisos = Array.from(checks).map(c => parseInt(c.dataset.permiso));
    try {
      const { data } = await axios.put(`/api/usuarios/roles/${rolActivo}/permisos`, { permisos });
      if (!data.ok) throw new Error(data.error);
      U.toast('Permisos guardados correctamente.', 'exito');
      // Actualizar asignados localmente para reflejar cambios sin recargar
      asignados = asignados.filter(a => a.id_rol !== rolActivo);
      permisos.forEach(id => asignados.push({ id_rol: rolActivo, id_permiso: id }));
    } catch (e) {
      U.toast('Error al guardar permisos: ' + e.message, 'error');
    }
  }

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  document.addEventListener('DOMContentLoaded', () => {
    cargar();
    document.getElementById('btn-guardar-permisos')?.addEventListener('click', guardarPermisos);
  });
})();
