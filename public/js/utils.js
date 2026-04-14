/**
 * public/js/utils.js
 * Utilidades compartidas para todas las páginas
 */

// ── Toast ──────────────────────────────────────────────────────────────────
function toast(msg, tipo = 'exito') {
  const t = document.createElement('div');
  t.className = `toast toast-${tipo}`;
  t.textContent = msg;
  t.style.cssText = `
    position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;
    padding:.875rem 1.25rem;border-radius:8px;font-size:.9rem;
    font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.15);
    transition:opacity .3s;
    background:${tipo==='exito'?'#059669':tipo==='error'?'#DC2626':tipo==='info'?'#2563EB':'#D97706'};
    color:#fff;
  `;
  document.body.appendChild(t);
  setTimeout(() => { t.style.opacity='0'; setTimeout(() => t.remove(), 300); }, 3500);
}

// ── Loading overlay ────────────────────────────────────────────────────────
function showLoading(el) {
  if (el) { el._prev = el.innerHTML; el.disabled = true; el.innerHTML = '<span style="opacity:.7">Cargando…</span>'; }
}
function hideLoading(el) {
  if (el && el._prev !== undefined) { el.innerHTML = el._prev; el.disabled = false; }
}

// ── Formateo ───────────────────────────────────────────────────────────────
function colones(n) {
  const num = parseFloat(n) || 0;
  return '₡' + num.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function initials(nombre) {
  return (nombre || '?').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
}

// ── Paginación ─────────────────────────────────────────────────────────────
function renderPaginacion(containerSel, { total, page, limit, onPage }) {
  const pages = Math.ceil(total / limit) || 1;
  const c = document.querySelector(containerSel);
  if (!c) return;
  let html = `<span class="paginacion-info">Mostrando ${Math.min((page-1)*limit+1,total)}–${Math.min(page*limit,total)} de ${total}</span>`;
  html += `<div class="paginacion-botones">`;
  html += `<button class="btn-pagina" ${page<=1?'disabled':''} data-p="${page-1}">←</button>`;
  const delta = 2;
  for (let i=1;i<=pages;i++) {
    if (i===1||i===pages||Math.abs(i-page)<=delta) {
      html += `<button class="btn-pagina ${i===page?'activa':''}" data-p="${i}">${i}</button>`;
    } else if (Math.abs(i-page)===delta+1) {
      html += `<span style="padding:0 .25rem;color:var(--gris-suave);">…</span>`;
    }
  }
  html += `<button class="btn-pagina" ${page>=pages?'disabled':''} data-p="${page+1}">→</button>`;
  html += '</div>';
  c.innerHTML = html;
  c.querySelectorAll('.btn-pagina[data-p]').forEach(b => {
    b.addEventListener('click', () => onPage(parseInt(b.dataset.p)));
  });
}

// ── Modal genérico ─────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id)?.classList.add('abierto'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('abierto'); }

// ── Cerrar modales con overlay ─────────────────────────────────────────────
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.closest('.modal')?.classList.remove('abierto');
  }
  if (e.target.dataset.cerrarModal) closeModal(e.target.dataset.cerrarModal);
});

// ── Badge de estado ────────────────────────────────────────────────────────
function badgeEstado(estado) {
  const m = {
    'Activo':'badge-activo','Regular':'badge-activo','Aprobado':'badge-activo',
    'Pagada':'badge-activo','Enviada':'badge-activo','Abierta':'badge-activo',
    'Inactivo':'badge-inactivo','Cerrada':'badge-inactivo','Leída':'badge-inactivo',
    'Pendiente':'badge-pendiente','Parcial':'badge-pendiente','Condicional':'badge-pendiente',
    'Bloqueado':'badge-error','Anulada':'badge-error','Cancelada':'badge-error',
  };
  return `<span class="badge ${m[estado]||'badge-info'}">${estado}</span>`;
}

window.U = { toast, showLoading, hideLoading, colones, initials, renderPaginacion, openModal, closeModal, badgeEstado };
