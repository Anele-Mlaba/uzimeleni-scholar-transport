// ============================================================
// PAYMENTS — Zimeleni Scholar Transport System
// ============================================================

let _paymentFilter = '';

async function renderPayments() {
  showLoading('payments-content');
  await refreshOwners();
  await refreshPayments();

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
      ${hasRole('chairperson') ? `<div class="d-flex gap-2">
        <button class="btn btn-outline-warning" onclick="openBulkPaymentModal()">
          <i class="bi bi-people-fill me-1"></i>Bulk Payment</button>
        <button class="btn btn-primary" onclick="openCreatePaymentModal()">
          <i class="bi bi-plus-lg me-1"></i>Create Payment</button>
      </div>` : ''}
    </div>

    <!-- Summary cards -->
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <div class="card border-0 shadow-sm text-center">
          <div class="card-body py-3">
            <div class="text-muted small fw-semibold text-uppercase mb-1">Total Collected</div>
            <div class="fs-4 fw-bold text-success" id="stat-collected">${formatCurrency(totalPaid)}</div>
            <div class="text-muted small" id="stat-collected-count">${paidCount} payment(s)</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm text-center">
          <div class="card-body py-3">
            <div class="text-muted small fw-semibold text-uppercase mb-1">Outstanding</div>
            <div class="fs-4 fw-bold text-danger" id="stat-outstanding">${formatCurrency(totalPending)}</div>
            <div class="text-muted small" id="stat-outstanding-count">${pendingCount} payment(s)</div>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card border-0 shadow-sm text-center">
          <div class="card-body py-3">
            <div class="text-muted small fw-semibold text-uppercase mb-1">Collection Rate</div>
            <div class="fs-4 fw-bold text-primary" id="stat-rate">
              ${allPayments.length > 0 ? Math.round(paidCount / allPayments.length * 100) : 0}%
            </div>
            <div class="progress mt-2" style="height:6px">
              <div class="progress-bar bg-success" id="stat-rate-bar" style="width:${allPayments.length > 0 ? Math.round(paidCount / allPayments.length * 100) : 0}%"></div>
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
        ${p.status === 'pending' && hasRole('chairperson', 'secretary')
          ? `<button class="btn btn-sm btn-success" data-pay-id="${p.id}"
                     onclick="markAsPaid('${p.id}')">
               <i class="bi bi-check-lg me-1"></i>Mark Paid
             </button>`
          : p.status === 'paid'
            ? `<span class="text-success small"><i class="bi bi-check-circle-fill me-1"></i>Paid</span>`
            : ''
        }
      </td>
    </tr>`).join('');
}

function openCreatePaymentModal() {
  const ownerOptions = getOwners()
    .map(o => `<option value="${o.id}">${escapeHtml(o.name)} ${escapeHtml(o.surname)}</option>`)
    .join('');
  document.getElementById('createPaymentOwner').innerHTML =
    `<option value="">Select owner…</option>${ownerOptions}`;
  const form = document.getElementById('create-payment-form');
  form.reset();
  form.classList.remove('was-validated');
  bootstrap.Modal.getOrCreateInstance(document.getElementById('createPaymentModal')).show();
}

async function saveCreatedPayment() {
  const form = document.getElementById('create-payment-form');
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;

  const ownerId     = document.getElementById('createPaymentOwner').value;
  const amount      = parseFloat(document.getElementById('createPaymentAmount').value);
  const description = document.getElementById('createPaymentDescription').value.trim();

  const btn = document.querySelector('#createPaymentModal .btn-primary');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Creating…'; }

  try {
    await createFine(ownerId, amount, description);
    showToast('Payment created successfully.', 'success');
    bootstrap.Modal.getInstance(document.getElementById('createPaymentModal')).hide();
    renderPayments();
  } catch (err) {
    showToast(err.message || 'Failed to create payment.', 'danger');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-plus-lg me-1"></i>Create Payment'; }
  }
}

function openBulkPaymentModal() {
  const form = document.getElementById('bulk-payment-form');
  form.reset();
  form.classList.remove('was-validated');

  document.getElementById('bulkPaymentAmount').removeAttribute('required');
  document.getElementById('bulkAmountRequired').style.display = 'none';
  document.getElementById('bulkAmountHint').textContent = '';

  const meetingSelect = document.getElementById('bulkPaymentMeeting');
  const meetingOptions = getMeetings()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(m => `<option value="${m.id}">${escapeHtml(m.title)} — ${formatDate(m.date)}</option>`)
    .join('');
  meetingSelect.innerHTML = `<option value="">None</option>${meetingOptions}`;

  bootstrap.Modal.getOrCreateInstance(document.getElementById('bulkPaymentModal')).show();
}

function _onBulkReasonChange(reason) {
  const amountInput    = document.getElementById('bulkPaymentAmount');
  const descInput      = document.getElementById('bulkPaymentDescription');
  const hintEl         = document.getElementById('bulkAmountHint');
  const requiredStar   = document.getElementById('bulkAmountRequired');

  if (reason === 'late') {
    amountInput.placeholder = '50.00';
    amountInput.value       = '';
    amountInput.removeAttribute('required');
    requiredStar.style.display = 'none';
    hintEl.textContent      = 'Default: R50.00. Leave blank to use default.';
    descInput.placeholder   = 'Late arrival fee';
    if (!descInput.value) descInput.value = 'Late arrival fee';
  } else if (reason === 'absent') {
    amountInput.placeholder = '200.00';
    amountInput.value       = '';
    amountInput.removeAttribute('required');
    requiredStar.style.display = 'none';
    hintEl.textContent      = 'Default: R200.00. Leave blank to use default.';
    descInput.placeholder   = 'Absence fee';
    if (!descInput.value) descInput.value = 'Absence fee';
  } else if (reason === 'custom') {
    amountInput.placeholder = '0.00';
    amountInput.value       = '';
    amountInput.setAttribute('required', '');
    requiredStar.style.display = '';
    hintEl.textContent      = 'Required for custom payments.';
    descInput.placeholder   = 'e.g. Monthly levy';
    descInput.value         = '';
  } else {
    amountInput.placeholder = 'Leave blank to use default';
    amountInput.value       = '';
    amountInput.removeAttribute('required');
    requiredStar.style.display = 'none';
    hintEl.textContent      = '';
    descInput.value         = '';
  }
}

async function saveBulkPayment() {
  const form = document.getElementById('bulk-payment-form');
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;

  const reason      = document.getElementById('bulkPaymentReason').value;
  const amountRaw   = document.getElementById('bulkPaymentAmount').value.trim();
  const description = document.getElementById('bulkPaymentDescription').value.trim();
  const meetingId   = document.getElementById('bulkPaymentMeeting').value;
  const notes       = document.getElementById('bulkPaymentNotes').value.trim();

  const body = { reason };
  if (amountRaw)   body.amount      = parseFloat(amountRaw);
  if (description) body.description = description;
  if (meetingId)   body.meeting_id  = meetingId;
  if (notes)       body.notes       = notes;

  const btn = document.getElementById('bulkPaymentSaveBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Creating…'; }

  try {
    const result = await ManualPaymentsAPI.bulkCreate(body);
    if (!result.ok) {
      showToast(result.data?.error || 'Failed to create bulk payments.', 'danger');
      return;
    }
    const count = result.data?.count ?? 0;
    showToast(`${count} outstanding payment(s) created for all members.`, 'success');
    bootstrap.Modal.getInstance(document.getElementById('bulkPaymentModal')).hide();
    renderPayments();
  } catch (err) {
    showToast(err.message || 'Failed to create bulk payments.', 'danger');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-people-fill me-1"></i>Create for All Members'; }
  }
}

function _refreshSummaryCards() {
  const user = getCurrentUser();
  let list   = getPayments();
  if (user && user.role === 'owner') list = list.filter(p => p.ownerId === user.ownerId);

  const totalPaid    = list.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = list.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const paidCount    = list.filter(p => p.status === 'paid').length;
  const pendingCount = list.filter(p => p.status === 'pending').length;
  const rate         = list.length > 0 ? Math.round(paidCount / list.length * 100) : 0;

  const s = id => document.getElementById(id);
  if (s('stat-collected'))       s('stat-collected').textContent       = formatCurrency(totalPaid);
  if (s('stat-collected-count')) s('stat-collected-count').textContent = `${paidCount} payment(s)`;
  if (s('stat-outstanding'))     s('stat-outstanding').textContent     = formatCurrency(totalPending);
  if (s('stat-outstanding-count')) s('stat-outstanding-count').textContent = `${pendingCount} payment(s)`;
  if (s('stat-rate'))            s('stat-rate').textContent            = `${rate}%`;
  if (s('stat-rate-bar'))        s('stat-rate-bar').style.width        = `${rate}%`;
}

async function markAsPaid(id) {
  const btn = document.querySelector(`[data-pay-id="${id}"]`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving…'; }

  try {
    const result = await ManualPaymentsAPI.markPaid(id);
    if (!result.ok) {
      showToast(result.data?.error || 'Failed to mark payment as paid.', 'danger');
      return;
    }
    await refreshPayments();
    renderPaymentsTable();
    _refreshSummaryCards();
    showToast('Payment marked as paid.', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to mark payment as paid.', 'danger');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Mark Paid'; }
  }
}

async function processPayment(id) {
  const p     = getPayments().find(x => String(x.id) === String(id));
  if (!p) return;

  const owner = getOwnerById(p.ownerId);
  if (!owner) return;

  const btn = document.querySelector(`[data-pay-id="${id}"]`);
  if (btn) {
    btn.disabled  = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Redirecting…';
  }

  showToast('Connecting to PayFast payment gateway…', 'info');

  const result = await PaymentsAPI.initiate({
    amount:     p.amount.toFixed(2),
    item_name:  p.description,
    owner_id:   p.ownerId,
    name_first: owner.name,
    name_last:  owner.surname,
    email:      owner.email || '',
  });

  if (!result.ok) {
    showToast(result.data?.error || 'Failed to initiate payment.', 'danger');
    if (btn) {
      btn.disabled  = false;
      btn.innerHTML = '<i class="bi bi-credit-card me-1"></i>Pay Now';
    }
    return;
  }

  const { payfast_url, payfast_data } = result.data;

  // Build and submit a form to redirect the browser to PayFast
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = payfast_url;
  form.style.display = 'none';

  Object.entries(payfast_data).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type  = 'hidden';
    input.name  = key;
    input.value = String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
