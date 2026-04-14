/**
 * public/js/students-lista.js
 * Lista de estudiantes con búsqueda, filtros y paginación
 */
(function () {
  let page = 1, buscar = '', programa = '', estado = '';
  const LIMIT = 10;

  const tbody  = document.getElementById('tbody-estudiantes');
  const pgCont = document.getElementById('paginacion-estudiantes');
  const inBus  = document.getElementById('input-buscar');
  const selProg= document.getElementById('sel-programa');
  const selEst = document.getElementById('sel-estado');

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>`;
    try {
      const params = { page, limit: LIMIT };
      if (buscar)   params.buscar   = buscar;
      if (programa) params.programa = programa;
      if (estado)   params.estado   = estado;
      const { data } = await axios.get('/api/students', { params });
      if (!data.ok) throw new Error(data.error);
      renderTabla(data.data, data.total);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--rojo-peligro);">Error: ${e.message}</td></tr>`;
    }
  }

  function renderTabla(rows, total) {
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;">Sin resultados</td></tr>`;
    } else {
      tbody.innerHTML = rows.map(s => {
        const ini = U.initials(`${s.nombre} ${s.apellido}`);
        const saldo = parseFloat(s.saldo_pendiente) || 0;
        const bloqueos = [
          s.bloqueado_financiero ? '<span class="badge badge-error">💰 Financiero</span>' : '',
          s.bloqueado_academico  ? '<span class="badge badge-error">📚 Académico</span>'  : ''
        ].filter(Boolean).join(' ') || '<span class="texto-muted">—</span>';
        return `
          <tr>
            <td><div style="display:flex;align-items:center;gap:.75rem;">
              <div class="avatar">${ini}</div>
              <div><div class="nombre-principal">${esc(s.nombre)} ${esc(s.apellido)}</div>
                   <div class="detalle-secundario">${esc(s.correo||'')}</div></div>
            </div></td>
            <td><span style="font-family:monospace;">${esc(s.carne)}</span></td>
            <td class="texto-muted">${esc(s.programa||'—')}</td>
            <td class="texto-muted">${s.anio_ingreso||'—'}</td>
            <td>${U.badgeEstado(s.estado_academico)}</td>
            <td style="color:${saldo>0?'var(--rojo-peligro)':'var(--cyan-exito)'};font-weight:600;">${U.colones(saldo)}</td>
            <td>${bloqueos}</td>
            <td><div class="acciones-fila">
              <a href="/students/${s.id_estudiante}" class="btn btn-secundario btn-sm">Ver perfil</a>
            </div></td>
          </tr>`;
      }).join('');
    }
    U.renderPaginacion('#paginacion-estudiantes', { total, page, limit: LIMIT,
      onPage: p => { page = p; cargar(); }
    });
  }

  let debounce;
  inBus?.addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { buscar = e.target.value.trim(); page = 1; cargar(); }, 400);
  });
  selProg?.addEventListener('change', e => { programa = e.target.value; page = 1; cargar(); });
  selEst?.addEventListener('change',  e => { estado   = e.target.value; page = 1; cargar(); });

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargar();
})();
