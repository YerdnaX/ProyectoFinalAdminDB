/**
 * public/js/academic-planes.js
 * Planes de estudio: listar, crear y editar
 */
(function () {
  const tbody = document.getElementById('tbody-planes');
  const form = document.getElementById('form-plan');
  const modalId = 'modal-plan';
  let cachePlanes = [];

  if (!tbody || !form) return;

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function errorMsg(err, fallback) {
    return err?.response?.data?.error || err?.message || fallback;
  }

  function formatPrograma(row) {
    const codigo = row.programa_codigo || '';
    const nombre = row.programa_nombre || '';
    if (codigo && nombre) return `${codigo} - ${nombre}`;
    return nombre || codigo || '-';
  }

  async function cargar() {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando...</td></tr>';
    try {
      const { data } = await axios.get('/api/academic/planes');
      if (!data?.ok) throw new Error(data?.error || 'No se pudo cargar la lista de planes');
      cachePlanes = Array.isArray(data.data) ? data.data : [];
      renderTabla(cachePlanes);
    } catch (err) {
      cachePlanes = [];
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--rojo-peligro);padding:1.5rem;">${esc(errorMsg(err, 'Error cargando planes'))}</td></tr>`;
    }
  }

  function renderTabla(rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gris-suave);">Sin planes registrados.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(p => {
      const id = Number(p.id_plan);
      return `
        <tr>
          <td><span style="font-family:monospace;font-weight:700;">${esc(p.codigo)}</span></td>
          <td><div class="nombre-principal">${esc(p.nombre)}</div></td>
          <td class="texto-muted">${esc(formatPrograma(p))}</td>
          <td class="texto-muted">${esc(p.fecha_inicio || '-')}</td>
          <td class="texto-muted">${esc(p.fecha_fin || '-')}</td>
          <td style="text-align:center;">${Number(p.total_cursos) || 0}</td>
          <td>${p.activo ? '<span class="badge badge-activo">Activo</span>' : '<span class="badge badge-inactivo">Inactivo</span>'}</td>
          <td>
            <div class="acciones-fila">
              <button type="button" class="btn btn-secundario btn-sm" onclick="editarPlan(${id})">Editar</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  async function cargarProgramas() {
    const sel = document.getElementById('plan-programa');
    if (!sel) return;
    const first = '<option value="">Seleccionar programa...</option>';
    try {
      const { data } = await axios.get('/api/academic/programas');
      if (!data?.ok) throw new Error(data?.error || 'No se pudo cargar programas');
      const rows = Array.isArray(data.data) ? data.data : [];
      sel.innerHTML = first + rows.map(p => `<option value="${Number(p.id_programa)}">${esc(p.codigo)} - ${esc(p.nombre)}</option>`).join('');
    } catch (_) {
      sel.innerHTML = first;
    }
  }

  async function abrirNuevo() {
    form.reset();
    document.getElementById('plan-id').value = '';
    document.getElementById('plan-activo').value = '1';
    document.getElementById('modal-plan-titulo').textContent = 'Nuevo plan de estudio';
    await cargarProgramas();
    U.openModal(modalId);
    document.getElementById('plan-codigo')?.focus();
  }

  async function abrirEditar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      U.toast('No se pudo determinar el plan a editar.', 'error');
      return;
    }

    await cargarProgramas();

    let plan = cachePlanes.find(x => Number(x.id_plan) === idNum);
    if (!plan || !plan.id_programa) {
      try {
        const { data } = await axios.get(`/api/academic/planes/${idNum}`);
        if (!data?.ok || !data.data) throw new Error(data?.error || 'Plan no encontrado');
        plan = data.data;
      } catch (err) {
        U.toast(errorMsg(err, 'Error al cargar el plan.'), 'error');
        return;
      }
    }

    document.getElementById('plan-id').value = String(idNum);
    document.getElementById('plan-codigo').value = plan.codigo || '';
    document.getElementById('plan-nombre').value = plan.nombre || '';
    document.getElementById('plan-programa').value = String(plan.id_programa || '');
    document.getElementById('plan-inicio').value = plan.fecha_inicio || '';
    document.getElementById('plan-fin').value = plan.fecha_fin || '';
    document.getElementById('plan-activo').value = plan.activo ? '1' : '0';
    document.getElementById('modal-plan-titulo').textContent = 'Editar plan de estudio';
    U.openModal(modalId);
    document.getElementById('plan-nombre')?.focus();
  }

  document.getElementById('btn-nuevo-plan')?.addEventListener('click', abrirNuevo);

  window.editarPlan = function (id) {
    abrirEditar(id);
  };

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const idVal = document.getElementById('plan-id').value;
    const codigo = document.getElementById('plan-codigo').value.trim().toUpperCase();
    const nombre = document.getElementById('plan-nombre').value.trim();
    const idPrograma = document.getElementById('plan-programa').value;
    const inicio = document.getElementById('plan-inicio').value;
    const fin = document.getElementById('plan-fin').value;
    const activo = document.getElementById('plan-activo').value === '1';
    const btn = form.querySelector('[type="submit"]');

    if (!codigo) { U.toast('El codigo es obligatorio.', 'error'); document.getElementById('plan-codigo').focus(); return; }
    if (!nombre) { U.toast('El nombre es obligatorio.', 'error'); document.getElementById('plan-nombre').focus(); return; }
    if (!idPrograma) { U.toast('Debes seleccionar un programa.', 'error'); document.getElementById('plan-programa').focus(); return; }
    if (!inicio) { U.toast('La fecha de inicio es obligatoria.', 'error'); document.getElementById('plan-inicio').focus(); return; }
    if (fin && fin <= inicio) { U.toast('La fecha fin debe ser mayor a la fecha inicio.', 'error'); document.getElementById('plan-fin').focus(); return; }

    U.showLoading(btn);
    try {
      const payload = {
        codigo,
        nombre,
        id_programa: Number(idPrograma),
        fecha_vigencia_inicio: inicio,
        fecha_vigencia_fin: fin || null,
        activo
      };

      const { data } = idVal
        ? await axios.put(`/api/academic/planes/${Number(idVal)}`, payload)
        : await axios.post('/api/academic/planes', payload);

      if (!data?.ok) throw new Error(data?.error || 'No se pudo guardar el plan');

      U.toast(idVal ? 'Plan actualizado correctamente.' : 'Plan creado correctamente.', 'exito');
      U.closeModal(modalId);
      form.reset();
      document.getElementById('plan-id').value = '';
      await cargar();
    } catch (err) {
      U.toast(errorMsg(err, 'Error guardando el plan.'), 'error');
    } finally {
      U.hideLoading(btn);
    }
  });

  cargar();
})();
