// ============================================================
// API CLIENT — Uzimeleni Scholar Transport System
// ============================================================
// Set this to your deployed API Gateway base URL (no trailing slash)
const API_BASE_URL = 'https://7q9or1mk2m.execute-api.eu-west-1.amazonaws.com/Stage';

// ── Core request ──────────────────────────────────────────────

async function _apiRequest(method, path, body = null, requiresAuth = true) {
  const headers = { 'Content-Type': 'application/json' };

  if (requiresAuth) {
    const user = getCurrentUser();
    if (user?.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }
  }

  const options = { method, headers };
  if (body !== null) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    let data = {};
    try { data = await response.json(); } catch (_) { /* non-JSON body */ }
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`API ${method} ${path} failed:`, error);
    return { ok: false, status: 0, data: { error: error.message } };
  }
}

// ── Auth ─────────────────────────────────────────────────────

const AuthAPI = {
  login: (id_number, password) =>
    _apiRequest('POST', '/auth/login', { id_number, password }, false),
  register: (id_number, name, password) =>
    _apiRequest('POST', '/auth/register', { id_number, name, password }, false),
  logout:   () =>
    _apiRequest('POST', '/auth/logout',   null,                            true),
};

// ── Owners ───────────────────────────────────────────────────

const OwnersAPI = {
  list:   ()             => _apiRequest('GET',    '/owners',       null),
  get:    (id)           => _apiRequest('GET',    `/owners/${id}`, null),
  create: (data)         => _apiRequest('POST',   '/owners',       data),
  update: (id, data)     => _apiRequest('PUT',    `/owners/${id}`, data),
  delete: (id)           => _apiRequest('DELETE', `/owners/${id}`, null),
};

// ── Vehicles ─────────────────────────────────────────────────

const VehiclesAPI = {
  list: (ownerId) => {
    const qs = ownerId ? `?owner_id=${encodeURIComponent(ownerId)}` : '';
    return _apiRequest('GET',    `/vehicles${qs}`,                                null);
  },
  get:    (regNumber)       => _apiRequest('GET',    `/vehicles/${encodeURIComponent(regNumber)}`, null),
  create: (data)            => _apiRequest('POST',   '/vehicles',                                  data),
  update: (regNumber, data) => _apiRequest('PUT',    `/vehicles/${encodeURIComponent(regNumber)}`, data),
  delete: (regNumber)       => _apiRequest('DELETE', `/vehicles/${encodeURIComponent(regNumber)}`, null),
};

// ── Drivers ──────────────────────────────────────────────────

const DriversAPI = {
  list:   ()             => _apiRequest('GET',  '/drivers',       null),
  create: (data)         => _apiRequest('POST', '/drivers',       data),
  update: (id, data)     => _apiRequest('PUT',  `/drivers/${id}`, data),
};

// ── Meetings ─────────────────────────────────────────────────

const MeetingsAPI = {
  list:   ()         => _apiRequest('GET',    '/meetings',       null),
  create: (data)     => _apiRequest('POST',   '/meetings',       data),
  update: (id, data) => _apiRequest('PUT',    `/meetings/${id}`, data),
  delete: (id)       => _apiRequest('DELETE', `/meetings/${id}`, null),
  recordAttendance: (id, attendeeIds) =>
    _apiRequest('POST', `/meetings/${id}/attendance`, { attendee_ids: attendeeIds }),
};

// ── Payments ─────────────────────────────────────────────────

const PaymentsAPI = {
  list: (ownerId, status) => {
    const params = new URLSearchParams();
    if (ownerId) params.set('owner_id', ownerId);
    if (status)  params.set('status',   status);
    const qs = params.toString();
    return _apiRequest('GET', `/payments${qs ? `?${qs}` : ''}`, null);
  },
  initiate: (data) => _apiRequest('POST', '/payments/initiate', data),
};

// ── Flags ────────────────────────────────────────────────────

const FlagsAPI = {
  list: (entityId, entityType, severity) => {
    const params = new URLSearchParams();
    if (entityId)   params.set('entity_id',   entityId);
    if (entityType) params.set('entity_type', entityType);
    if (severity)   params.set('severity',    severity);
    const qs = params.toString();
    return _apiRequest('GET',  `/flags${qs ? `?${qs}` : ''}`, null);
  },
  create: (data) => _apiRequest('POST', '/flags', data),
};

// ── Files (S3 presigned URLs) ─────────────────────────────────

const FilesAPI = {
  getDownloadUrl: (folder, file) =>
    _apiRequest('GET',
      `/files?folder=${encodeURIComponent(folder)}&file=${encodeURIComponent(file)}`,
      null),
  getUploadUrl: (folder, file, contentType) =>
    _apiRequest('POST', '/files', { folder, file, content_type: contentType }),
  getDeleteUrl: (folder, file) =>
    _apiRequest('DELETE',
      `/files?folder=${encodeURIComponent(folder)}&file=${encodeURIComponent(file)}`,
      null),
};

// ── Search ───────────────────────────────────────────────────

const SearchAPI = {
  byRegNumber: (regNumber) =>
    _apiRequest('GET', `/search?reg_number=${encodeURIComponent(regNumber)}`, null),
  byIdNumber:  (idNumber)  =>
    _apiRequest('GET', `/search?id_number=${encodeURIComponent(idNumber)}`,   null),
};
