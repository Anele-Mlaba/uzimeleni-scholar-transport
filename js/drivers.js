// ============================================================
// DRIVERS — Uzimeleni Scholar Transport System
// ============================================================

let _editDriverId = null;

async function renderDrivers() {
  showLoading('drivers-content');
  await simulateDelay(300);

  const canManage = hasRole('chairperson');

  document.getElementById('drivers-content').innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-semibold">Drivers</h5>
      ${canManage ? `<button class="btn btn-primary" onclick="openAddDriverModal()">
        <i class="bi bi-plus-lg me-1"></i>Add Driver</button>` : ''}
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Name</th>
                <th>ID Number</th>
                <th>Phone</th>
                <th class="text-center">Status</th>
                ${canManage ? '<th class="text-center">Actions</th>' : ''}
              </tr>
            </thead>
            <tbody id="drivers-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  renderDriversTable();
}

function renderDriversTable() {
  const canManage = hasRole('chairperson');
  const list      = getDrivers();
  const tbody     = document.getElementById('drivers-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${canManage ? 5 : 4}" class="text-center text-muted py-5">
      <i class="bi bi-person-badge fs-2 d-block mb-2"></i>No drivers found</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(d => `
    <tr>
      <td><div class="fw-medium">${escapeHtml(d.name)} ${escapeHtml(d.surname)}</div></td>
      <td class="text-muted font-monospace small">${escapeHtml(d.idNumber)}</td>
      <td>${escapeHtml(d.phone)}</td>
      <td class="text-center">${statusBadge(d.status)}</td>
      ${canManage ? `
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary me-1" title="Edit" onclick="openEditDriverModal(${d.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" title="Delete" onclick="deleteDriverConfirm(${d.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>` : ''}
    </tr>`).join('');
}

function openAddDriverModal() {
  _editDriverId = null;
  document.getElementById('driverModalTitle').textContent = 'Add Driver';
  const form = document.getElementById('driver-form');
  form.reset();
  form.classList.remove('was-validated');
  bootstrap.Modal.getOrCreateInstance(document.getElementById('driverModal')).show();
}

function openEditDriverModal(id) {
  _editDriverId = id;
  const d = getDriverById(id);
  if (!d) return;

  document.getElementById('driverModalTitle').textContent = 'Edit Driver';
  const form = document.getElementById('driver-form');
  form.classList.remove('was-validated');
  document.getElementById('driver-name').value     = d.name;
  document.getElementById('driver-surname').value  = d.surname;
  document.getElementById('driver-idnumber').value = d.idNumber;
  document.getElementById('driver-phone').value    = d.phone;
  document.getElementById('driver-status').value   = d.status;

  bootstrap.Modal.getOrCreateInstance(document.getElementById('driverModal')).show();
}

async function saveDriver() {
  const form = document.getElementById('driver-form');
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;

  const data = {
    name:     document.getElementById('driver-name').value.trim(),
    surname:  document.getElementById('driver-surname').value.trim(),
    idNumber: document.getElementById('driver-idnumber').value.trim(),
    phone:    document.getElementById('driver-phone').value.trim(),
    status:   document.getElementById('driver-status').value,
  };

  if (_editDriverId) {
    updateDriver(_editDriverId, data);
    showToast('Driver updated successfully', 'success');
  } else {
    addDriver(data);
    showToast('Driver added successfully', 'success');
  }

  bootstrap.Modal.getInstance(document.getElementById('driverModal')).hide();
  renderDriversTable();
}

function deleteDriverConfirm(id) {
  const d = getDriverById(id);
  if (!d) return;
  if (confirmAction(`Delete driver "${d.name} ${d.surname}"?`)) {
    deleteDriver(id);
    showToast(`${d.name} ${d.surname} deleted`, 'warning');
    renderDriversTable();
  }
}
