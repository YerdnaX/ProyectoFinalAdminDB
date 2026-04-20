/**
 * public/js/academic-periodos.js
 * Periodos academicos: listar, crear y editar
 */
(function () {
  const tbody = document.getElementById('tbody-periodos');
  const form = document.getElementById('form-periodo');
  const modalId = 'modal-periodo';

  let cachePeriodos = [];

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

  function filtros() {
    return {
      buscar: (document.getElementById('fil-buscar-periodo')?.value || '').trim(),
      tipo: document.getElementById('sel-tipo-periodo')?.value || '',
      estado: document.getElementById('sel-estado-periodo')?.value || ''
    };
  }

  function rango(fechaInicio, fechaFin) {
    if (!fechaInicio && !fechaFin) return '-';
    if (!fechaInicio) return `- a ${fechaFin}`;
    if (!fechaFin) return `${fechaInicio} a -`;
    return `${fechaInicio} a ${fechaFin}`;
  }

  async function cargar() {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando...</td></tr>';
    try {
      const { data } = await axios.get('/api/academic/periodos', { params: filtros() });
      if (!data?.ok) throw new Error(data?.error || 'No se pudo cargar la lista de periodos');
      cachePeriodos = Array.isArray(data.data) ? data.data : [];
      renderTabla(cachePeriodos);
    } catch (err) {
      cachePeriodos = [];
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--rojo-peligro);padding:1.5rem;">${esc(errorMsg(err, 'Error cargando periodos'))}</td></tr>`;
    }
  }

  function renderTabla(rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;">Sin periodos registrados.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(p => {
      const id = Number(p.id_periodo);
      return `
        <tr>
          <td><span style="font-family:monospace;font-weight:700;">${esc(p.codigo)}</span></td>
          <td><div class="nombre-principal">${esc(p.nombre)}</div></td>
          <td><span class="badge badge-info">${esc(p.tipo_periodo || '-')}</span></td>
          <td class="texto-muted">${esc(rango(p.fecha_inicio, p.fecha_fin))}</td>
          <td class="texto-muted">${esc(rango(p.fecha_inicio_matricula, p.fecha_fin_matricula))}</td>
          <td style="text-align:center;">${Number(p.limite_creditos) || 0}</td>
          <td>${p.activo ? '<span class="badge badge-activo">Activo</span>' : '<span class="badge badge-inactivo">Inactivo</span>'}</td>
          <td><div class="acciones-fila"><button type="button" class="btn btn-secundario btn-sm" onclick="editarPeriodo(${id})">Editar</button></div></td>
        </tr>`;
    }).join('');
  }

  function abrirNuevo() {
    form.reset();
    document.getElementById('periodo-id').value = '';
    document.getElementById('periodo-activo').value = '1';
    document.getElementById('modal-periodo-titulo').textContent = 'Nuevo periodo academico';
    U.openModal(modalId);
    document.getElementById('periodo-codigo')?.focus();
  }

  async function abrirEditar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      U.toast('No se pudo determinar el periodo a editar.', 'error');
      return;
    }

    let periodo = cachePeriodos.find(x => Number(x.id_periodo) === idNum);
    if (!periodo || !periodo.fecha_inicio_matricula) {
      try {
        const { data } = await axios.get(`/api/academic/periodos/${idNum}`);
        if (!data?.ok || !data.data) throw new Error(data?.error || 'Periodo no encontrado');
        periodo = data.data;
      } catch (err) {
        U.toast(errorMsg(err, 'Error al cargar el periodo.'), 'error');
        return;
      }
    }

    document.getElementById('periodo-id').value = String(idNum);
    document.getElementById('periodo-codigo').value = periodo.codigo || '';
    document.getElementById('periodo-nombre').value = periodo.nombre || '';
    document.getElementById('periodo-tipo').value = periodo.tipo_periodo || '';
    document.getElementById('periodo-inicio').value = periodo.fecha_inicio || '';
    document.getElementById('periodo-fin').value = periodo.fecha_fin || '';
    document.getElementById('periodo-inicio-mat').value = periodo.fecha_inicio_matricula || '';
    document.getElementById('periodo-fin-mat').value = periodo.fecha_fin_matricula || '';
    document.getElementById('periodo-creditos').value = periodo.limite_creditos || '';
    document.getElementById('periodo-activo').value = periodo.activo ? '1' : '0';
    document.getElementById('modal-periodo-titulo').textContent = 'Editar periodo academico';
    U.openModal(modalId);
    document.getElementById('periodo-nombre')?.focus();
  }

  window.editarPeriodo = function (id) {
    abrirEditar(id);
  };

  document.getElementById('btn-nuevo-periodo')?.addEventListener('click', abrirNuevo);

  function validar() {
    const codigo = document.getElementById('periodo-codigo').value.trim().toUpperCase();
    const nombre = document.getElementById('periodo-nombre').value.trim();
    const tipo = document.getElementById('periodo-tipo').value;
    const inicio = document.getElementById('periodo-inicio').value;
    const fin = document.getElementById('periodo-fin').value;
    const inicioMat = document.getElementById('periodo-inicio-mat').value;
    const finMat = document.getElementById('periodo-fin-mat').value;
    const limiteCreditos = parseInt(document.getElementById('periodo-creditos').value, 10);
    const activo = document.getElementById('periodo-activo').value === '1';

    if (!codigo) return { ok: false, msg: 'El codigo es obligatorio.', field: 'periodo-codigo' };
    if (!nombre) return { ok: false, msg: 'El nombre es obligatorio.', field: 'periodo-nombre' };
    if (!tipo) return { ok: false, msg: 'El tipo de periodo es obligatorio.', field: 'periodo-tipo' };
    if (!inicio) return { ok: false, msg: 'La fecha de inicio lectivo es obligatoria.', field: 'periodo-inicio' };
    if (!fin) return { ok: false, msg: 'La fecha fin lectiva es obligatoria.', field: 'periodo-fin' };
    if (!inicioMat) return { ok: false, msg: 'La fecha de inicio de matricula es obligatoria.', field: 'periodo-inicio-mat' };
    if (!finMat) return { ok: false, msg: 'La fecha fin de matricula es obligatoria.', field: 'periodo-fin-mat' };
    if (!Number.isInteger(limiteCreditos) || limiteCreditos <= 0) return { ok: false, msg: 'El limite de creditos debe ser mayor a cero.', field: 'periodo-creditos' };
    if (fin <= inicio) return { ok: false, msg: 'La fecha fin lectiva debe ser mayor a la fecha inicio.', field: 'periodo-fin' };
    if (finMat < inicioMat) return { ok: false, msg: 'La fecha fin de matricula no puede ser menor al inicio.', field: 'periodo-fin-mat' };

    return {
      ok: true,
      payload: {
        codigo,
        nombre,
        tipo_periodo: tipo,
        fecha_inicio: inicio,
        fecha_fin: fin,
        fecha_inicio_matricula: inicioMat,
        fecha_fin_matricula: finMat,
        limite_creditos: limiteCreditos,
        activo
      }
    };
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const idVal = document.getElementById('periodo-id').value;
    const btn = form.querySelector('[type="submit"]');
    const check = validar();
    if (!check.ok) {
      U.toast(check.msg, 'error');
      document.getElementById(check.field)?.focus();
      return;
    }

    U.showLoading(btn);
    try {
      const { data } = idVal
        ? await axios.put(`/api/academic/periodos/${Number(idVal)}`, check.payload)
        : await axios.post('/api/academic/periodos', check.payload);

      if (!data?.ok) throw new Error(data?.error || 'No se pudo guardar el periodo');

      U.toast(idVal ? 'Periodo actualizado correctamente.' : 'Periodo creado correctamente.', 'exito');
      U.closeModal(modalId);
      form.reset();
      document.getElementById('periodo-id').value = '';
      await cargar();
    } catch (err) {
      U.toast(errorMsg(err, 'Error guardando el periodo.'), 'error');
    } finally {
      U.hideLoading(btn);
    }
  });

  document.getElementById('btn-buscar-periodo')?.addEventListener('click', cargar);
  document.getElementById('fil-buscar-periodo')?.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') cargar();
  });
  document.getElementById('sel-tipo-periodo')?.addEventListener('change', cargar);
  document.getElementById('sel-estado-periodo')?.addEventListener('change', cargar);

  cargar();
})();
