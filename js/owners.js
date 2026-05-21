// ============================================================
// OWNERS — Zimeleni Scholar Transport System
// ============================================================

let _editOwnerId = null;
let _ownerSearch = '';

async function renderOwners() {
  showLoading('owners-content');
  await refreshOwners();

  const canManage = hasRole('chairperson');

  document.getElementById('owners-content').innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-semibold">Owners Management</h5>
      ${canManage ? `<button class="btn btn-primary" onclick="openAddOwnerModal()">
        <i class="bi bi-plus-lg me-1"></i>Add Owner</button>` : ''}
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-header bg-transparent py-3">
        <div class="row g-2 align-items-center">
          <div class="col-md-5">
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
              <input type="text" id="owners-search" class="form-control border-start-0"
                     placeholder="Search by name or ID…" value="${escapeHtml(_ownerSearch)}"
                     oninput="searchOwners(this.value)">
            </div>
          </div>
          <div class="col-md-7 text-md-end">
            <small class="text-muted" id="owners-count"></small>
          </div>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Name</th>
                <th>ID Number</th>
                <th>Phone</th>
                <th>Email</th>
                <th class="text-center">Cars</th>
                <th class="text-center">Status</th>
                ${canManage ? '<th class="text-center">Actions</th>' : ''}
              </tr>
            </thead>
            <tbody id="owners-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  renderOwnersTable();
}

function renderOwnersTable() {
  const user      = getCurrentUser();
  const canManage = hasRole('chairperson');
  let list        = getOwners();

  if (user && user.role === 'owner') {
    list = list.filter(o => o.id === user.ownerId);
  }

  if (_ownerSearch.trim()) {
    const term = _ownerSearch.toLowerCase();
    list = list.filter(o =>
      (o.name    || '').toLowerCase().includes(term) ||
      (o.surname || '').toLowerCase().includes(term) ||
      (o.idNumber || '').includes(term)
    );
  }

  const countEl = document.getElementById('owners-count');
  if (countEl) countEl.textContent = `Showing ${list.length} owner(s)`;

  const tbody = document.getElementById('owners-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${canManage ? 7 : 6}" class="text-center text-muted py-5">
      <i class="bi bi-people fs-2 d-block mb-2"></i>No owners found</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(o => `
    <tr>
      <td>
        <div class="fw-medium">${escapeHtml(o.name)} ${escapeHtml(o.surname)}</div>
      </td>
      <td class="text-muted font-monospace small">${escapeHtml(o.idNumber)}</td>
      <td>${escapeHtml(o.phone)}</td>
      <td class="text-muted small">${o.email ? escapeHtml(o.email) : '—'}</td>
      <td class="text-center">${o.numberOfCars}</td>
      <td class="text-center">${statusBadge(o.status)}</td>
      ${canManage ? `
        <td class="text-center">
          <button class="btn btn-sm btn-outline-secondary me-1" title="View details"
                  onclick="openOwnerDetailsModal('${o.id}')">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-sm btn-outline-primary me-1" title="Edit"
                  onclick="openEditOwnerModal('${o.id}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-${o.status === 'Suspended' ? 'success' : 'warning'} me-1"
                  title="${o.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}"
                  onclick="${o.status === 'Suspended' ? 'unsuspendOwnerAction' : 'suspendOwnerAction'}('${o.id}')">
            <i class="bi bi-${o.status === 'Suspended' ? 'unlock' : 'lock'}"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" title="Delete"
                  onclick="deleteOwnerConfirm('${o.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>` : ''}
    </tr>`).join('');
}

function searchOwners(term) {
  _ownerSearch = term;
  renderOwnersTable();
}

function openAddOwnerModal() {
  _editOwnerId = null;
  document.getElementById('ownerModalTitle').textContent = 'Add Owner';
  const form = document.getElementById('owner-form');
  form.reset();
  form.classList.remove('was-validated');
  document.getElementById('owner-cars').value = 1;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('ownerModal')).show();
}

function openEditOwnerModal(id) {
  _editOwnerId = id;
  const o = getOwnerById(id);
  if (!o) return;

  document.getElementById('ownerModalTitle').textContent = 'Edit Owner';
  const form = document.getElementById('owner-form');
  form.classList.remove('was-validated');
  document.getElementById('owner-name').value     = o.name;
  document.getElementById('owner-surname').value  = o.surname;
  document.getElementById('owner-idnumber').value = o.idNumber;
  document.getElementById('owner-phone').value    = o.phone;
  document.getElementById('owner-email').value    = o.email || '';
  document.getElementById('owner-address').value  = o.address || '';
  document.getElementById('owner-status').value   = o.status;
  document.getElementById('owner-cars').value     = o.numberOfCars;

  bootstrap.Modal.getOrCreateInstance(document.getElementById('ownerModal')).show();
}

async function saveOwner() {
  const form = document.getElementById('owner-form');
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;

  const data = {
    name:         document.getElementById('owner-name').value.trim(),
    surname:      document.getElementById('owner-surname').value.trim(),
    idNumber:     document.getElementById('owner-idnumber').value.trim(),
    phone:        document.getElementById('owner-phone').value.trim(),
    email:        document.getElementById('owner-email').value.trim(),
    address:      document.getElementById('owner-address').value.trim(),
    status:       document.getElementById('owner-status').value,
    numberOfCars: parseInt(document.getElementById('owner-cars').value) || 0,
  };

  const saveBtn = document.querySelector('#ownerModal .btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving…'; }

  try {
    if (_editOwnerId) {
      await updateOwner(_editOwnerId, data);
      showToast('Owner updated successfully', 'success');
    } else {
      await addOwner(data);
      showToast('Owner added successfully', 'success');
    }
    bootstrap.Modal.getInstance(document.getElementById('ownerModal')).hide();
    renderOwnersTable();
  } catch (err) {
    showToast(err.message || 'Failed to save owner.', 'danger');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Save Owner'; }
  }
}

async function suspendOwnerAction(id) {
  const o = getOwnerById(id);
  if (!o) return;
  if (!confirmAction(`Suspend owner "${o.name} ${o.surname}"?`)) return;
  try {
    await suspendOwner(id);
    showToast(`${o.name} ${o.surname} suspended`, 'warning');
    renderOwnersTable();
  } catch (err) {
    showToast(err.message || 'Failed to suspend owner.', 'danger');
  }
}

async function unsuspendOwnerAction(id) {
  const o = getOwnerById(id);
  if (!o) return;
  if (!confirmAction(`Unsuspend owner "${o.name} ${o.surname}"?`)) return;
  try {
    await unsuspendOwner(id);
    showToast(`${o.name} ${o.surname} unsuspended`, 'success');
    renderOwnersTable();
  } catch (err) {
    showToast(err.message || 'Failed to unsuspend owner.', 'danger');
  }
}

async function deleteOwnerConfirm(id) {
  const o = getOwnerById(id);
  if (!o) return;
  if (!confirmAction(`Delete owner "${o.name} ${o.surname}"?\nThis action cannot be undone.`)) return;

  try {
    await deleteOwner(id);
    showToast(`${o.name} ${o.surname} deleted`, 'warning');
    renderOwnersTable();
  } catch (err) {
    showToast(err.message || 'Failed to delete owner.', 'danger');
  }
}

// ── Owner Details (with drivers section) ──────────────────────

async function openOwnerDetailsModal(id) {
  const o = getOwnerById(id);
  if (!o) return;

  document.getElementById('owner-details-info').innerHTML = `
    <div class="row g-2 small">
      <div class="col-md-6"><strong>Name:</strong> ${escapeHtml(o.name)} ${escapeHtml(o.surname)}</div>
      <div class="col-md-6"><strong>ID Number:</strong> <span class="font-monospace">${escapeHtml(o.idNumber)}</span></div>
      <div class="col-md-6"><strong>Phone:</strong> ${escapeHtml(o.phone)}</div>
      <div class="col-md-6"><strong>Email:</strong> ${o.email ? escapeHtml(o.email) : '<span class="text-muted">—</span>'}</div>
      <div class="col-md-6"><strong>Status:</strong> ${statusBadge(o.status)}</div>
      <div class="col-md-6"><strong>Cars:</strong> ${o.numberOfCars}</div>
    </div>`;

  const addBtn = document.getElementById('owner-details-add-driver-btn');
  addBtn.onclick = () => openAddDriverModal(o.id);

  const listEl = document.getElementById('owner-details-drivers');
  listEl.innerHTML = `<div class="text-center text-muted py-4">
    <span class="spinner-border spinner-border-sm me-2"></span>Loading drivers…</div>`;

  bootstrap.Modal.getOrCreateInstance(document.getElementById('ownerDetailsModal')).show();

  const result = await OwnersAPI.listDrivers(o.id);

  if (!result.ok) {
    const msg = result.status === 404
      ? 'Owner not found.'
      : (result.data?.error || 'Failed to load drivers.');
    listEl.innerHTML = `<div class="alert alert-danger mb-0">${escapeHtml(msg)}</div>`;
    document.getElementById('owner-details-drivers-count').textContent = '0';
    return;
  }

  const apiDrivers = Array.isArray(result.data.drivers) ? result.data.drivers : [];
  const driverList = apiDrivers.map(_fromApiDriver);
  document.getElementById('owner-details-drivers-count').textContent = String(driverList.length);

  if (driverList.length === 0) {
    listEl.innerHTML = `<div class="text-center text-muted py-4">
      <i class="bi bi-person-badge fs-2 d-block mb-2 opacity-50"></i>
      No drivers linked to this owner yet.</div>`;
    return;
  }

  listEl.innerHTML = `
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>License No.</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${driverList.map(d => `
            <tr style="cursor:pointer" onclick="_openDriverFromOwnerDetails('${d.id}')">
              <td><div class="fw-medium">${escapeHtml(d.name)} ${escapeHtml(d.surname)}</div></td>
              <td>${escapeHtml(d.phone)}</td>
              <td class="text-muted small font-monospace">${escapeHtml(d.licenseNumber || '—')}</td>
              <td class="text-center">${statusBadge(d.status)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

function _openDriverFromOwnerDetails(driverId) {
  // Close the details modal first so we don't stack modals
  bootstrap.Modal.getInstance(document.getElementById('ownerDetailsModal'))?.hide();
  // Ensure the driver is in the local cache for openEditDriverModal to find
  if (!getDriverById(driverId)) {
    refreshDrivers().then(() => openEditDriverModal(driverId));
  } else {
    openEditDriverModal(driverId);
  }
}
