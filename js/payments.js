// ============================================================
// PAYMENTS — Uzimeleni Scholar Transport System
// ============================================================

let _paymentFilter = '';

async function renderPayments() {
  showLoading('payments-content');
  await simulateDelay(300);

  const user        = getCurrentUser();
  let allPayments   = getPayments();
  if (user && user.role === 'owner') {
    allPayments = allPayments.filter(p => p.ownerId === user.ownerId);
  }

  const totalPaid    = allPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = allPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const paidCount    = allPayments.filter(p => p.status === 'paid').length;
  const pendingCount = allPayments.filter(p => p.status === 'pending').length;

  document.getElementById('payments-content').innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-semibold">Payments</h5>
    </div>

    <!-- Summary cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm text-center">
          <div class="card-body py-3">
            <div class="text-muted small fw-semibold text-uppercase mb-1">Total Collected</div>
            <div class="fs-4 fw-bold text-success">${formatCurrency(totalPaid)}</div>
            <div class="text-muted small">${paidCount} payment(s)</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm text-center">
          <div class="card-body py-3">
            <div class="text-muted small fw-semibold text-uppercase mb-1">Outstanding</div>
            <div class="fs-4 fw-bold text-danger">${formatCurrency(totalPending)}</div>
            <div class="text-muted small">${pendingCount} payment(s)</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm text-center">
          <div class="card-body py-3">
            <div class="text-muted small fw-semibold text-uppercase mb-1">Collection Rate</div>
            <div class="fs-4 fw-bold text-primary">
              ${allPayments.length > 0 ? Math.round(paidCount / allPayments.length * 100) : 0}%
            </div>
            <div class="progress mt-2" style="height:6px">
              <div class="progress-bar bg-success" style="width:${allPayments.length > 0 ? Math.round(paidCount / allPayments.length * 100) : 0}%"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payments table -->
    <div class="card border-0 shadow-sm">
      <div class="card-header bg-transparent py-3">
        <div class="d-flex align-items-center gap-3">
          <label class="form-label mb-0 fw-medium text-muted small">Filter:</label>
          <select class="form-select form-select-sm w-auto" id="payments-filter"
                  onchange="filterPaymentsTable(this.value)">
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
          <small class="text-muted ms-auto" id="payments-count"></small>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Owner</th>
                <th>Description</th>
                <th>Date</th>
                <th class="text-end">Amount</th>
                <th class="text-center">Status</th>
                <th class="text-center">Action</th>
              </tr>
            </thead>
            <tbody id="payments-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  _paymentFilter = '';
  renderPaymentsTable();
}

function filterPaymentsTable(value) {
  _paymentFilter = value;
  renderPaymentsTable();
}

function renderPaymentsTable() {
  const user = getCurrentUser();
  let list   = getPayments();

  if (user && user.role === 'owner') {
    list = list.filter(p => p.ownerId === user.ownerId);
  }

  if (_paymentFilter) {
    list = list.filter(p => p.status === _paymentFilter);
  }

  list.sort((a, b) => new Date(b.date) - new Date(a.date));

  const countEl = document.getElementById('payments-count');
  if (countEl) countEl.textContent = `${list.length} record(s)`;

  const tbody = document.getElementById('payments-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-5">
      <i class="bi bi-receipt fs-2 d-block mb-2"></i>No payments found</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td class="fw-medium">${escapeHtml(getOwnerName(p.ownerId))}</td>
      <td class="text-muted small">${escapeHtml(p.description)}</td>
      <td class="small">${formatDate(p.date)}</td>
      <td class="text-end fw-semibold">${formatCurrency(p.amount)}</td>
      <td class="text-center">${statusBadge(p.status)}</td>
      <td class="text-center">
        ${p.status === 'pending'
          ? `<button class="btn btn-sm btn-success" onclick="processPayment(${p.id})">
               <i class="bi bi-credit-card me-1"></i>Pay Now
             </button>`
          : `<span class="text-success small"><i class="bi bi-check-circle-fill me-1"></i>Paid</span>`
        }
      </td>
    </tr>`).join('');
}

async function processPayment(id) {
  const p = payments.find(x => x.id === id);
  if (!p) return;

  // Simulate PayFast redirect
  showToast('Connecting to PayFast gateway…', 'info');
  const btn = document.querySelector(`button[onclick="processPayment(${id})"]`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Processing…'; }

  await simulateDelay(1800);

  markPaymentPaid(id);

  const ref = 'PF-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  showToast(`Payment successful! Reference: ${ref}`, 'success');

  // Re-render to update totals + table
  await renderPayments();
}
