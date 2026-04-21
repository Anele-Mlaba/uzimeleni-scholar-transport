// ============================================================
// DOCUMENTS — Uzimeleni Scholar Transport System
// ============================================================

let _docOwnerFilter = null;
let _uploadContext  = { type: null, ownerId: null, vehicleId: null, driverId: null };

const DOC_TYPE_LABELS = {
  id:              'Identity Document (ID)',
  logbook:         'Log Book',
  permit:          'Operating Permit',
  drivers_license: "Driver's Licence",
  pdp:             'Professional Driving Permit (PDP)',
};

// ---- S3 path helper -----------------------------------------

function _getS3Folder(ctx) {
  if (ctx.type === 'id')   return `owners/${ctx.ownerId}/id`;
  if (ctx.vehicleId)       return `vehicles/${ctx.vehicleId}/${ctx.type}`;
  if (ctx.driverId)        return `drivers/${ctx.driverId}/${ctx.type}`;
  return `owners/${ctx.ownerId}/${ctx.type}`;
}

// ---- Main render --------------------------------------------

async function renderDocuments() {
  showLoading('documents-content');
  await Promise.all([refreshOwners(), refreshVehicles(), refreshDrivers()]);

  const user          = getCurrentUser();
  const isChairperson = hasRole('chairperson');
  const el            = document.getElementById('documents-content');

  if (isChairperson) {
    const ownerList = getOwners();
    if (!_docOwnerFilter && ownerList.length > 0) _docOwnerFilter = ownerList[0].id;

    el.innerHTML = `
      <div class="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <h5 class="mb-0 fw-semibold">Documents</h5>
        <div class="d-flex align-items-center gap-2">
          <label class="form-label mb-0 text-muted small fw-medium">View owner:</label>
          <select class="form-select form-select-sm" style="min-width:220px"
                  id="doc-owner-filter" onchange="filterDocsByOwner(this.value)">
            ${ownerList.map(o => `
              <option value="${o.id}" ${String(_docOwnerFilter) === String(o.id) ? 'selected' : ''}>
                ${escapeHtml(o.name)} ${escapeHtml(o.surname)}
              </option>`).join('')}
          </select>
        </div>
      </div>
      <div id="docs-for-owner"></div>`;

    if (_docOwnerFilter) _renderDocumentsForOwner(_docOwnerFilter);

  } else {
    el.innerHTML = `
      <div class="mb-4">
        <h5 class="mb-0 fw-semibold">My Documents</h5>
      </div>
      <div id="docs-for-owner"></div>`;
    _renderDocumentsForOwner(user.ownerId);
  }
}

function filterDocsByOwner(val) {
  _docOwnerFilter = val;
  _renderDocumentsForOwner(_docOwnerFilter);
}

// ---- Per-owner document view --------------------------------

function _renderDocumentsForOwner(ownerId) {
  const container = document.getElementById('docs-for-owner');
  if (!container) return;

  const owner       = getOwnerById(ownerId);
  if (!owner) { container.innerHTML = ''; return; }

  const vehicleList = getVehicles().filter(v => v.ownerId === ownerId);
  const driversList = getDriversByOwner(ownerId);
  const docs        = getDocumentsByOwner(ownerId);
  const canEdit     = hasRole('chairperson') ||
                      (hasRole('owner') && String(getCurrentUser()?.ownerId) === String(ownerId));

  container.innerHTML = `

    <!-- Identity Document -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-transparent py-3">
        <h6 class="mb-0 fw-semibold">
          <i class="bi bi-person-vcard me-2 text-primary"></i>Identity Document
        </h6>
      </div>
      <div class="card-body">
        ${_docSlot(docs, 'id', ownerId, null, null, canEdit)}
      </div>
    </div>

    <!-- Vehicle Documents -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-transparent py-3">
        <h6 class="mb-0 fw-semibold">
          <i class="bi bi-truck-front me-2 text-primary"></i>Vehicle Documents
          <span class="badge bg-secondary fw-normal ms-2">${vehicleList.length}</span>
        </h6>
      </div>
      <div class="card-body ${vehicleList.length > 0 ? 'p-0' : ''}">
        ${vehicleList.length === 0 ? `
          <div class="text-center text-muted py-4">
            <i class="bi bi-truck-front fs-2 d-block mb-2 opacity-50"></i>
            No vehicles registered for this owner
          </div>` : `
          <div class="accordion accordion-flush" id="vehicleDocAccordion">
            ${vehicleList.map((v, i) => `
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button ${i > 0 ? 'collapsed' : ''} py-3 fw-medium"
                          type="button" data-bs-toggle="collapse"
                          data-bs-target="#vdoc-${v.id}">
                    <i class="bi bi-truck-front me-2 text-secondary fs-6"></i>
                    ${escapeHtml(v.registrationNumber)}
                    <span class="text-muted fw-normal ms-2">— ${escapeHtml(v.carType || '')}</span>
                  </button>
                </h2>
                <div id="vdoc-${v.id}" class="accordion-collapse collapse ${i === 0 ? 'show' : ''}">
                  <div class="accordion-body">
                    <div class="row g-3">
                      <div class="col-md-6">
                        <p class="doc-slot-label">Log Book</p>
                        ${_docSlot(docs, 'logbook', ownerId, v.id, null, canEdit)}
                      </div>
                      <div class="col-md-6">
                        <p class="doc-slot-label">Operating Permit</p>
                        ${_docSlot(docs, 'permit', ownerId, v.id, null, canEdit)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>`).join('')}
          </div>`}
      </div>
    </div>

    <!-- Driver Documents -->
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-header bg-transparent py-3">
        <h6 class="mb-0 fw-semibold">
          <i class="bi bi-person-badge me-2 text-primary"></i>Driver Documents
          <span class="badge bg-secondary fw-normal ms-2">${driversList.length}</span>
        </h6>
      </div>
      <div class="card-body ${driversList.length > 0 ? 'p-0' : ''}">
        ${driversList.length === 0 ? `
          <div class="text-center text-muted py-4">
            <i class="bi bi-person-badge fs-2 d-block mb-2 opacity-50"></i>
            No drivers assigned to this owner
          </div>` : `
          <div class="accordion accordion-flush" id="driverDocAccordion">
            ${driversList.map((d, i) => `
              <div class="accordion-item">
                <h2 class="accordion-header">
                  <button class="accordion-button ${i > 0 ? 'collapsed' : ''} py-3 fw-medium"
                          type="button" data-bs-toggle="collapse"
                          data-bs-target="#ddoc-${d.id}">
                    <i class="bi bi-person-badge me-2 text-secondary fs-6"></i>
                    ${escapeHtml(d.name)} ${escapeHtml(d.surname)}
                    <span class="ms-2">${statusBadge(d.status)}</span>
                  </button>
                </h2>
                <div id="ddoc-${d.id}" class="accordion-collapse collapse ${i === 0 ? 'show' : ''}">
                  <div class="accordion-body">
                    <div class="row g-3">
                      <div class="col-md-6">
                        <p class="doc-slot-label">Driver's Licence</p>
                        ${_docSlot(docs, 'drivers_license', ownerId, null, d.id, canEdit)}
                      </div>
                      <div class="col-md-6">
                        <p class="doc-slot-label">Professional Driving Permit (PDP)</p>
                        ${_docSlot(docs, 'pdp', ownerId, null, d.id, canEdit)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>`).join('')}
          </div>`}
      </div>
    </div>`;
}

// ---- Document slot helper -----------------------------------

function _docSlot(docs, type, ownerId, vehicleId, driverId, canEdit) {
  let doc = null;
  if (type === 'id') {
    doc = docs.find(d => d.type === 'id');
  } else if (vehicleId != null) {
    doc = docs.find(d => d.type === type && String(d.vehicleId) === String(vehicleId));
  } else if (driverId != null) {
    doc = docs.find(d => d.type === type && String(d.driverId) === String(driverId));
  }

  if (doc) {
    const isImage = doc.fileType && doc.fileType.startsWith('image/');
    const icon    = isImage ? 'bi-file-earmark-image text-info' : 'bi-file-earmark-pdf text-danger';
    const meta    = (doc.fileSize ? _fmtSize(doc.fileSize) + ' · ' : '') +
                    'Uploaded ' + formatDate(doc.uploadedAt);
    return `
      <div class="d-flex align-items-center gap-3 p-3 rounded border doc-uploaded-card">
        <i class="bi ${icon} fs-2 flex-shrink-0"></i>
        <div class="flex-grow-1" style="min-width:0">
          <div class="fw-medium text-truncate" title="${escapeHtml(doc.fileName)}">${escapeHtml(doc.fileName)}</div>
          <div class="small text-muted">${meta}</div>
        </div>
        <div class="d-flex gap-1 flex-shrink-0">
          <button class="btn btn-sm btn-outline-primary" onclick="downloadDocument('${doc.id}')" title="Download">
            <i class="bi bi-download"></i>
          </button>
          ${canEdit ? `
          <button class="btn btn-sm btn-outline-danger" onclick="deleteDocumentConfirm('${doc.id}')" title="Delete">
            <i class="bi bi-trash"></i>
          </button>` : ''}
        </div>
      </div>`;
  }

  if (!canEdit) {
    return `<div class="text-muted small py-1">
              <i class="bi bi-x-circle me-1 text-danger"></i>Not uploaded</div>`;
  }

  return `
    <button class="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 px-3 py-2"
            onclick="openUploadDocModal('${type}','${ownerId}',${vehicleId != null ? `'${vehicleId}'` : 'null'},${driverId != null ? `'${driverId}'` : 'null'})">
      <i class="bi bi-cloud-upload"></i>Upload Document
    </button>`;
}

function _fmtSize(bytes) {
  if (bytes < 1024)    return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

// ---- Upload modal -------------------------------------------

function openUploadDocModal(type, ownerId, vehicleId, driverId) {
  _uploadContext = { type, ownerId, vehicleId, driverId };

  document.getElementById('doc-upload-type-label').textContent =
    DOC_TYPE_LABELS[type] || type;

  let entityLabel = '';
  if (vehicleId) {
    const v = getVehicleById(vehicleId);
    if (v) entityLabel = `${v.registrationNumber} — ${v.carType || ''}`;
  } else if (driverId) {
    const d = getDriverById(driverId);
    if (d) entityLabel = `${d.name} ${d.surname}`;
  }

  const entityRow = document.getElementById('doc-upload-entity-row');
  if (entityLabel) {
    document.getElementById('doc-upload-entity-value').textContent = entityLabel;
    entityRow.style.display = '';
  } else {
    entityRow.style.display = 'none';
  }

  document.getElementById('doc-file-input').value             = '';
  document.getElementById('doc-upload-error').style.display  = 'none';
  document.getElementById('doc-file-selected').style.display = 'none';

  const btn = document.getElementById('doc-save-btn');
  btn.disabled  = false;
  btn.innerHTML = '<i class="bi bi-cloud-upload me-1"></i>Upload';

  bootstrap.Modal.getOrCreateInstance(document.getElementById('docUploadModal')).show();
}

function _onDocFileChange(input) {
  const errEl = document.getElementById('doc-upload-error');
  const selEl = document.getElementById('doc-file-selected');
  const file  = input.files[0];

  errEl.style.display = 'none';
  selEl.style.display = 'none';

  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    errEl.textContent   = 'File is too large. Maximum size is 10 MB.';
    errEl.style.display = 'block';
    input.value         = '';
    return;
  }

  document.getElementById('doc-file-name').textContent = file.name;
  document.getElementById('doc-file-size').textContent = _fmtSize(file.size);
  selEl.style.display = 'block';
}

async function saveDocument() {
  const input   = document.getElementById('doc-file-input');
  const errEl   = document.getElementById('doc-upload-error');
  const saveBtn = document.getElementById('doc-save-btn');

  errEl.style.display = 'none';

  if (!input.files || !input.files[0]) {
    errEl.textContent   = 'Please select a file to upload.';
    errEl.style.display = 'block';
    return;
  }

  const file = input.files[0];
  saveBtn.disabled  = true;
  saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Uploading…';

  try {
    const folder      = _getS3Folder(_uploadContext);
    const contentType = file.type || 'application/octet-stream';

    // Step 1: get presigned POST URL from backend
    const urlResult = await FilesAPI.getUploadUrl(folder, file.name, contentType);
    if (!urlResult.ok) {
      throw new Error(urlResult.data?.error || 'Failed to get upload URL from server.');
    }

    const { url, fields, key } = urlResult.data;

    // Step 2: upload file directly to S3 using the presigned POST
    const formData = new FormData();
    Object.entries(fields || {}).forEach(([k, v]) => formData.append(k, v));
    formData.append('file', file);

    const s3Response = await fetch(url, { method: 'POST', body: formData });
    if (!s3Response.ok) {
      throw new Error('File upload to storage failed. Please try again.');
    }

    // Step 3: persist document metadata in localStorage
    const user = getCurrentUser();
    addDocument({
      ownerId:    _uploadContext.ownerId,
      type:       _uploadContext.type,
      vehicleId:  _uploadContext.vehicleId || null,
      driverId:   _uploadContext.driverId  || null,
      fileName:   file.name,
      fileType:   contentType,
      fileSize:   file.size,
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: user?.email || 'unknown',
      s3Key:      key || `${folder}/${file.name}`,
    });

    bootstrap.Modal.getInstance(document.getElementById('docUploadModal')).hide();
    showToast('Document uploaded successfully', 'success');
    _renderDocumentsForOwner(_uploadContext.ownerId);

  } catch (err) {
    errEl.textContent   = err.message || 'Upload failed. Please try again.';
    errEl.style.display = 'block';
    saveBtn.disabled  = false;
    saveBtn.innerHTML = '<i class="bi bi-cloud-upload me-1"></i>Upload';
  }
}

// ---- Download -----------------------------------------------

async function downloadDocument(id) {
  const doc = getDocumentById(id);
  if (!doc) return;

  if (!doc.s3Key) {
    showToast('No file stored for this document.', 'warning');
    return;
  }

  const parts  = doc.s3Key.split('/');
  const file   = parts.pop();
  const folder = parts.join('/');

  const result = await FilesAPI.getDownloadUrl(folder, file);
  if (!result.ok) {
    showToast(result.data?.error || 'Failed to get download URL.', 'danger');
    return;
  }

  const a = document.createElement('a');
  a.href     = result.data.url;
  a.target   = '_blank';
  a.download = doc.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast(`Downloading "${doc.fileName}"`, 'success');
}

// ---- Delete -------------------------------------------------

async function deleteDocumentConfirm(id) {
  const doc = getDocumentById(id);
  if (!doc) return;

  if (!confirmAction(`Delete "${doc.fileName}"?\nThis action cannot be undone.`)) return;

  const ownerId = doc.ownerId;

  // Delete from S3 via presigned DELETE URL
  if (doc.s3Key) {
    const parts  = doc.s3Key.split('/');
    const file   = parts.pop();
    const folder = parts.join('/');

    const result = await FilesAPI.getDeleteUrl(folder, file);
    if (result.ok && result.data?.url) {
      fetch(result.data.url, { method: 'DELETE' }).catch(console.error);
    }
  }

  deleteDocument(id);
  showToast('Document deleted', 'warning');
  _renderDocumentsForOwner(ownerId);
}
