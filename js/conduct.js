// ============================================================
// CODE OF CONDUCT — Zimeleni Scholar Transport System
// ============================================================

async function renderConduct() {
  document.getElementById('conduct-content').innerHTML = `
    <div class="mb-4">
      <h5 class="mb-0 fw-semibold">Code of Conduct</h5>
    </div>

    <div class="row justify-content-center">
      <div class="col-lg-7">
        <div class="card border-0 shadow-sm">
          <div class="card-body text-center py-5 px-4">
            <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger-subtle mb-4"
                 style="width:72px;height:72px">
              <i class="bi bi-file-earmark-pdf-fill text-danger" style="font-size:2rem"></i>
            </div>
            <h5 class="fw-bold mb-1">Zimeleni Scholar Transport</h5>
            <p class="text-muted mb-4">Code of Conduct</p>
            <div class="d-flex justify-content-center gap-3 flex-wrap">
              <button class="btn btn-primary px-4" onclick="openCodeOfConduct()">
                <i class="bi bi-eye me-2"></i>View PDF
              </button>
              <button class="btn btn-outline-secondary px-4" onclick="downloadCodeOfConduct()">
                <i class="bi bi-download me-2"></i>Download
              </button>
            </div>
            <div id="conduct-error" class="alert alert-danger mt-4 py-2 small" style="display:none"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function _getCodeOfConductUrl() {
  const result = await FilesAPI.getDownloadUrl('org', 'code_of_conduct.pdf');
  if (!result.ok) {
    throw new Error(result.data?.error || 'Could not retrieve the document. Please try again.');
  }
  return result.data.url;
}

async function openCodeOfConduct() {
  const errEl = document.getElementById('conduct-error');
  if (errEl) errEl.style.display = 'none';
  try {
    const url = await _getCodeOfConductUrl();
    window.open(url, '_blank', 'noopener');
  } catch (err) {
    if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
    else showToast(err.message, 'danger');
  }
}

async function downloadCodeOfConduct() {
  const errEl = document.getElementById('conduct-error');
  if (errEl) errEl.style.display = 'none';
  try {
    const url = await _getCodeOfConductUrl();
    const a = document.createElement('a');
    a.href     = url;
    a.download = 'Code_of_Conduct.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    if (errEl) { errEl.textContent = err.message; errEl.style.display = 'block'; }
    else showToast(err.message, 'danger');
  }
}
