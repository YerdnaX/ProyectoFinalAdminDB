/**
 * public/js/academic-secciones.js
 * Secciones: listar con búsqueda y crear
 */
(function () {
  let page = 1, buscar = '';
  const LIMIT = 10;
  const tbody = document.getElementById('tbody-secciones');
  const inBus = document.getElementById('input-buscar');

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>`;
    try {
      const { data } = await axios.get('/api/academic/secciones', { params: { page, limit: LIMIT, buscar } });
      if (!data.ok) throw new Error(data.error);
      renderTabla(data.data, data.total);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--rojo-peligro);">${e.message}</td></tr>`;
    }
  }

  function renderTabla(rows, total) {
    if (!rows.length) { tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;">Sin resultados</td></tr>`; return; }
    tbody.innerHTML = rows.map(s => {
      const inscritos = s.cupo_maximo - s.cupo_disponible;
      const pct = s.cupo_maximo > 0 ? Math.round((inscritos / s.cupo_maximo) * 100) : 0;
      const color = pct >= 90 ? 'var(--rojo-peligro)' : pct >= 70 ? 'var(--amarillo-alerta)' : 'var(--cyan-exito)';
      return `
        <tr>
          <td><span style="font-family:monospace;color:var(--verde-principal);font-weight:700;">${esc(s.curso_codigo)}</span></td>
          <td><div class="nombre-principal">${esc(s.curso_nombre)}</div></td>
          <td style="text-align:center;">${esc(s.codigo_seccion)}</td>
          <td class="texto-muted">${esc(s.docente||'—')}</td>
          <td class="texto-muted">${esc(s.aula||'—')}</td>
          <td class="texto-muted" style="font-size:.8rem;">${esc(s.horario||'—')}</td>
          <td>
            <div style="display:flex;align-items:center;gap:.5rem;">
              <div style="flex:1;background:var(--gris-linea);border-radius:4px;height:6px;">
                <div style="width:${pct}%;background:${color};height:6px;border-radius:4px;"></div>
              </div>
              <span style="font-size:.8rem;color:${color};font-weight:600;">${inscritos}/${s.cupo_maximo}</span>
            </div>
          </td>
          <td>${U.badgeEstado(s.estado)}</td>
        </tr>`;
    }).join('');
    U.renderPaginacion('#paginacion-secciones', { total, page, limit: LIMIT, onPage: p => { page = p; cargar(); } });
  }

  /* ── Poblar selects del modal ────────────────────────────────── */
  async function cargarCatalogos() {
    const [resCursos, resPeriodos, resAulas, resDocentes] = await Promise.allSettled([
      axios.get('/api/academic/cursos'),
      axios.get('/api/academic/periodos'),
      axios.get('/api/academic/aulas'),
      axios.get('/api/usuarios', { params: { rol: 'Docente', limit: 200 } })
    ]);

    const poblar = (selId, items, valFn, textFn, primera = '') => {
      const sel = document.getElementById(selId);
      if (!sel) return;
      const primerOpt = sel.options[0];
      sel.innerHTML = '';
      if (primera) sel.appendChild(new Option(primera, ''));
      else sel.appendChild(primerOpt || new Option('', ''));
      (items || []).forEach(i => sel.appendChild(new Option(textFn(i), valFn(i))));
    };

    if (resCursos.status === 'fulfilled')
      poblar('sec-curso', resCursos.value.data.data,
        c => c.id_curso, c => `${c.codigo} — ${c.nombre}`, 'Seleccionar curso…');

    if (resPeriodos.status === 'fulfilled')
      poblar('sec-periodo', resPeriodos.value.data.data,
        p => p.id_periodo, p => p.nombre, 'Seleccionar periodo…');

    if (resAulas.status === 'fulfilled')
      poblar('sec-aula', resAulas.value.data.data,
        a => a.id_aula, a => `${a.codigo} — ${a.nombre}`, 'Sin asignar');

    if (resDocentes.status === 'fulfilled')
      poblar('sec-docente', resDocentes.value.data.data,
        u => u.id_usuario, u => `${u.nombre} ${u.apellido}`, 'Sin asignar');
  }

  /* ── Abrir modal para CREAR ──────────────────────────────────── */
  document.getElementById('btn-nueva-seccion')?.addEventListener('click', async () => {
    document.getElementById('form-crear-seccion')?.reset();
    await cargarCatalogos();
    U.openModal('modal-crear-seccion');
  });

  let debounce;
  inBus?.addEventListener('input', e => { clearTimeout(debounce); debounce = setTimeout(() => { buscar = e.target.value.trim(); page = 1; cargar(); }, 400); });

  document.getElementById('form-crear-seccion')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target, btn = form.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const { data } = await axios.post('/api/academic/secciones', Object.fromEntries(new FormData(form)));
      if (!data.ok) throw new Error(data.error);
      U.toast('Sección creada', 'exito');
      U.closeModal('modal-crear-seccion');
      form.reset();
      cargar();
    } catch (err) { U.toast('Error: '+(err.response?.data?.error||err.message),'error');
    } finally { U.hideLoading(btn); }
  });

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargar();
})();
