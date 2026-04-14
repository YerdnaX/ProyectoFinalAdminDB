/**
 * public/js/admin-dashboard.js
 * Dashboard administrativo — carga métricas reales desde /api/reports/dashboard
 */
(async function () {
  try {
    const { data } = await axios.get('/api/reports/dashboard');
    if (!data.ok) throw new Error(data.error);

    const m = data.metricas;

    // Métricas numéricas
    setText('met-estudiantes',    m.estudiantesActivos.toLocaleString('es-CR'));
    setText('met-confirmadas',    m.matriculasConfirmadas.toLocaleString('es-CR'));
    setText('met-secciones',      m.seccionesActivas.toLocaleString('es-CR'));
    setText('met-pagos-pend',     m.pagosPendientes.toLocaleString('es-CR'));
    setText('met-recaudacion',    U.colones(m.recaudacion));
    setText('met-bloqueados',     (m.estudiantesBlockFin + m.estudiantesBlockAcad).toLocaleString('es-CR'));
    setText('met-block-fin',      `${m.estudiantesBlockFin} financiero / ${m.estudiantesBlockAcad} académico`);

    // Total matriculados (confirmadas + pendientes)
    const totalMat = m.matriculasConfirmadas + m.matriculasPendientes;
    const pctConf  = totalMat > 0 ? ((m.matriculasConfirmadas / totalMat) * 100).toFixed(1) : 0;
    const pctPend  = totalMat > 0 ? ((m.matriculasPendientes  / totalMat) * 100).toFixed(1) : 0;
    setText('mat-conf-label', `${m.matriculasConfirmadas.toLocaleString('es-CR')} (${pctConf}%)`);
    setText('mat-pend-label', `${m.matriculasPendientes.toLocaleString('es-CR')} (${pctPend}%)`);
    setStyle('mat-conf-bar', 'width', `${pctConf}%`);
    setStyle('mat-pend-bar', 'width', `${pctPend}%`);

    // Período activo
    if (data.periodoActivo) {
      const p = data.periodoActivo;
      setText('periodo-alerta', `${p.nombre} — Matrícula del ${p.inicio_matricula} al ${p.fin_matricula}`);
    } else {
      const alerta = document.getElementById('alerta-periodo');
      if (alerta) alerta.style.display = 'none';
    }

    // Actividad reciente
    const listEl = document.getElementById('actividad-reciente');
    if (listEl && data.actividadReciente?.length) {
      const iconMap = { INSERT:'✏️', UPDATE:'🔄', DELETE:'🗑️', LOGIN:'👤', LOGOUT:'🚪', SELECT:'🔍' };
      listEl.innerHTML = data.actividadReciente.map((a, i) => {
        const border = i < data.actividadReciente.length - 1 ? 'border-bottom:1px solid var(--gris-linea);' : '';
        const icono  = iconMap[a.accion] || '📋';
        const tiempo = a.minutos_atras < 60
          ? `hace ${a.minutos_atras} min`
          : `hace ${Math.floor(a.minutos_atras/60)}h`;
        return `
          <div style="padding:1rem 1.5rem;display:flex;gap:1rem;align-items:flex-start;${border}">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--verde-bg-alt);display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">${icono}</div>
            <div>
              <div style="font-size:.875rem;font-weight:600;">${esc(a.descripcion || a.accion + ' ' + a.entidad)}</div>
              <div class="texto-pequeno">${esc(a.usuario)}</div>
              <div class="texto-pequeno" style="margin-top:.25rem;color:var(--gris-suave);">${tiempo}</div>
            </div>
          </div>`;
      }).join('');
    }

  } catch (e) {
    console.error('Dashboard error:', e);
    U.toast('Error al cargar métricas: ' + e.message, 'error');
  }

  function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
  function setStyle(id, prop, val) { const el = document.getElementById(id); if (el) el.style[prop] = val; }
  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
})();
