// ============================================================
// VEHICLES — Uzimeleni Scholar Transport System
// ============================================================

let _editVehicleId = null;

async function renderVehicles() {
  showLoading('vehicles-content');
  await simulateDelay(300);

  const canManage = hasRole('chairperson');

  document.getElementById('vehicles-content').innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-semibold">Vehicles</h5>
      ${canManage ? `<button class="btn btn-primary" onclick="openAddVehicleModal()">
        <i class="bi bi-plus-lg me-1"></i>Add Vehicle</button>` : ''}
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th>Registration</th>
                <th>Owner</th>
                <th>Type</th>
                <th class="text-center">Status</th>
                ${canManage ? '<th class="text-center">Actions</th>' : ''}
              </tr>
            </thead>
            <tbody id="vehicles-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  renderVehiclesTable();
}

function renderVehiclesTable() {
  const user      = getCurrentUser();
  const canManage = hasRole('chairperson');
  let list        = getVehicles();

  if (user && user.role === 'owner') {
    list = list.filter(v => v.ownerId === user.ownerId);
  }

  if (user && user.role === 'security') {
    const suspendedIds = new Set(getOwners().filter(o => o.status === 'Suspended').map(o => o.id));
    list = list.filter(v => suspendedIds.has(v.ownerId));
  }

  const tbody = document.getElementById('vehicles-tbody');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${canManage ? 5 : 4}" class="text-center text-muted py-5">
      <i class="bi bi-truck fs-2 d-block mb-2"></i>No vehicles found</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(v => `
    <tr>
      <td><span class="fw-medium font-monospace">${escapeHtml(v.registrationNumber)}</span></td>
      <td>${escapeHtml(getOwnerName(v.ownerId))}</td>
      <td>${escapeHtml(v.carType)}</td>
      <td class="text-center">${statusBadge(v.status)}</td>
      ${canManage ? `
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary me-1" title="Edit" onclick="openEditVehicleModal(${v.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" title="Delete" onclick="deleteVehicleConfirm(${v.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>` : ''}
    </tr>`).join('');
}

function _populateOwnerSelect() {
  const sel = document.getElementById('vehicle-owner');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select Owner…</option>' +
    getOwners().map(o => `<option value="${o.id}">${escapeHtml(o.name)} ${escapeHtml(o.surname)}</option>`).join('');
}

function openAddVehicleModal() {
  _editVehicleId = null;
  document.getElementById('vehicleModalTitle').textContent = 'Add Vehicle';
  const form = document.getElementById('vehicle-form');
  form.reset();
  form.classList.remove('was-validated');
  _populateOwnerSelect();
  bootstrap.Modal.getOrCreateInstance(document.getElementById('vehicleModal')).show();
}

function openEditVehicleModal(id) {
  _editVehicleId = id;
  const v = getVehicleById(id);
  if (!v) return;

  document.getElementById('vehicleModalTitle').textContent = 'Edit Vehicle';
  const form = document.getElementById('vehicle-form');
  form.classList.remove('was-validated');
  _populateOwnerSelect();
  document.getElementById('vehicle-reg').value    = v.registrationNumber;
  document.getElementById('vehicle-owner').value  = v.ownerId;
  document.getElementById('vehicle-type').value   = v.carType;
  document.getElementById('vehicle-status').value = v.status;

  bootstrap.Modal.getOrCreateInstance(document.getElementById('vehicleModal')).show();
}

async function saveVehicle() {
  const form = document.getElementById('vehicle-form');
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;

  const data = {
    registrationNumber: document.getElementById('vehicle-reg').value.trim().toUpperCase(),
    ownerId:            parseInt(document.getElementById('vehicle-owner').value),
    carType:            document.getElementById('vehicle-type').value.trim(),
    status:             document.getElementById('vehicle-status').value,
  };

  if (_editVehicleId) {
    updateVehicle(_editVehicleId, data);
    showToast('Vehicle updated successfully', 'success');
  } else {
    addVehicle(data);
    showToast('Vehicle added successfully', 'success');
  }

  bootstrap.Modal.getInstance(document.getElementById('vehicleModal')).hide();
  renderVehiclesTable();
}

function deleteVehicleConfirm(id) {
  const v = getVehicleById(id);
  if (!v) return;
  if (confirmAction(`Delete vehicle "${v.registrationNumber}"?`)) {
    deleteVehicle(id);
    showToast(`Vehicle ${v.registrationNumber} deleted`, 'warning');
    renderVehiclesTable();
  }
}
