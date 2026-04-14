(function () {
  'use strict';

  const form    = document.getElementById('form-login');
  const btnLogin = document.getElementById('btn-login');
  const alertaEl = document.getElementById('alerta-error');
  const alertaMsg = document.getElementById('alerta-error-msg');

  function mostrarError(msg) {
    alertaMsg.textContent = msg || 'Error al iniciar sesión. Intente de nuevo.';
    alertaEl.style.display = '';
    btnLogin.disabled = false;
    btnLogin.textContent = 'Iniciar sesión';
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    alertaEl.style.display = 'none';

    const correo     = document.getElementById('correo').value.trim();
    const contrasena = document.getElementById('contrasena').value;

    if (!correo || !contrasena) {
      return mostrarError('Por favor completa todos los campos.');
    }

    btnLogin.disabled = true;
    btnLogin.textContent = 'Verificando…';

    try {
      const { data } = await axios.post('/api/auth/login', { correo, contrasena });
      if (data.ok) {
        window.location.href = data.redirect || '/admin';
      } else {
        mostrarError(data.error || 'Credenciales incorrectas.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Error de conexión. Intente más tarde.';
      mostrarError(msg);
    }
  });

  // Limpiar error al escribir
  ['correo', 'contrasena'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      alertaEl.style.display = 'none';
    });
  });
})();
