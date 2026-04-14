/**
 * public/js/enrollment-buscar.js
 * Buscar secciones disponibles y agregarlas a la matrícula
 */
(function () {
  const idEst = document.querySelector('meta[name=id-estudiante]')?.content
              || document.body.dataset.idEstudiante
              || 1;

  const tbody  = document.getElementById('tbody-secciones');
  const inBus  = document.getElementById('input-buscar');
  const selProg= document.getElementById('sel-programa');
  let debounce;

  async function buscar() {
    if (!tbody) return;
    const q = inBus?.value?.trim();
    const p = selProg?.value;
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Buscando…</td></tr>`;
    try {
      const params = {};
      if (q) params.buscar   = q;
      if (p) params.programa = p;
      const { data } = await axios.get('/api/enrollment/secciones', { params });
      if (!data.ok) throw new Error(data.error);
      renderSecciones(data.data || []);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--rojo-peligro);">Error: ${e.message}</td></tr>`;
    }
  }

  function renderSecciones(secs) {
    if (!secs.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Sin resultados</td></tr>`;
      return;
    }
    tbody.innerHTML = secs.map(s => {
      const cupos = s.cupo_disponible || 0;
      const cupoColor = cupos < 5 ? 'var(--rojo-peligro)' : cupos < 10 ? 'var(--amarillo-alerta)' : 'var(--cyan-exito)';
      return `
        <tr>
          <td><span style="font-family:monospace;color:var(--verde-principal);font-weight:700;">${esc(s.curso_codigo)}</span></td>
          <td><div class="nombre-principal">${esc(s.curso_nombre)}</div>
              <div class="detalle-secundario">${esc(s.creditos)} créditos</div></td>
          <td>${esc(s.codigo_seccion)}</td>
          <td class="texto-muted">${esc(s.docente||'—')}</td>
          <td class="texto-muted">${esc(s.horario||'—')}</td>
          <td><span style="color:${cupoColor};font-weight:600;">${cupos}/${s.cupo_maximo}</span></td>
          <td>
            <button class="btn btn-primario btn-sm" onclick="agregarCurso(${s.id_seccion}, this)">+ Agregar</button>
          </td>
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
  buscar();
})();
