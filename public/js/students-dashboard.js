(function () {
  const ID_EST = 1; // TODO: replace with session

  async function cargar() {
    try {
      const [resDash, resNotif] = await Promise.all([
        axios.get(`/api/students/${ID_EST}/dashboard`),
        axios.get('/api/notifications', { params: { limit: 5 } })
      ]);
      const d = resDash.data; // dashboard returns flat object: { ok, nombre, carne, ... }

      // Saludo
      const hora = new Date().getHours();
      const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';
      document.getElementById('saludo-nombre').textContent = `¡${saludo}, ${d.nombre || 'estudiante'}! 👋`;
      document.getElementById('saludo-matricula').textContent =
        d.periodo ? `${d.periodo} — ${d.estado_matricula || 'Sin matrícula activa'}` : 'Sin matrícula activa en el periodo actual.';

      // Alerta saldo
      if (d.saldo_pendiente > 0) {
        document.getElementById('alerta-pago-texto').innerHTML =
          `<span class="alerta-titulo">Pago pendiente:</span> Tienes un saldo de <strong>${U.colones(d.saldo_pendiente)}</strong>. <a href="/billing/pagar">Pagar ahora →</a>`;
        document.getElementById('alerta-pago').style.display = '';
      }

      // Métricas
      document.getElementById('met-cursos').textContent = d.num_cursos || '0';
      document.getElementById('met-periodo').textContent = d.periodo || '—';
      document.getElementById('met-creditos').textContent = d.creditos_actuales || '0';
      document.getElementById('met-limite-cred').textContent = `Límite: ${d.limite_creditos || 20}`;
      const pct = d.creditos_plan ? Math.round((d.creditos_aprobados / d.creditos_plan) * 100) : 0;
      document.getElementById('met-avance').textContent = pct + '%';
      document.getElementById('met-avance-detalle').textContent = `${d.creditos_aprobados || 0} / ${d.creditos_plan || 0} créditos`;
      document.getElementById('met-saldo').textContent = d.saldo_pendiente ? U.colones(d.saldo_pendiente) : '₡0';

      // Cursos
      const listaCursos = document.getElementById('lista-mis-cursos');
      document.getElementById('sub-cursos-periodo').textContent = d.periodo || '—';
      const cursos = d.cursos || [];
      if (cursos.length) {
        listaCursos.innerHTML = cursos.map((c, i) => `
          <div style="padding:1rem 1.5rem;${i < cursos.length - 1 ? 'border-bottom:1px solid var(--gris-linea);' : ''}">
            <div style="display:flex;align-items:center;justify-content:space-between;">
              <div>
                <div style="font-size:.75rem;font-weight:700;color:var(--verde-principal);">${c.codigo}</div>
                <div style="font-weight:600;">${c.nombre}</div>
                <div class="texto-pequeno">${c.horario || '—'} · ${c.aula || '—'}</div>
              </div>
              <span class="badge badge-confirmado">${c.creditos} crédito${c.creditos !== 1 ? 's' : ''}</span>
            </div>
          </div>`).join('');
      } else {
        listaCursos.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--gris-suave);">No hay cursos matriculados en el periodo actual.</div>';
      }
    } catch (e) {
      console.error('Error cargando dashboard:', e);
    }

    // Notificaciones
    try {
      const { data } = await axios.get('/api/notifications', { params: { limit: 5, id_estudiante: ID_EST } });
      const notifs = data.data || [];
      const lista = document.getElementById('lista-notif-recientes');
      if (notifs.length) {
        lista.innerHTML = notifs.slice(0, 3).map((n, i) => `
          <div style="padding:.875rem 1.5rem;display:flex;gap:.875rem;align-items:flex-start;${i < Math.min(notifs.length, 3) - 1 ? 'border-bottom:1px solid var(--gris-linea);' : ''}">
            <span style="font-size:1.2rem;">${n.tipo === 'Pago' ? '💳' : n.tipo === 'Matricula' ? '✅' : '🔔'}</span>
            <div>
              <div style="font-size:.875rem;font-weight:600;">${n.titulo || n.mensaje}</div>
              ${n.mensaje && n.titulo ? `<div class="texto-pequeno">${n.mensaje}</div>` : ''}
              <div class="texto-pequeno" style="margin-top:.125rem;color:var(--gris-suave);">${n.fecha ? new Date(n.fecha).toLocaleDateString('es-CR') : '—'}</div>
            </div>
          </div>`).join('');
      } else {
        lista.innerHTML = '<div style="padding:1.5rem;text-align:center;color:var(--gris-suave);">Sin notificaciones recientes.</div>';
      }
    } catch (_) {}
  }

  document.addEventListener('DOMContentLoaded', cargar);
})();
