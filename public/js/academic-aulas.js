/**
 * public/js/academic-aulas.js
 * Aulas: listar, buscar, crear y editar
 */
(function () {
  const tbody = document.getElementById('tbody-aulas');
  const inBuscar = document.getElementById('aulas-buscar');
  const selEdificio = document.getElementById('aulas-edificio');
  const selEstado = document.getElementById('aulas-estado');

  let filtros = { buscar: '', edificio: '', estado: '' };
  let debounce;

  async function cargar() {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando...</td></tr>`;
    try {
      const { data } = await axios.get('/api/academic/aulas', { params: filtros });
      if (!data.ok) throw new Error(data.error || 'No se pudo cargar aulas');
      const rows = data.data || [];
      renderTabla(rows);
      poblarEdificios(rows);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--rojo-peligro);">${esc(e.message)}</td></tr>`;
    }
  }

  function renderTabla(rows) {
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;">Sin aulas</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map(a => `
      <tr>
        <td><span style="font-family:monospace;font-weight:700;">${esc(a.codigo)}</span></td>
        <td>${esc(a.nombre)}</td>
        <td>${esc(a.edificio || '-')}</td>
        <td style="text-align:center;font-weight:700;">${Number(a.capacidad) || 0}</td>
        <td>${a.activa ? '<span class="badge badge-activo">Activa</span>' : '<span class="badge badge-inactivo">Inactiva</span>'}</td>
        <td><button class="btn btn-secundario btn-sm" onclick="editarAula(${a.id_aula})">Editar</button></td>
      </tr>`).join('');
  }

  function poblarEdificios(rows) {
    if (!selEdificio) return;
    const actual = selEdificio.value;
    const edificios = Array.from(new Set(rows.map(r => (r.edificio || '').trim()).filter(Boolean))).sort();
    selEdificio.innerHTML = '<option value="">Todos los edificios</option>' + edificios.map(e => `<option value="${escAttr(e)}">${esc(e)}</option>`).join('');
    selEdificio.value = edificios.includes(actual) ? actual : '';
  }

  window.editarAula = async function (id) {
    try {
      const { data } = await axios.get(`/api/academic/aulas/${id}`);
      if (!data.ok || !data.data) throw new Error(data.error || 'No se pudo cargar aula');
      const a = data.data;
      const form = document.getElementById('form-editar-aula');
      if (!form) return;
      form.dataset.id = String(id);
      form.querySelector('[name=codigo]').value = a.codigo || '';
      form.querySelector('[name=nombre]').value = a.nombre || '';
      form.querySelector('[name=edificio]').value = a.edificio || '';
      form.querySelector('[name=capacidad]').value = a.capacidad || '';
      form.querySelector('[name=activa]').value = a.activa ? '1' : '0';
      U.openModal('modal-editar-aula');
    } catch (e) {
      U.toast('Error al cargar aula: ' + (e.response?.data?.error || e.message), 'error');
    }
  };

  document.getElementById('btn-nueva-aula')?.addEventListener('click', () => {
    const form = document.getElementById('form-crear-aula');
    form?.reset();
    if (form?.querySelector('[name=activa]')) form.querySelector('[name=activa]').value = '1';
    U.openModal('modal-crear-aula');
  });

  document.getElementById('form-crear-aula')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const payload = Object.fromEntries(new FormData(form));
      const { data } = await axios.post('/api/academic/aulas', payload);
      if (!data.ok) throw new Error(data.error || 'No se pudo crear aula');
      U.toast('Aula creada', 'exito');
      U.closeModal('modal-crear-aula');
      form.reset();
      await cargar();
    } catch (err) {
      U.toast('Error: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      U.hideLoading(btn);
    }
  });

  document.getElementById('form-editar-aula')?.addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const id = form.dataset.id;
    if (!id) return U.toast('No se encontro el aula a editar', 'error');
    const btn = form.querySelector('[type=submit]');
    U.showLoading(btn);
    try {
      const payload = Object.fromEntries(new FormData(form));
      const { data } = await axios.put(`/api/academic/aulas/${id}`, payload);
      if (!data.ok) throw new Error(data.error || 'No se pudo actualizar aula');
      U.toast('Aula actualizada', 'exito');
      U.closeModal('modal-editar-aula');
      await cargar();
    } catch (err) {
      U.toast('Error: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      U.hideLoading(btn);
    }
  });

  inBuscar?.addEventListener('input', e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      filtros.buscar = e.target.value.trim();
      cargar();
    }, 300);
  });

  selEdificio?.addEventListener('change', e => {
    filtros.edificio = e.target.value;
    cargar();
  });

  selEstado?.addEventListener('change', e => {
    filtros.estado = e.target.value;
    cargar();
  });

  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function escAttr(s) { return esc(s).replace(/"/g, '&quot;'); }

  cargar();
})();
