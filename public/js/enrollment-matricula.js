/**
 * public/js/enrollment-matricula.js
 * Mi matrícula — muestra cursos seleccionados, permite quitar, y confirmar matrícula
 */
(function () {
  const idEst = window._idEstudiante;

  const tbody      = document.getElementById('tbody-matricula');
  const resumen    = document.getElementById('resumen-cobro');
  const btnConfirm = document.getElementById('btn-confirmar');
  let idMatricula  = null;

  async function cargar() {
    if (!tbody) return;
    try {
      const { data } = await axios.get(`/api/enrollment/${idEst}`);
      if (!data.ok) throw new Error(data.error);
      renderCursos(data.data);
    } catch (e) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--rojo-peligro);">Error: ${e.message}</td></tr>`;
    }
  }

  function renderCursos(mat) {
    if (!mat) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Sin matrícula activa. <a href="/enrollment/buscar">Buscar cursos →</a></td></tr>`;
      if (btnConfirm) btnConfirm.disabled = true;
      return;
    }

    idMatricula = mat.id_matricula;
    const cursos = mat.detalle || [];

    // Subtítulo
    const sub = document.getElementById('sub-matricula');
    if (sub) sub.textContent = `${mat.periodo || '—'} · ${cursos.length} cursos · ${mat.total_creditos || 0} créditos`;

    if (!cursos.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Sin cursos seleccionados. <a href="/enrollment/buscar">Buscar cursos →</a></td></tr>`;
    } else {
      tbody.innerHTML = cursos.map(c => `
        <tr>
          <td><span style="font-family:monospace;color:var(--verde-principal);font-weight:700;">${esc(c.curso_codigo)}</span></td>
          <td><div class="nombre-principal">${esc(c.curso_nombre)}</div>
              <div class="detalle-secundario">${esc(c.docente||'')}</div></td>
          <td>${esc(c.codigo_seccion)}</td>
          <td class="texto-muted">${esc(c.horario||'—')}</td>
          <td><span style="font-weight:700;">${c.creditos}</span></td>
          <td style="font-weight:600;">${U.colones(c.costo || 0)}</td>
          <td><button class="btn btn-texto btn-sm" style="color:var(--rojo-peligro);"
              onclick="quitarCurso(${c.id_seccion})">✕</button></td>
        </tr>`).join('');
    }

    // Resumen de cobro
    if (resumen) {
      const subtotal = mat.total_monto || 0;
      resumen.innerHTML = cursos.map(c =>
        `<div class="flex-entre"><span class="texto-gris">${esc(c.curso_nombre)} (${c.creditos} cr.)</span><span>${U.colones(c.costo || 0)}</span></div>`
      ).join('') + `
        <hr class="divisor" style="margin:.25rem 0;">
        <div class="flex-entre"><strong>Total</strong><strong style="color:var(--verde-principal);">${U.colones(subtotal)}</strong></div>`;
    }

    // Estado matrícula
    const est = document.getElementById('estado-matricula');
    if (est) est.textContent = mat.confirmada ? 'Confirmada' : 'En proceso';
    if (btnConfirm) btnConfirm.disabled = !!mat.confirmada;
  }

  window.quitarCurso = async function (idSeccion) {
    if (!confirm('¿Quitar este curso de tu matrícula?')) return;
    try {
      const { data } = await axios.delete(`/api/enrollment/${idEst}/seccion/${idSeccion}`);
      if (!data.ok) throw new Error(data.error);
      U.toast('Curso eliminado', 'exito');
      cargar();
    } catch (e) { U.toast('Error: ' + (e.response?.data?.error || e.message), 'error'); }
  };

  btnConfirm?.addEventListener('click', async () => {
    if (!idMatricula) { U.toast('No hay matrícula activa.', 'error'); return; }
    if (!confirm('¿Confirmar matrícula? Esta acción generará la factura correspondiente.')) return;
    U.showLoading(btnConfirm);
    try {
      const { data } = await axios.post(`/api/enrollment/${idMatricula}/confirmar`);
      if (!data.ok) throw new Error(data.error);
      U.toast('Matricula confirmada. Factura pendiente para pagar en Realizar Pago.', 'exito');
      cargar();
    } catch (e) {
      U.toast('Error: ' + (e.response?.data?.error || e.message), 'error');
    } finally { U.hideLoading(btnConfirm); }
  });

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargar();
})();
