/**
 * public/js/reports.js
 * Centro de reportes: academico, financiero, matricula y auditoria
 */
(function () {
  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function setTabs() {
    const botones = Array.from(document.querySelectorAll('.tab-boton[data-tab]'));
    botones.forEach(btn => {
      btn.addEventListener('click', () => {
        botones.forEach(b => b.classList.toggle('activo', b === btn));
        const tab = btn.dataset.tab;
        document.querySelectorAll('.report-tab').forEach(sec => {
          sec.style.display = sec.id === `tab-${tab}` ? '' : 'none';
        });
      });
    });
  }

  async function cargarPeriodosMatricula() {
    const sel = document.getElementById('rep-periodo-matricula');
    if (!sel) return;
    try {
      const { data } = await axios.get('/api/academic/periodos');
      (data.data || []).forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id_periodo;
        opt.textContent = p.nombre;
        sel.appendChild(opt);
      });
    } catch (_) {}
  }

  async function cargarAcademico() {
    try {
      const { data } = await axios.get('/api/reports/academico');
      if (!data.ok) throw new Error(data.error || 'No se pudo cargar');

      const tbodyProg = document.getElementById('tbody-programas');
      if (tbodyProg) {
        const rows = data.programas || [];
        tbodyProg.innerHTML = rows.length
          ? rows.map(p => `
            <tr>
              <td>${esc(p.programa)}</td>
              <td style="font-weight:600;text-align:center;">${Number(p.estudiantes) || 0}</td>
              <td style="text-align:center;">${Number(p.planes) || 0}</td>
            </tr>`).join('')
          : '<tr><td colspan="3" style="text-align:center;padding:1.5rem;color:var(--gris-suave);">Sin datos.</td></tr>';
      }

      const tbodyCred = document.getElementById('tbody-creditos');
      if (tbodyCred) {
        const rows = data.cursosPorCredito || [];
        tbodyCred.innerHTML = rows.length
          ? rows.map(c => `
            <tr>
              <td style="text-align:center;font-weight:700;">${Number(c.creditos) || 0}</td>
              <td style="text-align:center;">${Number(c.total) || 0}</td>
            </tr>`).join('')
          : '<tr><td colspan="2" style="text-align:center;padding:1.5rem;color:var(--gris-suave);">Sin datos.</td></tr>';
      }
    } catch (e) {
      U.toast('Error reporte academico: ' + e.message, 'error');
    }
  }

  async function cargarFinanciero() {
    try {
      const { data } = await axios.get('/api/reports/financiero');
      if (!data.ok) throw new Error(data.error || 'No se pudo cargar');

      const tbodyEst = document.getElementById('tbody-fact-estado');
      if (tbodyEst) {
        const rows = data.porEstado || [];
        tbodyEst.innerHTML = rows.length
          ? rows.map(r => `
            <tr>
              <td>${U.badgeEstado(r.estado)}</td>
              <td style="text-align:center;font-weight:600;">${Number(r.total) || 0}</td>
              <td style="font-weight:600;">${U.colones(r.monto || 0)}</td>
            </tr>`).join('')
          : '<tr><td colspan="3" style="text-align:center;padding:1.5rem;color:var(--gris-suave);">Sin datos.</td></tr>';
      }

      const tbodyMet = document.getElementById('tbody-fact-metodo');
      if (tbodyMet) {
        const rows = data.porMetodo || [];
        tbodyMet.innerHTML = rows.length
          ? rows.map(r => `
            <tr>
              <td><span class="badge badge-info">${esc(r.metodo_pago)}</span></td>
              <td style="text-align:center;">${Number(r.total) || 0}</td>
              <td style="font-weight:600;color:var(--verde-principal);">${U.colones(r.monto || 0)}</td>
            </tr>`).join('')
          : '<tr><td colspan="3" style="text-align:center;padding:1.5rem;color:var(--gris-suave);">Sin datos.</td></tr>';
      }
    } catch (e) {
      U.toast('Error reporte financiero: ' + e.message, 'error');
    }
  }

  async function cargarMatricula() {
    try {
      const periodo = document.getElementById('rep-periodo-matricula')?.value || '';
      const { data } = await axios.get('/api/reports/matricula', { params: { periodo } });
      if (!data.ok) throw new Error(data.error || 'No se pudo cargar');

      const tbody = document.getElementById('tbody-matricula-resumen');
      if (tbody) {
        const rows = data.resumen || [];
        tbody.innerHTML = rows.length
          ? rows.map(r => `
            <tr>
              <td>${esc(r.periodo)}</td>
              <td style="text-align:center;font-weight:600;">${Number(r.total_matriculas) || 0}</td>
              <td style="text-align:center;">${Number(r.confirmadas) || 0}</td>
              <td style="text-align:center;">${Number(r.pendientes) || 0}</td>
              <td style="text-align:center;">${Number(r.total_creditos) || 0}</td>
              <td style="font-weight:600;">${U.colones(r.total_monto || 0)}</td>
            </tr>`).join('')
          : '<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:var(--gris-suave);">Sin datos.</td></tr>';
      }
    } catch (e) {
      U.toast('Error reporte matricula: ' + e.message, 'error');
    }
  }

  async function cargarAuditoria() {
    try {
      const limit = document.getElementById('rep-limit-auditoria')?.value || '100';
      const { data } = await axios.get('/api/reports/auditoria', { params: { limit } });
      if (!data.ok) throw new Error(data.error || 'No se pudo cargar');

      const tbody = document.getElementById('tbody-auditoria');
      if (tbody) {
        const rows = data.data || [];
        tbody.innerHTML = rows.length
          ? rows.map(r => `
            <tr>
              <td>${esc(r.fecha)}</td>
              <td>${esc(r.hora)}</td>
              <td>${esc(r.usuario)}</td>
              <td>${esc(r.rol)}</td>
              <td>${esc(r.entidad)}</td>
              <td>${esc(r.accion)}</td>
              <td>${esc(r.descripcion)}</td>
            </tr>`).join('')
          : '<tr><td colspan="7" style="text-align:center;padding:1.5rem;color:var(--gris-suave);">Sin datos.</td></tr>';
      }
    } catch (e) {
      U.toast('Error reporte auditoria: ' + e.message, 'error');
    }
  }

  function bindFiltros() {
    document.getElementById('rep-periodo-matricula')?.addEventListener('change', cargarMatricula);
    document.getElementById('rep-limit-auditoria')?.addEventListener('change', cargarAuditoria);
  }

  function bindExportes() {
    document.querySelectorAll('[data-export][data-formato]').forEach(btn => {
      btn.addEventListener('click', () => {
        const seccion = btn.getAttribute('data-export');
        const formato = btn.getAttribute('data-formato');
        const qs = new URLSearchParams();

        if (seccion === 'matricula') {
          const periodo = document.getElementById('rep-periodo-matricula')?.value || '';
          if (periodo) qs.set('periodo', periodo);
        }
        if (seccion === 'auditoria') {
          const limit = document.getElementById('rep-limit-auditoria')?.value || '100';
          if (limit) qs.set('limit', limit);
        }

        const url = `/api/reports/export/${encodeURIComponent(seccion)}/${encodeURIComponent(formato)}${qs.toString() ? `?${qs}` : ''}`;
        window.location.href = url;
      });
    });
  }

  async function init() {
    setTabs();
    bindExportes();
    bindFiltros();

    await cargarPeriodosMatricula();
    await Promise.all([
      cargarAcademico(),
      cargarFinanciero(),
      cargarMatricula(),
      cargarAuditoria()
    ]);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
