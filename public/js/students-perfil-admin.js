(function () {
  const params = new URLSearchParams(window.location.search);
  const idEst = params.get('id') || window.location.pathname.split('/').pop();
  const idMatriculaDesdeQuery = params.get('id_matricula');
  let tabActivo = 'matricula';

  async function cargar() {
    if (!idEst || isNaN(idEst)) return;
    try {
      const linkEstado = document.getElementById('ep-link-estado-cuenta');
      const linkComprobante = document.getElementById('ep-link-comprobante');
      if (linkEstado) linkEstado.href = `/students/perfil-admin/${idEst}/estado-cuenta`;
      if (linkComprobante) {
        linkComprobante.href = idMatriculaDesdeQuery
          ? `/students/perfil-admin/${idEst}/comprobante?id=${encodeURIComponent(idMatriculaDesdeQuery)}`
          : `/students/perfil-admin/${idEst}/comprobante`;
      }

      const resp = await axios.get(`/api/students/${idEst}`);
      const e = resp.data.data || resp.data;
      const nombreCompleto = [e.nombre, e.apellido].filter(Boolean).join(' ');

      // Breadcrumb + header
      document.getElementById('ep-breadcrumb').textContent = nombreCompleto || 'â€”';
      document.getElementById('ep-avatar').textContent = U.initials(nombreCompleto || '?');
      document.getElementById('ep-nombre').textContent = nombreCompleto || 'â€”';
      document.getElementById('ep-badge-estado').innerHTML = U.badgeEstado(e.estado_academico || 'Regular');
      document.getElementById('ep-carne').textContent = e.carne || 'â€”';
      document.getElementById('ep-email').textContent = `ðŸ“§ ${e.correo || 'â€”'}`;
      document.getElementById('ep-ingreso').textContent = `ðŸ“… Ingreso: ${e.fecha_ingreso ? new Date(e.fecha_ingreso).toLocaleDateString('es-CR', { year: 'numeric', month: 'long' }) : 'â€”'}`;
      document.getElementById('ep-programa').textContent = `ðŸ›ï¸ ${e.programa || 'â€”'}`;

      // MÃ©tricas
      const pct = e.creditos_plan ? Math.round((e.creditos_aprobados / e.creditos_plan) * 100) : 0;
      document.getElementById('ep-met-cred-aprobados').textContent = e.creditos_aprobados || 0;
      document.getElementById('ep-met-cred-actuales').textContent = e.creditos_actuales || 0;
      document.getElementById('ep-met-avance').textContent = pct + '%';
      const saldo = parseFloat(e.saldo_pendiente || 0);
      document.getElementById('ep-met-saldo').textContent = U.colones(saldo);
      document.getElementById('ep-met-saldo').style.color = saldo > 0 ? 'var(--rojo-peligro)' : 'var(--cyan-exito)';

      // Panel estado
      document.getElementById('ep-estado-acad').innerHTML = U.badgeEstado(e.estado_academico || 'Regular');
      document.getElementById('ep-bloqueo-fin').innerHTML = e.bloqueado_financiero
        ? '<span class="badge badge-peligro">Bloqueado</span>' : '<span class="badge badge-activo">Sin bloqueo</span>';
      document.getElementById('ep-bloqueo-acad').innerHTML = e.bloqueado_academico
        ? '<span class="badge badge-peligro">Bloqueado</span>' : '<span class="badge badge-activo">Sin bloqueo</span>';
      document.getElementById('ep-saldo-panel').textContent = U.colones(saldo);
      document.getElementById('ep-saldo-panel').style.color = saldo > 0 ? 'var(--rojo-peligro)' : 'var(--cyan-exito)';

      // Avance del plan
      document.getElementById('ep-cred-texto').textContent = `${e.creditos_aprobados || 0} / ${e.creditos_plan || 0}`;
      document.getElementById('ep-barra').style.width = pct + '%';
      document.getElementById('ep-plan-nombre').textContent = `Plan de estudio: ${e.plan || 'â€”'}`;

      // BotÃ³n bloquear
      const btnBlq = document.getElementById('btn-bloquear');
      const esBloqueado = e.bloqueado_financiero || e.bloqueado_academico;
      btnBlq.textContent = esBloqueado ? 'Levantar bloqueo' : 'Activar bloqueo';
      btnBlq.onclick = async () => {
        try {
          await axios.put(`/api/students/${idEst}/bloqueo`, { bloqueo: !esBloqueado });
          U.toast('Estado de bloqueo actualizado.', 'exito');
          setTimeout(() => location.reload(), 800);
        } catch (_) { U.toast('Error al actualizar bloqueo.', 'error'); }
      };

    } catch (err) {
      console.error('Error cargando perfil:', err);
    }
    cargarTab('matricula');
  }

  async function cargarTab(tab) {
    tabActivo = tab;
    ['matricula', 'historial', 'pagos'].forEach(t => {
      document.getElementById(`tab-${t}`).style.display = t === tab ? '' : 'none';
    });
    document.querySelectorAll('.tab-boton').forEach(b => {
      b.classList.toggle('activo', b.dataset.tab === tab);
    });

    if (tab === 'matricula') await cargarMatricula();
    else if (tab === 'historial') await cargarHistorial();
    else if (tab === 'pagos') await cargarFacturas();
  }

  async function cargarMatricula() {
    const tbody = document.getElementById('ep-tbody-cursos');
    try {
      const { data } = await axios.get(`/api/enrollment/${idEst}`);
      const m = data.data || data;
      document.getElementById('ep-mat-titulo').textContent = m.periodo || 'â€”';
      document.getElementById('ep-mat-subtitulo').textContent = m.estado
        ? `${m.estado} â€” ${(m.detalle || []).length} cursos`
        : 'Sin matrÃ­cula activa';
      const compUrl = m.id_matricula
        ? `/students/perfil-admin/${idEst}/comprobante?id=${m.id_matricula}`
        : (idMatriculaDesdeQuery
          ? `/students/perfil-admin/${idEst}/comprobante?id=${encodeURIComponent(idMatriculaDesdeQuery)}`
          : `/students/perfil-admin/${idEst}/comprobante`);
      const linkCompPrincipal = document.getElementById('ep-mat-comprobante');
      const linkCompLateral = document.getElementById('ep-link-comprobante');
      if (linkCompPrincipal) linkCompPrincipal.href = compUrl;
      if (linkCompLateral) linkCompLateral.href = compUrl;

      const cursos = m.detalle || [];
      tbody.innerHTML = cursos.length
        ? cursos.map(c => `<tr>
            <td><span style="font-family:monospace;font-size:.875rem;color:var(--verde-principal);">${c.curso_codigo || c.codigo || 'â€”'}</span></td>
            <td>${c.curso_nombre || c.nombre || 'â€”'}</td>
            <td>${c.codigo_seccion || c.seccion || 'â€”'}</td>
            <td>${c.creditos || 'â€”'}</td>
            <td class="texto-muted">${c.horario || 'â€”'}</td>
            <td>${U.badgeEstado(c.estado || 'Matriculada')}</td>
          </tr>`).join('')
        : '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gris-suave);">Sin cursos matriculados.</td></tr>';
    } catch (_) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gris-suave);">Sin matrÃ­cula activa.</td></tr>';
    }
  }

  async function cargarHistorial() {
    const cont = document.getElementById('ep-historial-container');
    try {
      const resp = await axios.get(`/api/students/${idEst}/historial`);
      const cursos = resp.data.data || [];
      if (!cursos.length) { cont.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--gris-suave);">Sin historial registrado.</div>'; return; }
      // Group by period
      const agrupado = {};
      cursos.forEach(c => {
        const per = c.periodo || 'Sin periodo';
        if (!agrupado[per]) agrupado[per] = [];
        agrupado[per].push(c);
      });
      cont.innerHTML = Object.entries(agrupado).map(([per, curs]) => `
        <div style="margin-bottom:1.25rem;">
          <div style="font-weight:700;margin-bottom:.5rem;">${per}</div>
          <table class="tabla" style="width:100%;">
            <thead><tr><th>CÃ³digo</th><th>Curso</th><th>Cred.</th><th>Nota</th><th>Estado</th></tr></thead>
            <tbody>${curs.map(c => `<tr>
              <td style="font-family:monospace;color:var(--verde-principal);font-size:.875rem;">${c.curso_codigo || 'â€”'}</td>
              <td>${c.curso_nombre || 'â€”'}</td><td style="text-align:center;">${c.creditos}</td>
              <td style="text-align:center;font-weight:700;">${c.calificacion || 'â€”'}</td>
              <td>${U.badgeEstado(c.estado || 'Matriculada')}</td>
            </tr>`).join('')}</tbody>
          </table>
        </div>`).join('');
    } catch (_) { cont.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--rojo-peligro);">Error al cargar historial.</div>'; }
  }

  async function cargarFacturas() {
    const tbody = document.getElementById('ep-tbody-facturas');
    try {
      const resp = await axios.get(`/api/billing/facturas/estudiante/${idEst}`);
      const facturas = resp.data.data || resp.data.facturas || resp.data;
      tbody.innerHTML = facturas.length
        ? facturas.map(f => `<tr>
            <td><span style="font-family:monospace;font-weight:700;">${f.numero_factura || f.id_factura}</span></td>
            <td>${f.periodo || 'â€”'}</td>
            <td style="text-align:right;">${U.colones(f.total || 0)}</td>
            <td style="text-align:right;">${U.colones(f.saldo || 0)}</td>
            <td>${U.badgeEstado(f.estado)}</td>
          </tr>`).join('')
        : '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--gris-suave);">Sin facturas registradas.</td></tr>';
    } catch (_) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--rojo-peligro);">Error al cargar facturas.</td></tr>'; }
  }

  document.addEventListener('DOMContentLoaded', () => {
    cargar();
    document.querySelectorAll('.tab-boton[data-tab]').forEach(b => {
      b.addEventListener('click', () => cargarTab(b.dataset.tab));
    });
  });
})();


