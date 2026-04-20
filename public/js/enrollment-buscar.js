/**
 * public/js/enrollment-buscar.js
 * Buscar secciones disponibles y agregarlas a la matrícula
 */
(function () {
  const idEst = window._idEstudiante;

  const tbody  = document.getElementById('tbody-secciones');
  const inBus  = document.getElementById('input-buscar');
  const selProg= document.getElementById('sel-programa');

  let matActual = null;
  let limiteCreditos = 20;
  let debounce;

  async function cargarEstadoMatricula() {
    try {
      const { data } = await axios.get(`/api/enrollment/${idEst}`);
      matActual = data.data || null;
      if (matActual) limiteCreditos = matActual.limite_creditos || 20;
    } catch (_) {}
    actualizarContador();
  }

  function actualizarContador() {
    const cursos   = matActual?.detalle?.length || 0;
    const creditos = matActual?.total_creditos  || 0;
    const contEl   = document.getElementById('span-contador-buscar');
    const limEl    = document.getElementById('span-lim-cred-buscar');
    const actEl    = document.getElementById('span-cred-actual-buscar');
    if (contEl) contEl.innerHTML = `Cursos seleccionados: <strong>${cursos}</strong> / Créditos: <strong>${creditos} / ${limiteCreditos}</strong>`;
    if (limEl)  limEl.textContent  = String(limiteCreditos);
    if (actEl)  actEl.textContent  = String(creditos);
  }

  async function buscar() {
    if (!tbody) return;
    const q = inBus?.value?.trim();
    const p = selProg?.value;
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Buscando…</td></tr>`;
    try {
      const params = { id_estudiante: idEst };
      if (q) params.buscar = q;
      const { data } = await axios.get('/api/enrollment/secciones', { params });
      if (!data.ok) throw new Error(data.error);

      // Actualizar nombre del periodo
      const perEl = document.getElementById('span-periodo-buscar');
      if (perEl && data.nombre_periodo) perEl.textContent = data.nombre_periodo;

      renderSecciones(data.data || [], data._debug);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--rojo-peligro);">Error: ${e.message}</td></tr>`;
    }
  }

  function renderSecciones(secs, debug) {
    if (!secs.length) {
      let msg = 'Sin resultados';
      if (debug) {
        if (!debug.idEstudiante) {
          msg = 'No se pudo identificar tu sesión de estudiante. Intenta cerrar sesión y volver a ingresar.';
        } else if (!debug.idPrograma) {
          msg = 'Tu usuario no tiene un programa académico asignado. Contacta al administrador.';
        } else if (!debug.planEncontrado || debug.cursosEnPlan === 0) {
          msg = `El plan del programa <strong>${debug.nombrePrograma || ''}</strong> no tiene cursos registrados. El administrador debe crear cursos y asignarlos a este plan.`;
        } else {
          msg = `Tu plan tiene <strong>${debug.cursosEnPlan}</strong> curso(s) asignado(s), pero ninguno tiene secciones abiertas en el periodo actual. El administrador debe crear secciones para: ${(debug.cursosList || []).join(', ')}.`;
        }
      }
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">${msg}</td></tr>`;
      return;
    }
    // Secciones ya en matrícula
    const yaMatriculados = new Set((matActual?.detalle || []).map(d => d.id_seccion));

    tbody.innerHTML = secs.map(s => {
      const cupos = s.cupo_disponible ?? 0;
      const cupoColor = cupos === 0 ? 'var(--rojo-peligro)' : cupos < 5 ? 'var(--amarillo-alerta)' : 'var(--cyan-exito)';
      const enMatricula = yaMatriculados.has(s.id_seccion);
      const boton = enMatricula
        ? `<button class="btn btn-sm" disabled style="background:var(--verde-bg);color:var(--verde-principal);">✓ Agregado</button>`
        : cupos === 0
          ? `<button class="btn btn-sm" disabled style="opacity:.5;">Sin cupo</button>`
          : `<button class="btn btn-primario btn-sm" onclick="agregarCurso(${s.id_seccion}, this)">+ Agregar</button>`;
      return `
        <tr>
          <td><span style="font-family:monospace;color:var(--verde-principal);font-weight:700;">${esc(s.curso_codigo)}</span></td>
          <td><div class="nombre-principal">${esc(s.curso_nombre)}</div>
              <div class="detalle-secundario">${esc(s.creditos)} créditos${s.prerrequisitos ? ' · Prerrq: ' + esc(s.prerrequisitos) : ''}</div></td>
          <td>${esc(s.codigo_seccion)}</td>
          <td class="texto-muted">${esc(s.docente||'—')}</td>
          <td class="texto-muted">${esc(s.horario||'—')}</td>
          <td><span style="color:${cupoColor};font-weight:600;">${cupos}/${s.cupo_maximo}</span></td>
          <td>${boton}</td>
        </tr>`;
    }).join('');
  }

  window.agregarCurso = async function (idSeccion, btn) {
    U.showLoading(btn);
    try {
      const { data } = await axios.post('/api/enrollment', { id_estudiante: idEst, id_seccion: idSeccion });
      if (!data.ok) throw new Error(data.error);
      U.toast('Curso agregado a tu matrícula', 'exito');
      btn.textContent = '✓ Agregado';
      btn.disabled = true;
      btn.style.background = 'var(--verde-bg)';
      btn.style.color = 'var(--verde-principal)';
      await cargarEstadoMatricula();
    } catch (e) {
      U.toast('Error: ' + (e.response?.data?.error || e.message), 'error');
      U.hideLoading(btn);
    }
  };

  inBus?.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(buscar, 400);
  });
  selProg?.addEventListener('change', buscar);
  document.getElementById('btn-buscar')?.addEventListener('click', buscar);

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // Cargar estado de matrícula y luego las secciones
  cargarEstadoMatricula().then(buscar);
})();
