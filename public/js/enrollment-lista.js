(function () {
  let paginaActual = 1;
  const LIMIT = 15;

  async function cargarPeriodos() {
    try {
      const { data } = await axios.get('/api/academic/periodos');
      const sel = document.getElementById('sel-periodo');
      (data.data || []).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id_periodo;
        opt.textContent = p.nombre;
        sel.appendChild(opt);
      });
    } catch (_) {}
  }

  async function cargar(page) {
    paginaActual = page;
    const tbody = document.getElementById('tbody-matriculas');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>';
    const params = {
      page, limit: LIMIT,
      buscar: document.getElementById('fil-buscar').value,
      estado: document.getElementById('sel-estado').value,
      periodo: document.getElementById('sel-periodo').value
    };
    try {
      const resp = await axios.get('/api/enrollment/lista', { params });
      const data = resp.data;
      const items = data.matriculas || data.data || data;
      const total = data.total || items.length;

      // métricas
      if (data.metricas) {
        const m = data.metricas;
        document.getElementById('met-total').textContent = (m.total || 0).toLocaleString('es-CR');
        document.getElementById('met-confirmadas').textContent = (m.confirmadas || 0).toLocaleString('es-CR');
        document.getElementById('met-proceso').textContent = (m.en_proceso || 0).toLocaleString('es-CR');
        document.getElementById('met-canceladas').textContent = (m.canceladas || 0).toLocaleString('es-CR');
        if (m.total) {
          document.getElementById('met-pct-conf').textContent =
            ((m.confirmadas / m.total) * 100).toFixed(1) + '%';
        }
      }

      if (!items.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">No se encontraron matrículas.</td></tr>';
        return;
      }

      tbody.innerHTML = items.map(m => `<tr>
        <td><span style="font-family:monospace;font-weight:700;">${m.numero || m.id_matricula}</span></td>
        <td><div class="nombre-principal">${m.nombre_estudiante || '—'}</div><div class="detalle-secundario">${m.carne || '—'}</div></td>
        <td class="texto-muted">${m.fecha ? new Date(m.fecha).toLocaleDateString('es-CR') : '—'}</td>
        <td style="text-align:center;">${m.num_cursos || 0}</td>
        <td style="text-align:center;font-weight:700;">${m.creditos || 0}</td>
        <td style="font-weight:600;">${U.colones(m.monto || 0)}</td>
        <td>${U.badgeEstado(m.estado)}</td>
      </tr>`).join('');

      U.renderPaginacion('#paginacion-matriculas', { total, page, limit: LIMIT, onPage: cargar });
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--rojo-peligro);">Error al cargar matrículas.</td></tr>`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    cargarPeriodos();
    cargar(1);
    document.getElementById('btn-buscar').addEventListener('click', () => cargar(1));
    document.getElementById('fil-buscar').addEventListener('keydown', e => { if (e.key === 'Enter') cargar(1); });
  });
})();

