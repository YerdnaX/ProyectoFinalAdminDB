/**
 * public/js/reports.js
 * Página de reportes: académico y financiero
 */
(function () {
  async function cargarAcademico() {
    try {
      const { data } = await axios.get('/api/reports/academico');
      if (!data.ok) throw new Error(data.error);

      const tbodyProg = document.getElementById('tbody-programas');
      if (tbodyProg && data.programas?.length) {
        tbodyProg.innerHTML = data.programas.map(p => `
          <tr>
            <td>${esc(p.programa)}</td>
            <td style="font-weight:600;text-align:center;">${p.estudiantes}</td>
            <td style="text-align:center;">${p.planes}</td>
          </tr>`).join('');
      }

      const tbodyCred = document.getElementById('tbody-creditos');
      if (tbodyCred && data.cursosPorCredito?.length) {
        tbodyCred.innerHTML = data.cursosPorCredito.map(c => `
          <tr>
            <td style="text-align:center;font-weight:700;">${c.creditos}</td>
            <td style="text-align:center;">${c.total}</td>
          </tr>`).join('');
      }
    } catch (e) { U.toast('Error reporte académico: ' + e.message, 'error'); }
  }

  async function cargarFinanciero() {
    try {
      const { data } = await axios.get('/api/reports/financiero');
      if (!data.ok) throw new Error(data.error);

      const tbodyEst = document.getElementById('tbody-fact-estado');
      if (tbodyEst && data.porEstado?.length) {
        tbodyEst.innerHTML = data.porEstado.map(r => `
          <tr>
            <td>${U.badgeEstado(r.estado)}</td>
            <td style="text-align:center;font-weight:600;">${r.total}</td>
            <td style="font-weight:600;">${U.colones(r.monto)}</td>
          </tr>`).join('');
      }

      const tbodyMet = document.getElementById('tbody-fact-metodo');
      if (tbodyMet && data.porMetodo?.length) {
        tbodyMet.innerHTML = data.porMetodo.map(r => `
          <tr>
            <td><span class="badge badge-info">${esc(r.metodo_pago)}</span></td>
            <td style="text-align:center;">${r.total}</td>
            <td style="font-weight:600;color:var(--verde-principal);">${U.colones(r.monto)}</td>
          </tr>`).join('');
      }
    } catch (e) { U.toast('Error reporte financiero: ' + e.message, 'error'); }
  }

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargarAcademico();
  cargarFinanciero();
})();
