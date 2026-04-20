/**
 * public/js/academic-programas.js
 * Programas academicos: listar, crear y editar
 */
(function () {
  const tbody = document.getElementById('tbody-programas');
  const form = document.getElementById('form-programa');
  const modalId = 'modal-programa';
  let cacheProgramas = [];

  if (!tbody || !form) return;

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function nivelLabel(nivel) {
    const mapa = {
      Tecnico: 'Tecnico',
      Diplomado: 'Diplomado',
      Bachillerato: 'Bachillerato',
      Licenciatura: 'Licenciatura',
      Maestria: 'Maestria',
      Doctorado: 'Doctorado'
    };
    return mapa[nivel] || nivel || '-';
  }

  function errorMsg(err, fallback) {
    return err?.response?.data?.error || err?.message || fallback;
  }

  function getFiltros() {
    return {
      buscar: (document.getElementById('fil-buscar')?.value || '').trim(),
      nivel: document.getElementById('sel-nivel')?.value || '',
      estado: document.getElementById('sel-estado')?.value || ''
    };
  }

  function renderTabla(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Sin programas registrados.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(p => {
      const id = Number(p.id_programa);
      return `
        <tr>
          <td><span style="font-family:monospace;font-weight:700;color:var(--verde-principal);">${esc(p.codigo)}</span></td>
          <td><div class="nombre-principal">${esc(p.nombre)}</div></td>
          <td class="texto-muted">${esc(nivelLabel(p.nivel))}</td>
          <td style="text-align:center;">${Number(p.total_planes) || 0}</td>
          <td style="text-align:center;">${Number(p.total_estudiantes) || 0}</td>
          <td>${p.activo ? '<span class="badge badge-activo">Activo</span>' : '<span class="badge badge-inactivo">Inactivo</span>'}</td>
          <td>
            <div class="acciones-fila">
              <button type="button" class="btn btn-secundario btn-sm" onclick="editarPrograma(${id})">Editar</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  async function cargar() {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--gris-suave);">Cargando...</td></tr>';
    try {
      const { data } = await axios.get('/api/academic/programas', { params: getFiltros() });
      if (!data?.ok) throw new Error(data?.error || 'No se pudo cargar la lista');
      cacheProgramas = Array.isArray(data.data) ? data.data : [];
      renderTabla(cacheProgramas);
    } catch (err) {
      cacheProgramas = [];
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--rojo-peligro);padding:1.5rem;">${esc(errorMsg(err, 'Error cargando programas'))}</td></tr>`;
    }
  }

  function abrirModalNuevo() {
    form.reset();
    document.getElementById('prog-id').value = '';
    document.getElementById('prog-activo').value = '1';
    document.getElementById('modal-prog-titulo').textContent = 'Nuevo programa';
    U.openModal(modalId);
    document.getElementById('prog-codigo')?.focus();
  }

  async function abrirModalEditar(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      U.toast('No se pudo determinar el programa a editar.', 'error');
      return;
    }

    let programa = cacheProgramas.find(x => Number(x.id_programa) === idNum);
    if (!programa) {
      try {
        const { data } = await axios.get(`/api/academic/programas/${idNum}`);
        if (!data?.ok || !data.data) throw new Error(data?.error || 'Programa no encontrado');
        programa = data.data;
      } catch (err) {
        U.toast(errorMsg(err, 'Error al cargar el programa.'), 'error');
        return;
      }
    }

    document.getElementById('prog-id').value = String(idNum);
    document.getElementById('prog-codigo').value = programa.codigo || '';
    document.getElementById('prog-nombre').value = programa.nombre || '';
    document.getElementById('prog-nivel').value = programa.nivel || '';
    document.getElementById('prog-activo').value = programa.activo ? '1' : '0';
    document.getElementById('modal-prog-titulo').textContent = 'Editar programa';
    U.openModal(modalId);
    document.getElementById('prog-nombre')?.focus();
  }

  document.getElementById('btn-nuevo-programa')?.addEventListener('click', abrirModalNuevo);

  window.editarPrograma = function (id) {
    abrirModalEditar(id);
  };

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const idVal = document.getElementById('prog-id').value;
    const codigo = document.getElementById('prog-codigo').value.trim().toUpperCase();
    const nombre = document.getElementById('prog-nombre').value.trim();
    const nivel = document.getElementById('prog-nivel').value;
    const activo = document.getElementById('prog-activo').value === '1';
    const btn = form.querySelector('[type="submit"]');

    if (!codigo) {
      U.toast('El codigo es obligatorio.', 'error');
      document.getElementById('prog-codigo').focus();
      return;
    }
    if (!nombre) {
      U.toast('El nombre es obligatorio.', 'error');
      document.getElementById('prog-nombre').focus();
      return;
    }
    if (!nivel) {
      U.toast('Debes seleccionar un nivel academico.', 'error');
      document.getElementById('prog-nivel').focus();
      return;
    }

    U.showLoading(btn);
    try {
      const payload = { codigo, nombre, nivel, activo };
      const { data } = idVal
        ? await axios.put(`/api/academic/programas/${Number(idVal)}`, payload)
        : await axios.post('/api/academic/programas', payload);

      if (!data?.ok) throw new Error(data?.error || 'No se pudo guardar el programa');

      U.toast(idVal ? 'Programa actualizado correctamente.' : 'Programa creado correctamente.', 'exito');
      U.closeModal(modalId);
      form.reset();
      document.getElementById('prog-id').value = '';
      await cargar();
    } catch (err) {
      U.toast(errorMsg(err, 'Error guardando el programa.'), 'error');
    } finally {
      U.hideLoading(btn);
    }
  });

  document.getElementById('btn-buscar')?.addEventListener('click', cargar);
  document.getElementById('fil-buscar')?.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') cargar();
  });
  document.getElementById('sel-nivel')?.addEventListener('change', cargar);
  document.getElementById('sel-estado')?.addEventListener('change', cargar);

  cargar();
})();
