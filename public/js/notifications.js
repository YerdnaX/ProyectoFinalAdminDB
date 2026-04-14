/**
 * public/js/notifications.js
 * Lista de notificaciones + envío de notificación manual
 */
(function () {
  let page = 1;
  const LIMIT = 20;
  const isAdmin = !document.querySelector('meta[name=id-estudiante]'); // admin si no hay meta tag
  const idEst   = document.querySelector('meta[name=id-estudiante]')?.content;

  const tbody    = document.getElementById('tbody-notif');
  const formEnvio= document.getElementById('form-enviar-notif');
  const selTipo  = document.getElementById('sel-tipo');
  const selEst2  = document.getElementById('sel-estado-notif');

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando…</td></tr>`;
    try {
      const params = { page, limit: LIMIT };
      if (idEst) params.id_estudiante = idEst;
      if (selTipo?.value)  params.tipo   = selTipo.value;
      if (selEst2?.value)  params.estado = selEst2.value;
      const { data } = await axios.get('/api/notifications', { params });
      if (!data.ok) throw new Error(data.error);
      renderTabla(data.data, data.total);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--rojo-peligro);">${e.message}</td></tr>`;
    }
  }

  function renderTabla(rows, total) {
    const tipoBadge = { Informativa:'badge-info', Financiera:'badge-pendiente', Académica:'badge-activo', Urgente:'badge-error' };
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;">Sin notificaciones</td></tr>`;
    } else {
      tbody.innerHTML = rows.map(n => `
        <tr>
          <td class="texto-muted">${esc(n.fecha_envio)}</td>
          <td class="texto-muted">${esc(n.hora_envio)}</td>
          <td>${esc(n.estudiante)}</td>
          <td><span class="badge ${tipoBadge[n.tipo]||'badge-info'}">${esc(n.tipo)}</span></td>
          <td><strong>${esc(n.asunto)}</strong><div class="detalle-secundario">${esc(n.mensaje?.slice(0,80))}…</div></td>
          <td><span class="badge badge-info">${esc(n.medio)}</span></td>
          <td>${U.badgeEstado(n.estado)}</td>
        </tr>`).join('');
    }
    U.renderPaginacion('#paginacion-notif', { total, page, limit: LIMIT, onPage: p => { page = p; cargar(); } });
  }

  formEnvio?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = formEnvio.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const body = Object.fromEntries(new FormData(formEnvio));
      const { data } = await axios.post('/api/notifications', body);
      if (!data.ok) throw new Error(data.error);
      U.toast('Notificación enviada', 'exito');
      U.closeModal('modal-notif');
      formEnvio.reset();
      cargar();
    } catch (err) {
      U.toast('Error: ' + (err.response?.data?.error || err.message), 'error');
    } finally { U.hideLoading(btn); }
  });

  selTipo?.addEventListener('change',  () => { page = 1; cargar(); });
  selEst2?.addEventListener('change',  () => { page = 1; cargar(); });

  function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  cargar();
})();
