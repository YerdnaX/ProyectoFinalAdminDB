(function () {
  const ID_EST = 1; // TODO: replace with session

  async function cargar() {
    try {
      const resp = await axios.get(`/api/students/${ID_EST}/historial`);
      const raw = resp.data;
      // API: { ok, data: [{curso_codigo, curso_nombre, creditos, periodo, periodo_codigo, estado, ...}], resumen }
      const cursos = raw.data || [];
      const resumen = raw.resumen || {};

      // Get student info for subtitle
      const respEst = await axios.get(`/api/students/${ID_EST}`);
      const est = respEst.data.data || respEst.data;

      document.getElementById('hist-subtitulo').textContent =
        `${est.programa || '—'} · Plan ${est.plan_estudio || '—'} · Carné ${est.carne || '—'}`;

      // Count approved courses (with calificacion >= 7)
      const aprobados = cursos.filter(c => c.estado === 'Matriculada');
      const creditosAprobados = aprobados.reduce((s, c) => s + (c.creditos || 0), 0);
      const creditosPlan = 160; // default

      document.getElementById('hist-cred-aprobados').textContent = creditosAprobados;
      document.getElementById('hist-cred-plan').textContent = resumen.creditos_acumulados || creditosPlan;
      document.getElementById('hist-cursos-aprobados').textContent = aprobados.length;
      document.getElementById('hist-promedio').textContent = '—';

      const pct = creditosPlan ? Math.round((creditosAprobados / creditosPlan) * 100) : 0;
      document.getElementById('hist-avance-texto').textContent =
        `${creditosAprobados} / ${creditosPlan} créditos (${pct}%)`;
      document.getElementById('hist-barra-avance').style.width = pct + '%';

      // Group by period
      const container = document.getElementById('hist-cursos-container');
      if (!cursos.length) {
        container.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--gris-suave);">Sin historial académico registrado.</div>';
        return;
      }

      const agrupado = {};
      cursos.forEach(c => {
        const per = c.periodo || c.periodo_codigo || 'Sin periodo';
        if (!agrupado[per]) agrupado[per] = [];
        agrupado[per].push(c);
      });

      container.innerHTML = Object.entries(agrupado).map(([per, curs], pi) => {
        const filas = curs.map(c => {
          const nota = parseFloat(c.calificacion || 0);
          const color = nota >= 9 ? 'var(--verde-principal)' : nota >= 7 ? 'var(--cyan-exito)' : 'var(--rojo-peligro)';
          return `<tr>
            <td style="font-family:monospace;color:var(--verde-principal);font-weight:700;">${c.curso_codigo || c.codigo || '—'}</td>
            <td>${c.curso_nombre || c.nombre || '—'}</td>
            <td style="text-align:center;">${c.creditos || 0}</td>
            <td style="text-align:center;font-weight:700;color:${nota > 0 ? color : 'inherit'};">${c.calificacion || '—'}</td>
            <td>${U.badgeEstado(c.estado || 'Matriculada')}</td>
          </tr>`;
        }).join('');
        return `
          <div style="padding:1rem 1.5rem;background:var(--gris-fondo);${pi > 0 ? 'border-top:1px solid var(--gris-linea);' : ''}border-bottom:1px solid var(--gris-linea);font-weight:700;">${per}</div>
          <div class="tabla-contenedor">
            <table class="tabla">
              ${pi === 0 ? '<thead><tr><th>Código</th><th>Curso</th><th>Créditos</th><th>Calificación</th><th>Estado</th></tr></thead>' : ''}
              <tbody>${filas}</tbody>
            </table>
          </div>`;
      }).join('') + `
        <div style="padding:1rem 1.5rem;border-top:1px solid var(--gris-linea);display:flex;justify-content:flex-end;gap:2rem;font-size:.875rem;">
          <span class="texto-gris">Total créditos: <strong>${creditosAprobados}</strong></span>
        </div>`;
    } catch (e) {
      document.getElementById('hist-cursos-container').innerHTML =
        '<div style="padding:2rem;text-align:center;color:var(--rojo-peligro);">Error al cargar historial.</div>';
    }
  }

  document.addEventListener('DOMContentLoaded', cargar);
})();
