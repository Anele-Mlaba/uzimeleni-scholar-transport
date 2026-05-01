// ============================================================
// UTILITIES — Zimeleni Scholar Transport System
// ============================================================

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const icons = {
    success: 'bi-check-circle-fill',
    danger:  'bi-x-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info:    'bi-info-circle-fill',
  };
  const icon = icons[type] || icons.info;

  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${type} border-0`;
  el.setAttribute('role', 'alert');
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi ${icon} me-2"></i>${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>`;

  container.appendChild(el);
  const toast = new bootstrap.Toast(el, { delay: 4000 });
  toast.show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

function showLoading(containerId) {
  const el = document.getElementById(containerId);
  if (el) {
    el.innerHTML = `
      <div class="d-flex justify-content-center align-items-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span class="ms-3 text-muted">Loading...</span>
      </div>`;
  }
}

function simulateDelay(ms = 350) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(amount) {
  return `R ${Number(amount).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
}

function statusBadge(status) {
  const map = {
    'Active':    'success',
    'Inactive':  'secondary',
    'Suspended': 'danger',
    'paid':      'success',
    'pending':   'warning text-dark',
    'present':   'success',
    'absent':    'danger',
    'late':      'warning text-dark',
  };
  const cls = map[status] || 'secondary';
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span class="badge bg-${cls}">${label}</span>`;
}

function confirmAction(message) {
  return confirm(message);
}

function getOwnerName(ownerId) {
  const o = getOwnerById(ownerId);
  return o ? `${o.name} ${o.surname}` : 'Unknown';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}
