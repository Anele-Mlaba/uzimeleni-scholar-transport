// ============================================================
// DATA — Zimeleni Scholar Transport System
// ============================================================

// ── Static public-site data (no API) ─────────────────────────

const COMMITTEE = [
  {
    name: 'John', surname: 'Dlamini', role: 'Chairperson',
    img: 'https://i.pravatar.cc/200?img=12',
    bio: 'Leading Zimeleni for over 12 years, John ensures every operator meets the highest safety and compliance standards.',
  },
  {
    name: 'Zanele', surname: 'Mokoena', role: 'Deputy Chairperson',
    img: 'https://i.pravatar.cc/200?img=25',
    bio: 'Zanele supports daily operations and steps in to represent the association at provincial transport forums.',
  },
  {
    name: 'Sarah', surname: 'Khumalo', role: 'Secretary',
    img: 'https://i.pravatar.cc/200?img=52',
    bio: 'Sarah manages all official correspondence, meeting minutes, and member registration for the association.',
  },
  {
    name: 'Mike', surname: 'Nkosi', role: 'Treasurer',
    img: 'https://i.pravatar.cc/200?img=65',
    bio: 'Mike oversees the financial health of the association and ensures transparent reporting to all members.',
  },
  {
    name: 'David', surname: 'Sithole', role: 'Safety Officer',
    img: 'https://i.pravatar.cc/200?img=33',
    bio: 'David is responsible for vehicle compliance, driver conduct, and coordinating roadworthy inspections.',
  },
  {
    name: 'Thandi', surname: 'Ndlovu', role: 'Community Liaison',
    img: 'https://i.pravatar.cc/200?img=47',
    bio: 'Thandi builds strong relationships between schools, parents, and transport operators across all routes.',
  },
];

const PUBLIC_STATS = {
  studentsTransported: 847,
  schoolsServiced:     12,
  activeRoutes:        24,
  yearsOperating:      8,
};

// ── Runtime caches (populated by refresh* functions) ─────────

let owners      = [];
let vehicles    = [];
let drivers     = [];
let meetings    = [];
let payments    = [];
let activityLog = [];

// Documents are fetched from S3, cached per owner
let _s3Docs = {};

// ── Field mappers: API ↔ frontend model ───────────────────────

function _fromApiOwner(o) {
  const parts = (o.name || '').trim().split(' ');
  return {
    id:           o.owner_id        || o.id             || '',
    name:         parts[0]          || '',
    surname:      parts.slice(1).join(' ')               || '',
    idNumber:     o.id_number       || '',
    phone:        o.phone           || '',
    email:        o.email           || '',
    address:      o.address         || '',
    status:       o.status          || 'Active',
    numberOfCars: o.number_of_cars  != null ? parseInt(o.number_of_cars) : 0,
  };
}

function _toApiOwner(data) {
  return {
    name:           `${data.name} ${data.surname}`.trim(),
    id_number:      data.idNumber,
    phone:          data.phone,
    email:          data.email,
    address:        data.address || '',
    status:         data.status,
    number_of_cars: data.numberOfCars != null ? parseInt(data.numberOfCars) : 0,
  };
}

function _fromApiVehicle(v) {
  const make  = v.make  || '';
  const model = v.model || '';
  const year  = v.year  ? ` (${v.year})` : '';
  return {
    id:                 v.vehicle_id         || v.reg_number || '',
    registrationNumber: v.reg_number         || '',
    ownerId:            v.owner_id           || null,
    driverId:           v.driver_id          || '',
    make,
    model,
    year:               v.year               ? String(v.year) : '',
    carType:            `${make} ${model}${year}`.trim(),
    status:             v.status             || 'Active',
  };
}

function _toApiVehicle(data) {
  return {
    reg_number: data.registrationNumber,
    make:       data.make,
    model:      data.model,
    year:       data.year ? parseInt(data.year) : undefined,
    owner_id:   data.ownerId,
    driver_id:  data.driverId || '',
  };
}

function _fromApiDriver(d) {
  const parts = (d.name || '').trim().split(' ');
  return {
    id:            d.driver_id       || d.id || '',
    name:          parts[0]          || '',
    surname:       parts.slice(1).join(' ')  || '',
    idNumber:      d.id_number       || '',
    licenseNumber: d.license_number  || '',
    licenseExpiry: d.license_expiry  || '',
    phone:         d.phone           || '',
    status:        d.status          || 'Active',
    ownerId:       d.owner_id        || null,
  };
}

function _toApiDriver(data) {
  return {
    name:           `${data.name} ${data.surname}`.trim(),
    id_number:      data.idNumber,
    license_number: data.licenseNumber,
    license_expiry: data.licenseExpiry || '',
    phone:          data.phone,
    status:         data.status,
    owner_id:       data.ownerId || null,
  };
}

function _fromApiMeeting(m) {
  return {
    id:        m.meeting_id  || m.id        || '',
    title:     m.title       || '',
    date:      (m.date        || '').slice(0, 10),
    location:  m.location    || '',
    startTime: (m.start_time || m.startTime || '').slice(0, 5),
    notes:     m.notes       || m.agenda    || '',
    attendees: (m.attendees || []).map(a => ({ name: a.name || '', idNumber: a.id_number || '', status: a.attendee_status || 'present' })),
    absentees: (m.absentees || []).map(a => ({ name: a.name || '', idNumber: a.id_number || '' })),
    locked:           m.is_locked === true || m.is_locked === 'true',
    minutes:          (m.minutes && typeof m.minutes === 'object') ? (m.minutes.content    || '') : (m.minutes    || ''),
    minutesUpdatedAt: (m.minutes && typeof m.minutes === 'object') ? (m.minutes.updated_at || '') : '',
  };
}

function _toApiMeeting(data) {
  return {
    title:      data.title      || '',
    date:       data.date       || '',
    location:   data.location   || '',
    start_time: data.startTime  || '',
    agenda:     data.notes      || '',
  };
}

function _fromApiPayment(p) {
  const status = p.status === 'outstanding' ? 'pending' : (p.status || 'pending');
  return {
    id:          p.payment_id   || p.id            || String(Date.now()),
    ownerId:     p.owner_id     || null,
    amount:      parseFloat(p.amount)              || 0,
    description: p.item_name    || p.description   || '',
    status,
    date:        p.created_at   ? p.created_at.split('T')[0] : (p.date || ''),
  };
}

function _fromApiManualPayment(p) {
  const owner = owners.find(o => o.idNumber === (p.id_number || ''));
  return {
    id:          p.payment_id   || String(Date.now()),
    ownerId:     owner ? owner.id : null,
    amount:      parseFloat(p.amount)              || 0,
    description: p.description  || '',
    status:      p.status === 'outstanding' ? 'pending' : (p.status || 'pending'),
    date:        p.created_at   ? p.created_at.split('T')[0] : '',
  };
}

// ── Refresh helpers (API → cache) ─────────────────────────────

async function refreshOwners() {
  const result = await OwnersAPI.list();
  if (result.ok && Array.isArray(result.data.owners)) {
    owners = result.data.owners.map(_fromApiOwner);
    _hydrateOwnerSession();
  }
}

// If the JWT didn't carry owner_id, look it up from the owners list and persist it.
function _hydrateOwnerSession() {
  const user = getCurrentUser();
  if (!user || user.role !== 'owner' || user.ownerId) return;
  const match = owners.find(o => o.idNumber === user.id_number);
  if (!match) return;
  user.ownerId = match.id;
  localStorage.setItem('ust_user', JSON.stringify(user));
}

async function refreshVehicles() {
  const user    = getCurrentUser();
  const ownerId = (user && user.role === 'owner') ? user.ownerId : null;
  const result  = await VehiclesAPI.list(ownerId || undefined);
  if (result.ok && Array.isArray(result.data.vehicles)) {
    vehicles = result.data.vehicles.map(_fromApiVehicle);
  }
}

async function refreshDrivers() {
  const result = await DriversAPI.list();
  if (result.ok && Array.isArray(result.data.drivers)) {
    drivers = result.data.drivers.map(_fromApiDriver);
  }
}

async function refreshMeetings() {
  const result = await MeetingsAPI.list();
  if (result.ok && Array.isArray(result.data.meetings)) {
    meetings = result.data.meetings
      .filter(m => m.meeting_status === 'active')
      .map(_fromApiMeeting);
  }
}

async function refreshPayments() {
  const user    = getCurrentUser();
  const ownerId = (user && user.role === 'owner') ? user.ownerId : null;

  const [regularResult, manualResult] = await Promise.all([
    PaymentsAPI.list(ownerId),
    ManualPaymentsAPI.list(),
  ]);

  const regular = (regularResult.ok && Array.isArray(regularResult.data.payments))
    ? regularResult.data.payments.map(_fromApiPayment)
    : [];

  const manual = (manualResult.ok && Array.isArray(manualResult.data.payments))
    ? manualResult.data.payments.map(_fromApiManualPayment)
    : [];

  payments = [...regular, ...manual];
}

// ── Sync getters (read from cache) ────────────────────────────

function getOwners()                { return [...owners]; }
function getOwnerById(id)           { return owners.find(o => o.id === id); }

function getVehicles()              { return [...vehicles]; }
function getVehicleById(id)         { return vehicles.find(v => v.id === id); }

function getDrivers()               { return [...drivers]; }
function getDriverById(id)          { return drivers.find(d => d.id === id); }
function getDriversByOwner(ownerId) { return drivers.filter(d => d.ownerId === ownerId); }

function getMeetings()              { return [...meetings]; }
function getMeetingById(id)         { return meetings.find(m => m.id === id); }

function getPayments()              { return [...payments]; }
function getPaymentsByOwner(ownerId){ return payments.filter(p => p.ownerId === ownerId); }

// ── Owner mutations ───────────────────────────────────────────

async function addOwner(data) {
  const result = await OwnersAPI.create(_toApiOwner(data));
  if (!result.ok) throw new Error(result.data?.error || 'Failed to create owner');
  const newOwner = { ...data, id: result.data.owner_id };
  owners.push(newOwner);
  addActivity(`Owner ${data.name} ${data.surname} registered`, 'bi-person-plus', 'owner');
  return newOwner;
}

async function updateOwner(id, data) {
  const result = await OwnersAPI.update(id, _toApiOwner(data));
  if (!result.ok) throw new Error(result.data?.error || 'Failed to update owner');
  const idx = owners.findIndex(o => o.id === id);
  if (idx !== -1) owners[idx] = { ...owners[idx], ...data };
  return owners[idx];
}

async function deleteOwner(id) {
  const result = await OwnersAPI.delete(id);
  if (!result.ok) throw new Error(result.data?.error || 'Failed to delete owner');
  owners = owners.filter(o => o.id !== id);
}

// ── Vehicle mutations ─────────────────────────────────────────

async function addVehicle(data) {
  const result = await VehiclesAPI.create(_toApiVehicle(data));
  if (!result.ok) throw new Error(result.data?.error || 'Failed to create vehicle');
  const make  = data.make  || '';
  const model = data.model || '';
  const year  = data.year  ? ` (${data.year})` : '';
  const newVehicle = { ...data, id: data.registrationNumber, carType: `${make} ${model}${year}`.trim() };
  vehicles.push(newVehicle);
  addActivity(`Vehicle ${data.registrationNumber} added to fleet`, 'bi-truck', 'vehicle');
  return newVehicle;
}

async function updateVehicle(id, data) {
  const v = getVehicleById(id);
  if (!v) throw new Error('Vehicle not found');
  // PUT only accepts driver_id
  const result = await VehiclesAPI.update(v.registrationNumber, { driver_id: data.driverId || '' });
  if (!result.ok) throw new Error(result.data?.error || 'Failed to update vehicle');
  const idx = vehicles.findIndex(x => x.id === id);
  if (idx !== -1) vehicles[idx] = { ...vehicles[idx], driverId: data.driverId || '' };
  return vehicles[idx];
}

async function deleteVehicle(id) {
  const v = getVehicleById(id);
  if (!v) throw new Error('Vehicle not found');
  const result = await VehiclesAPI.delete(v.registrationNumber);
  if (!result.ok) throw new Error(result.data?.error || 'Failed to delete vehicle');
  vehicles = vehicles.filter(x => x.id !== id);
}

// ── Driver mutations ──────────────────────────────────────────

async function addDriver(data) {
  const result = await DriversAPI.create(_toApiDriver(data));
  if (!result.ok) throw new Error(result.data?.error || 'Failed to create driver');
  const newDriver = { ...data, id: result.data.driver_id };
  drivers.push(newDriver);
  addActivity(`Driver ${data.name} ${data.surname} added`, 'bi-person-badge', 'driver');
  return newDriver;
}

async function updateDriver(id, data) {
  const result = await DriversAPI.update(id, _toApiDriver(data));
  if (!result.ok) throw new Error(result.data?.error || 'Failed to update driver');
  const idx = drivers.findIndex(d => d.id === id);
  if (idx !== -1) drivers[idx] = { ...drivers[idx], ...data };
  return drivers[idx];
}

async function deleteDriver(id) {
  // No DELETE /drivers/{id} in backend yet — local removal only
  drivers = drivers.filter(d => d.id !== id);
}

// ── Meeting mutations ─────────────────────────────────────────

async function addMeeting(data) {
  const result = await MeetingsAPI.create(_toApiMeeting(data));
  if (!result.ok) throw new Error(result.data?.error || 'Failed to create meeting');
  const newMeeting = {
    ...data,
    id:         result.data.meeting_id,
    attendance: owners.map(o => ({ ownerId: o.id, status: 'absent' })),
    minutes:    '',
  };
  meetings.push(newMeeting);
  addActivity(`Meeting: ${data.title} scheduled`, 'bi-calendar-event', 'meeting');
  return newMeeting;
}

async function updateMeeting(id, data) {
  const current = getMeetingById(id);
  if (!current) throw new Error('Meeting not found');
  const merged = { ...current, ...data };

  const hasApiFields = 'title' in data || 'date' in data || 'location' in data ||
                       'startTime' in data || 'notes' in data;
  if (hasApiFields) {
    const result = await MeetingsAPI.update(id, _toApiMeeting(merged));
    if (!result.ok) throw new Error(result.data?.error || 'Failed to update meeting');
  }

  const idx = meetings.findIndex(m => m.id === id);
  if (idx !== -1) meetings[idx] = merged;
  return meetings[idx];
}

async function lockMeeting(id) {
  const result = await MeetingsAPI.lock(id);
  if (!result.ok) throw new Error(result.data?.error || 'Failed to lock meeting');
  const idx = meetings.findIndex(m => m.id === id);
  if (idx !== -1) meetings[idx] = { ...meetings[idx], locked: true };
}

async function saveMeetingMinutes(id, content) {
  const result = await MeetingsAPI.saveMinutes(id, content);
  if (!result.ok) throw new Error(result.data?.error || 'Failed to save minutes');
  const idx = meetings.findIndex(m => m.id === id);
  if (idx !== -1) meetings[idx] = { ...meetings[idx], minutes: content, minutesUpdatedAt: new Date().toISOString() };
}

async function deleteMeeting(id) {
  const result = await MeetingsAPI.delete(id);
  if (!result.ok) throw new Error(result.data?.error || 'Failed to delete meeting');
  meetings = meetings.filter(m => m.id !== id);
}

async function updateAttendance(meetingId, ownerId, status = 'present') {
  const meeting = getMeetingById(meetingId);
  if (!meeting) throw new Error('Meeting not found');
  const owner = getOwnerById(ownerId);
  if (!owner) throw new Error('Owner not found');

  const existing = (meeting.attendees || [])
    .filter(a => a.idNumber && a.idNumber !== owner.idNumber)
    .map(a => ({ id_number: a.idNumber, attendee_status: a.status || 'present' }));
  existing.push({ id_number: owner.idNumber, attendee_status: status });

  const result = await MeetingsAPI.recordAttendance(meetingId, existing);
  if (!result.ok) throw new Error(result.data?.error || 'Failed to record attendance');

  await refreshMeetings();
}

// ── Payment mutations ─────────────────────────────────────────

async function createFine(ownerId, amount, description, reason = 'custom') {
  const owner = getOwnerById(ownerId);
  if (!owner) throw new Error('Owner not found');
  const result = await ManualPaymentsAPI.create({
    id_number:   owner.idNumber,
    reason,
    amount:      parseFloat(amount.toFixed(2)),
    description,
  });
  if (!result.ok) throw new Error(result.data?.error || 'Failed to create fine');
  await refreshPayments();
}

function addPayment(payment) {
  payments.push(payment);
  const owner = getOwnerById(payment.ownerId);
  if (owner) addActivity(`Payment received from ${owner.name} ${owner.surname} (R${payment.amount})`, 'bi-cash', 'payment');
  return payment;
}

function markPaymentPaid(id) {
  const idx = payments.findIndex(p => p.id === id);
  if (idx !== -1) {
    payments[idx].status = 'paid';
    payments[idx].date   = new Date().toISOString().split('T')[0];
  }
  return payments[idx];
}

// ── Flags (auto-computed from cached data) ────────────────────

function getFlags() {
  return owners.reduce((flagged, owner) => {
    const reasons = [];

    const absentCount = meetings.reduce((n, m) => {
      return n + ((m.absentees || []).some(a => a.idNumber === owner.idNumber) ? 1 : 0);
    }, 0);
    if (absentCount >= 3) {
      reasons.push(`Absent from ${absentCount} meeting(s)`);
    }

    const unpaid = payments.filter(p => p.ownerId === owner.id && p.status === 'pending');
    if (unpaid.length > 0) {
      const total = unpaid.reduce((s, p) => s + p.amount, 0);
      reasons.push(`${unpaid.length} unpaid payment(s) — R${total} outstanding`);
    }

    if (reasons.length > 0) flagged.push({ owner, reasons });
    return flagged;
  }, []);
}

// ── Activity log ──────────────────────────────────────────────

function addActivity(action, icon, type) {
  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
  activityLog.unshift({ id: Date.now(), action, timestamp, icon, type });
  if (activityLog.length > 20) activityLog.pop();
}

function getRecentActivities(limit = 6) {
  return activityLog.slice(0, limit);
}

// ── Documents (S3-backed) ─────────────────────────────────────

const _MIME_BY_EXT = {
  pdf:  'application/pdf',
  jpg:  'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif:  'image/gif',  webp: 'image/webp',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function _mimeFromName(name) {
  const ext = (name || '').split('.').pop().toLowerCase();
  return _MIME_BY_EXT[ext] || 'application/octet-stream';
}

function _s3DocFromFile(f, slot, ownerId) {
  return {
    id:         `${slot.folder}/${f.name}`,
    ownerId,
    type:       slot.type,
    vehicleId:  slot.vehicleId  || null,
    driverId:   slot.driverId   || null,
    fileName:   f.name,
    fileType:   _mimeFromName(f.name),
    fileSize:   f.size          || 0,
    uploadedAt: f.last_modified ? f.last_modified.split('T')[0] : '',
    s3Key:      `${slot.folder}/${f.name}`,
  };
}

async function refreshDocumentsFromS3(ownerId) {
  const ownerVehicles = vehicles.filter(v => v.ownerId === ownerId);
  const ownerDrivers  = drivers.filter(d => d.ownerId === ownerId);

  const slots = [
    { folder: `owners/${ownerId}/id`,    type: 'id',             vehicleId: null, driverId: null },
    ...ownerVehicles.flatMap(v => [
      { folder: `vehicles/${v.id}/logbook`, type: 'logbook',        vehicleId: v.id,  driverId: null },
      { folder: `vehicles/${v.id}/permit`,  type: 'permit',         vehicleId: v.id,  driverId: null },
    ]),
    ...ownerDrivers.flatMap(d => [
      { folder: `drivers/${d.id}/drivers_license`, type: 'drivers_license', vehicleId: null, driverId: d.id },
      { folder: `drivers/${d.id}/pdp`,             type: 'pdp',             vehicleId: null, driverId: d.id },
    ]),
  ];

  const results = await Promise.all(
    slots.map(slot => FilesAPI.list(slot.folder).then(r => ({ slot, r })))
  );

  const docs = [];
  results.forEach(({ slot, r }) => {
    if (!r.ok) return;
    const files = Array.isArray(r.data.files) ? r.data.files : [];
    files.forEach(f => docs.push(_s3DocFromFile(f, slot, ownerId)));
  });

  _s3Docs[ownerId] = docs;
}

function getDocumentsByOwner(ownerId) { return _s3Docs[ownerId] || []; }
function getDocumentById(id)          {
  return Object.values(_s3Docs).flat().find(d => d.id === id);
}

function logDocumentActivity(doc) {
  const owner = getOwnerById(doc.ownerId);
  if (owner) addActivity(
    `Document uploaded for ${owner.name} ${owner.surname} (${doc.fileName})`,
    'bi-file-earmark', 'document'
  );
}

function deleteDocument(id) {
  for (const ownerId of Object.keys(_s3Docs)) {
    _s3Docs[ownerId] = (_s3Docs[ownerId] || []).filter(d => d.id !== id);
  }
}

function deleteDocumentsByVehicle(vehicleId) {
  for (const ownerId of Object.keys(_s3Docs)) {
    _s3Docs[ownerId] = (_s3Docs[ownerId] || []).filter(d => d.vehicleId !== vehicleId);
  }
}

function deleteDocumentsByDriver(driverId) {
  for (const ownerId of Object.keys(_s3Docs)) {
    _s3Docs[ownerId] = (_s3Docs[ownerId] || []).filter(d => d.driverId !== driverId);
  }
}
