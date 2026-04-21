// ============================================================
// VEHICLES — Uzimeleni Scholar Transport System
// ============================================================

let _editVehicleId = null;

async function renderVehicles() {
  showLoading('vehicles-content');
  await Promise.all([refreshVehicles(), refreshOwners(), refreshDrivers()]);

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
                <th>Make &amp; Model</th>
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
      <td>${escapeHtml(v.carType || `${v.make || ''} ${v.model || ''}`.trim())}</td>
      <td class="text-center">${statusBadge(v.status)}</td>
      ${canManage ? `
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary me-1" title="Edit"
                  onclick="openEditVehicleModal('${v.id}')">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" title="Delete"
                  onclick="deleteVehicleConfirm('${v.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </td>` : ''}
    </tr>`).join('');
}

function _populateOwnerSelect(selectedOwnerId) {
  const sel = document.getElementById('vehicle-owner');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select Owner…</option>' +
    getOwners().map(o =>
      `<option value="${o.id}" ${String(o.id) === String(selectedOwnerId) ? 'selected' : ''}>
        ${escapeHtml(o.name)} ${escapeHtml(o.surname)}
      </option>`
    ).join('');
}

function _populateVehicleDriverSelect(selectedDriverId) {
  const sel = document.getElementById('vehicle-driver');
  if (!sel) return;
  sel.innerHTML = '<option value="">No driver assigned</option>' +
    getDrivers().map(d =>
      `<option value="${d.id}" ${String(d.id) === String(selectedDriverId) ? 'selected' : ''}>
        ${escapeHtml(d.name)} ${escapeHtml(d.surname)}
      </option>`
    ).join('');
}

function _setVehicleFieldsLocked(locked) {
  ['vehicle-reg', 'vehicle-make', 'vehicle-model', 'vehicle-year'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.readOnly = locked;
  });
  ['vehicle-owner', 'vehicle-status'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = locked;
  });
}

function openAddVehicleModal() {
  _editVehicleId = null;
  document.getElementById('vehicleModalTitle').textContent = 'Add Vehicle';
  const form = document.getElementById('vehicle-form');
  form.reset();
  form.classList.remove('was-validated');
  _setVehicleFieldsLocked(false);
  _populateOwnerSelect(null);
  _populateVehicleDriverSelect('');
  bootstrap.Modal.getOrCreateInstance(document.getElementById('vehicleModal')).show();
}

function openEditVehicleModal(id) {
  _editVehicleId = id;
  const v = getVehicleById(id);
  if (!v) return;

  document.getElementById('vehicleModalTitle').textContent = 'Assign Driver';
  const form = document.getElementById('vehicle-form');
  form.classList.remove('was-validated');

  // Lock all fields — PUT only allows driver_id to change
  _setVehicleFieldsLocked(true);
  _populateOwnerSelect(v.ownerId);
  document.getElementById('vehicle-reg').value    = v.registrationNumber;
  document.getElementById('vehicle-make').value   = v.make  || '';
  document.getElementById('vehicle-model').value  = v.model || '';
  document.getElementById('vehicle-year').value   = v.year  || '';
  document.getElementById('vehicle-status').value = v.status;
  _populateVehicleDriverSelect(v.driverId || '');

  bootstrap.Modal.getOrCreateInstance(document.getElementById('vehicleModal')).show();
}

async function saveVehicle() {
  const form = document.getElementById('vehicle-form');
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;

  const saveBtn = document.querySelector('#vehicleModal .btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving…'; }

  try {
    if (_editVehicleId) {
      // PUT only updates driver_id
      await updateVehicle(_editVehicleId, {
        driverId: document.getElementById('vehicle-driver').value,
      });
      showToast('Driver assigned successfully', 'success');
    } else {
      await addVehicle({
        registrationNumber: document.getElementById('vehicle-reg').value.trim().toUpperCase(),
        ownerId:            document.getElementById('vehicle-owner').value,
        make:               document.getElementById('vehicle-make').value.trim(),
        model:              document.getElementById('vehicle-model').value.trim(),
        year:               document.getElementById('vehicle-year').value.trim(),
        status:             document.getElementById('vehicle-status').value,
        driverId:           document.getElementById('vehicle-driver').value,
      });
      showToast('Vehicle added successfully', 'success');
    }
    _setVehicleFieldsLocked(false);
    bootstrap.Modal.getInstance(document.getElementById('vehicleModal')).hide();
    renderVehiclesTable();
  } catch (err) {
    showToast(err.message || 'Failed to save vehicle.', 'danger');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Save Vehicle'; }
  }
}

async function deleteVehicleConfirm(id) {
  const v = getVehicleById(id);
  if (!v) return;
  if (!confirmAction(`Delete vehicle "${v.registrationNumber}"?`)) return;

  try {
    await deleteVehicle(id);
    deleteDocumentsByVehicle(id);
    showToast(`Vehicle ${v.registrationNumber} deleted`, 'warning');
    renderVehiclesTable();
  } catch (err) {
    showToast(err.message || 'Failed to delete vehicle.', 'danger');
  }
}
