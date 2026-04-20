/**
 * public/js/academic-secciones.js
 * Secciones: listar, buscar, crear, editar y eliminar
 */
(function () {
  const tbody = document.getElementById('tbody-secciones');
  const inBuscar = document.getElementById('input-buscar-secciones');
  const selPeriodo = document.getElementById('filtro-periodo');
  const selAula = document.getElementById('filtro-aula');
  const selEstado = document.getElementById('filtro-estado');

  const formCrear = document.getElementById('form-crear-seccion');
  const formEditar = document.getElementById('form-editar-seccion');

  const catalogos = { cursos: [], periodos: [], aulas: [], docentes: [] };
  const filtros = { buscar: '', periodo: '', aula: '', estado: '' };
  let debounce;

  async function fetchCatalogo(url, params = {}) {
    try {
      const { data } = await axios.get(url, { params });
      if (!data?.ok) return [];
      return Array.isArray(data.data) ? data.data : [];
    } catch (_) {
      return [];
    }
  }

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando...</td></tr>`;
    try {
      const { data } = await axios.get('/api/academic/secciones', { params: filtros });
      if (!data.ok) throw new Error(data.error || 'No se pudo cargar secciones');
      renderTabla(data.data || []);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--rojo-peligro);">${esc(e.message)}</td></tr>`;
    }
  }

  function renderTabla(rows) {
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;">Sin resultados</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map(s => {
      const aulaTxt = s.aula_codigo ? `${s.aula_codigo} - ${s.aula_nombre || ''}` : (s.aula_nombre || '-');
      const estadoSiNo = s.estado === 'Cancelada' ? 'No' : 'Si';
      return `
        <tr>
          <td><span style="font-family:monospace;color:var(--verde-principal);font-weight:700;">${esc(s.codigo_seccion)}</span></td>
          <td>
            <div class="nombre-principal">${esc(s.curso_nombre)}</div>
            <div class="detalle-secundario">${esc(s.curso_codigo)} - ${Number(s.creditos) || 0} creditos</div>
          </td>
          <td>${esc(s.docente || '-')}</td>
          <td>${esc(aulaTxt || '-')}</td>
          <td>${esc(s.horario || '-')}</td>
          <td style="text-align:center;font-weight:700;">${Number(s.cupo_maximo) || 0}</td>
          <td><span class="badge ${estadoSiNo === 'Si' ? 'badge-activo' : 'badge-inactivo'}">${estadoSiNo}</span></td>
          <td>
            <div class="acciones-fila">
              <button class="btn btn-secundario btn-sm" onclick="editarSeccion(${s.id_seccion})">Editar</button>
              <button class="btn btn-secundario btn-sm" onclick="eliminarSeccion(${s.id_seccion})">Eliminar</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  async function cargarCatalogos() {
    catalogos.cursos = await fetchCatalogo('/api/academic/cursos');
    catalogos.periodos = await fetchCatalogo('/api/academic/periodos');
    catalogos.aulas = await fetchCatalogo('/api/academic/aulas');
    catalogos.docentes = await fetchCatalogo('/api/usuarios', { rol: 'Docente', limit: 500 });

    if (!catalogos.docentes.length) {
      try {
        const alt = await axios.get('/api/usuarios', { params: { limit: 500 } });
        if (alt.data?.ok) {
          catalogos.docentes = (alt.data.data || []).filter(u => /docente|profesor/i.test(String(u.rol || '')));
        }
      } catch (_) {}
    }

    if (!catalogos.aulas.length) {
      catalogos.aulas = await fetchCatalogo('/api/academic/aulas', { estado: '' });
    }

    poblarFiltros();
    poblarCombosFormulario(formCrear, false);
    poblarCombosFormulario(formEditar, true);

    if (!catalogos.cursos.length || !catalogos.periodos.length || !catalogos.aulas.length || !catalogos.docentes.length) {
      U.toast('Algunos catalogos no cargaron completos. Verifica cursos, periodos, aulas y docentes activos.', 'info');
    }
  }

  function poblarFiltros() {
    if (selPeriodo) {
      const prev = selPeriodo.value;
      selPeriodo.innerHTML = '<option value="">Todos los periodos</option>' +
        catalogos.periodos.map(p => `<option value="${p.id_periodo}">${esc(p.nombre)}</option>`).join('');
      selPeriodo.value = catalogos.periodos.some(p => String(p.id_periodo) === prev) ? prev : '';
    }

    if (selAula) {
      const prev = selAula.value;
      selAula.innerHTML = '<option value="">Todas las aulas</option>' +
        catalogos.aulas.map(a => `<option value="${a.id_aula}">${esc(a.codigo)} - ${esc(a.nombre)}</option>`).join('');
      selAula.value = catalogos.aulas.some(a => String(a.id_aula) === prev) ? prev : '';
    }
  }

  function poblarCombosFormulario(form, esEdicion) {
    if (!form) return;
    const suf = esEdicion ? '-ed' : '';
    const cursoSel = form.querySelector(`#sec-curso${suf}`);
    const periodoSel = form.querySelector(`#sec-periodo${suf}`);
    const docenteSel = form.querySelector(`#sec-docente${suf}`);
    const aulaSel = form.querySelector(`#sec-aula${suf}`);

    if (cursoSel) {
      const v = cursoSel.value;
      cursoSel.innerHTML = '<option value="">Seleccionar curso...</option>' +
        catalogos.cursos.map(c => `<option value="${c.id_curso}">${esc(c.codigo)} - ${esc(c.nombre)}</option>`).join('');
      if (v) cursoSel.value = v;
    }

    if (periodoSel) {
      const v = periodoSel.value;
      periodoSel.innerHTML = '<option value="">Seleccionar periodo...</option>' +
        catalogos.periodos.map(p => `<option value="${p.id_periodo}">${esc(p.nombre)}</option>`).join('');
      if (v) periodoSel.value = v;
    }

    if (docenteSel) {
      const v = docenteSel.value;
      docenteSel.innerHTML = '<option value="">Seleccionar docente...</option>' +
        catalogos.docentes.map(d => `<option value="${d.id_usuario}">${esc(d.nombre)} ${esc(d.apellido || '')}</option>`).join('');
      if (v) docenteSel.value = v;
    }

    if (aulaSel) {
      const v = aulaSel.value;
      aulaSel.innerHTML = '<option value="">Seleccionar aula...</option>' +
        catalogos.aulas.map(a => `<option value="${a.id_aula}" data-cap="${a.capacidad}">${esc(a.codigo)} - ${esc(a.nombre)}</option>`).join('');
      if (v) aulaSel.value = v;
      actualizarCapacidad(form);
    }
  }

  function getCapacidadSeleccionada(form) {
    const aulaSelect = form.querySelector('[name=id_aula]');
    if (!aulaSelect) return null;
    const opt = aulaSelect.options[aulaSelect.selectedIndex];
    if (!opt || !opt.dataset.cap) return null;
    const cap = parseInt(opt.dataset.cap, 10);
    return Number.isInteger(cap) ? cap : null;
  }

  function actualizarCapacidad(form) {
    const isEd = form === formEditar;
    const capHelp = document.getElementById(isEd ? 'sec-capacidad-help-ed' : 'sec-capacidad-help');
    const cupoInput = document.getElementById(isEd ? 'sec-cupo-ed' : 'sec-cupo');
    const cap = getCapacidadSeleccionada(form);

    if (!capHelp || !cupoInput) return;
    if (!cap) {
      capHelp.textContent = 'Seleccione un aula para validar la capacidad.';
      cupoInput.removeAttribute('max');
      return;
    }

    cupoInput.max = String(cap);
    if (!cupoInput.value) cupoInput.value = String(cap);
    if (parseInt(cupoInput.value, 10) > cap) cupoInput.value = String(cap);
    capHelp.textContent = `Capacidad del aula seleccionada: ${cap}.`;
  }

  function validarFormulario(form) {
    const cap = getCapacidadSeleccionada(form);
    const cupo = parseInt(form.querySelector('[name=cupo_maximo]')?.value || '', 10);
    if (!Number.isInteger(cupo) || cupo <= 0) {
      U.toast('Ingrese un cupo maximo valido', 'error');
      return false;
    }
    if (cap && cupo > cap) {
      U.toast(`El cupo maximo no puede superar la capacidad del aula (${cap})`, 'error');
      return false;
    }

    const dia = (form.querySelector('[name=dia_semana]')?.value || '').trim();
    const hi = (form.querySelector('[name=hora_inicio]')?.value || '').trim();
    const hf = (form.querySelector('[name=hora_fin]')?.value || '').trim();
    if ((dia || hi || hf) && !(dia && hi && hf)) {
      U.toast('Para registrar horario debe completar dia, hora inicio y hora fin', 'error');
      return false;
    }
    if (hi && hf && hi >= hf) {
      U.toast('La hora fin debe ser mayor a la hora inicio', 'error');
      return false;
    }

    return true;
  }

  window.editarSeccion = async function (id) {
    try {
      await cargarCatalogos();
      const { data } = await axios.get(`/api/academic/secciones/${id}`);
      if (!data.ok || !data.data) throw new Error(data.error || 'No se pudo cargar seccion');
      const s = data.data;

      formEditar.dataset.id = String(id);
      formEditar.querySelector('[name=codigo_seccion]').value = s.codigo_seccion || '';
      formEditar.querySelector('[name=id_curso]').value = s.id_curso || '';
      formEditar.querySelector('[name=id_periodo]').value = s.id_periodo || '';
      formEditar.querySelector('[name=id_docente_usuario]').value = s.id_docente_usuario || '';
      formEditar.querySelector('[name=id_aula]').value = s.id_aula || '';
      formEditar.querySelector('[name=cupo_maximo]').value = s.cupo_maximo || '';
      formEditar.querySelector('[name=dia_semana]').value = s.dia_semana || '';
      formEditar.querySelector('[name=hora_inicio]').value = (s.hora_inicio || '').slice(0, 5);
      formEditar.querySelector('[name=hora_fin]').value = (s.hora_fin || '').slice(0, 5);

      actualizarCapacidad(formEditar);
      U.openModal('modal-editar-seccion');
    } catch (e) {
      U.toast('Error al cargar seccion: ' + (e.response?.data?.error || e.message), 'error');
    }
  };

  window.eliminarSeccion = async function (id) {
    const ok = window.confirm('Desea eliminar esta sesion?');
    if (!ok) return;
    try {
      const { data } = await axios.delete(`/api/academic/secciones/${id}`);
      if (!data.ok) throw new Error(data.error || 'No se pudo eliminar seccion');
      U.toast(data.mensaje || 'Sesion eliminada', 'exito');
      await cargar();
    } catch (e) {
      U.toast('Error al eliminar: ' + (e.response?.data?.error || e.message), 'error');
    }
  };

  document.getElementById('btn-nueva-seccion')?.addEventListener('click', async () => {
    formCrear?.reset();
    try {
      await cargarCatalogos();
    } catch (_) {}
    actualizarCapacidad(formCrear);
    U.openModal('modal-crear-seccion');
  });

  formCrear?.querySelector('[name=id_aula]')?.addEventListener('change', () => actualizarCapacidad(formCrear));
  formEditar?.querySelector('[name=id_aula]')?.addEventListener('change', () => actualizarCapacidad(formEditar));

  formCrear?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validarFormulario(formCrear)) return;
    const btn = formCrear.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const payload = Object.fromEntries(new FormData(formCrear));
      const { data } = await axios.post('/api/academic/secciones', payload);
      if (!data.ok) throw new Error(data.error || 'No se pudo crear seccion');
      U.toast('Sesion creada', 'exito');
      U.closeModal('modal-crear-seccion');
      formCrear.reset();
      await cargar();
    } catch (e2) {
      U.toast('Error: ' + (e2.response?.data?.error || e2.message), 'error');
    } finally {
      U.hideLoading(btn);
    }
  });

  formEditar?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validarFormulario(formEditar)) return;
    const id = formEditar.dataset.id;
    if (!id) return U.toast('No hay sesion seleccionada para editar', 'error');
    const btn = formEditar.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const payload = Object.fromEntries(new FormData(formEditar));
      const { data } = await axios.put(`/api/academic/secciones/${id}`, payload);
      if (!data.ok) throw new Error(data.error || 'No se pudo actualizar seccion');
      U.toast('Sesion actualizada', 'exito');
      U.closeModal('modal-editar-seccion');
      await cargar();
    } catch (e2) {
      U.toast('Error: ' + (e2.response?.data?.error || e2.message), 'error');
    } finally {
      U.hideLoading(btn);
    }
  });

  inBuscar?.addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      filtros.buscar = e.target.value.trim();
      cargar();
    }, 300);
  });

  selPeriodo?.addEventListener('change', e => {
    filtros.periodo = e.target.value;
    cargar();
  });

  selAula?.addEventListener('change', e => {
    filtros.aula = e.target.value;
    cargar();
  });

  selEstado?.addEventListener('change', e => {
    filtros.estado = e.target.value;
    cargar();
  });

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  (async function init() {
    await cargarCatalogos();
    await cargar();
  })();
})();
