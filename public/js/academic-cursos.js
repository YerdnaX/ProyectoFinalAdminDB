/**
 * public/js/academic-cursos.js
 * Cursos: listar, filtrar, crear y editar
 */
(function () {
  const tbody = document.getElementById('tbody-cursos');
  const formCrear = document.getElementById('form-crear-curso');
  const formEditar = document.getElementById('form-editar-curso');
  const inBus = document.getElementById('input-buscar');
  const selCr = document.getElementById('sel-creditos');

  const LIMIT = 10;
  let page = 1;
  let buscar = '';
  let creditos = '';
  let cacheCursos = [];

  if (!tbody || !formCrear || !formEditar) return;

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function errorMsg(err, fallback) {
    return err?.response?.data?.error || err?.message || fallback;
  }

  async function cargar() {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando...</td></tr>';
    try {
      const { data } = await axios.get('/api/academic/cursos', { params: { buscar, creditos } });
      if (!data?.ok) throw new Error(data?.error || 'No se pudo cargar la lista de cursos');
      cacheCursos = Array.isArray(data.data) ? data.data : [];
      renderTabla();
    } catch (err) {
      cacheCursos = [];
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--rojo-peligro);padding:1.5rem;">${esc(errorMsg(err, 'Error cargando cursos'))}</td></tr>`;
    }
  }

  function renderTabla() {
    if (!cacheCursos.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;">Sin resultados</td></tr>';
      document.getElementById('paginacion-cursos').innerHTML = '';
      return;
    }

    const total = cacheCursos.length;
    const start = (page - 1) * LIMIT;
    const rows = cacheCursos.slice(start, start + LIMIT);

    tbody.innerHTML = rows.map(c => {
      const id = Number(c.id_curso);
      return `
        <tr>
          <td><span style="font-family:monospace;color:var(--verde-principal);font-weight:700;">${esc(c.codigo)}</span></td>
          <td><div class="nombre-principal">${esc(c.nombre)}</div><div class="detalle-secundario">${esc((c.descripcion || '').slice(0, 70))}</div></td>
          <td style="text-align:center;font-weight:700;">${Number(c.creditos) || 0}</td>
          <td style="text-align:center;">${c.horas_semanales ? Number(c.horas_semanales) : '-'}</td>
          <td class="texto-muted" style="font-size:.8rem;">${esc(c.prerrequisitos || '-')}</td>
          <td>${c.activo ? '<span class="badge badge-activo">Activo</span>' : '<span class="badge badge-inactivo">Inactivo</span>'}</td>
          <td><div class="acciones-fila"><button type="button" class="btn btn-secundario btn-sm" onclick="editarCurso(${id})">Editar</button></div></td>
        </tr>`;
    }).join('');

    U.renderPaginacion('#paginacion-cursos', {
      total,
      page,
      limit: LIMIT,
      onPage: p => { page = p; renderTabla(); }
    });
  }

  function limpiarFormulario(form) {
    form.reset();
    const activo = form.querySelector('[name=activo]');
    if (activo) activo.value = '1';
  }

  function abrirCrear() {
    limpiarFormulario(formCrear);
    U.openModal('modal-crear-curso');
    formCrear.querySelector('[name=codigo]')?.focus();
  }

  async function abrirEditar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      U.toast('No se pudo determinar el curso a editar.', 'error');
      return;
    }

    let curso = cacheCursos.find(x => Number(x.id_curso) === idNum);
    if (!curso) {
      try {
        const { data } = await axios.get(`/api/academic/cursos/${idNum}`);
        if (!data?.ok || !data.data) throw new Error(data?.error || 'Curso no encontrado');
        curso = data.data;
      } catch (err) {
        U.toast(errorMsg(err, 'Error al cargar el curso.'), 'error');
        return;
      }
    }

    formEditar.dataset.id = String(idNum);
    formEditar.querySelector('[name=codigo]').value = curso.codigo || '';
    formEditar.querySelector('[name=nombre]').value = curso.nombre || '';
    formEditar.querySelector('[name=creditos]').value = curso.creditos || '';
    formEditar.querySelector('[name=horas_semanales]').value = curso.horas_semanales || '';
    formEditar.querySelector('[name=descripcion]').value = curso.descripcion || '';
    formEditar.querySelector('[name=activo]').value = curso.activo ? '1' : '0';
    U.openModal('modal-editar-curso');
    formEditar.querySelector('[name=nombre]')?.focus();
  }

  window.editarCurso = function (id) {
    abrirEditar(id);
  };

  function validarCurso(form) {
    const codigo = form.querySelector('[name=codigo]').value.trim().toUpperCase();
    const nombre = form.querySelector('[name=nombre]').value.trim();
    const creditosVal = parseInt(form.querySelector('[name=creditos]').value, 10);
    const horasRaw = form.querySelector('[name=horas_semanales]').value;
    const horasVal = horasRaw === '' ? null : parseInt(horasRaw, 10);

    if (!codigo) return { ok: false, msg: 'El codigo es obligatorio.', focus: '[name=codigo]' };
    if (!nombre) return { ok: false, msg: 'El nombre es obligatorio.', focus: '[name=nombre]' };
    if (!Number.isInteger(creditosVal) || creditosVal <= 0) return { ok: false, msg: 'Los creditos deben ser mayores a cero.', focus: '[name=creditos]' };
    if (horasVal !== null && (!Number.isInteger(horasVal) || horasVal <= 0)) return { ok: false, msg: 'Las horas semanales deben ser mayores a cero.', focus: '[name=horas_semanales]' };

    return {
      ok: true,
      payload: {
        codigo,
        nombre,
        creditos: creditosVal,
        horas_semanales: horasVal,
        descripcion: form.querySelector('[name=descripcion]').value.trim() || null,
        activo: form.querySelector('[name=activo]').value === '1'
      }
    };
  }

  formCrear.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = formCrear.querySelector('[type="submit"]');
    const check = validarCurso(formCrear);
    if (!check.ok) { U.toast(check.msg, 'error'); formCrear.querySelector(check.focus)?.focus(); return; }

    U.showLoading(btn);
    try {
      const { data } = await axios.post('/api/academic/cursos', check.payload);
      if (!data?.ok) throw new Error(data?.error || 'No se pudo crear el curso');
      U.toast('Curso creado correctamente.', 'exito');
      U.closeModal('modal-crear-curso');
      limpiarFormulario(formCrear);
      page = 1;
      await cargar();
    } catch (err) {
      U.toast(errorMsg(err, 'Error creando curso.'), 'error');
    } finally {
      U.hideLoading(btn);
    }
  });

  formEditar.addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = Number(formEditar.dataset.id);
    const btn = formEditar.querySelector('[type="submit"]');
    if (!Number.isInteger(id) || id <= 0) { U.toast('No hay curso seleccionado para editar.', 'error'); return; }

    const check = validarCurso(formEditar);
    if (!check.ok) { U.toast(check.msg, 'error'); formEditar.querySelector(check.focus)?.focus(); return; }

    U.showLoading(btn);
    try {
      const { data } = await axios.put(`/api/academic/cursos/${id}`, check.payload);
      if (!data?.ok) throw new Error(data?.error || 'No se pudo actualizar el curso');
      U.toast('Curso actualizado correctamente.', 'exito');
      U.closeModal('modal-editar-curso');
      await cargar();
    } catch (err) {
      U.toast(errorMsg(err, 'Error actualizando curso.'), 'error');
    } finally {
      U.hideLoading(btn);
    }
  });

  document.getElementById('btn-nuevo-curso')?.addEventListener('click', abrirCrear);

  let debounce;
  inBus?.addEventListener('input', function (e) {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      buscar = e.target.value.trim();
      page = 1;
      cargar();
    }, 350);
  });

  selCr?.addEventListener('change', function (e) {
    creditos = e.target.value;
    page = 1;
    cargar();
  });

  cargar();
})();
