// ============================================================
// DATA — Uzimeleni Scholar Transport System
// ============================================================

// ── Static public-site data (no API) ─────────────────────────

const COMMITTEE = [
  {
    name: 'John', surname: 'Dlamini', role: 'Chairperson',
    img: 'https://i.pravatar.cc/200?img=12',
    bio: 'Leading Uzimeleni for over 12 years, John ensures every operator meets the highest safety and compliance standards.',
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

// Documents are persisted in localStorage (no backend CRUD endpoint yet)
let documents = _loadDocumentsFromStorage();

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
    date:      m.date        || '',
    location:  m.location    || '',
    startTime: m.start_time  || m.startTime || '',
    notes:     m.notes       || m.agenda    || '',
    attendees: (m.attendees || []).map(a => ({ name: a.name || '', idNumber: a.id_number || '' })),
    absentees: (m.absentees || []).map(a => ({ name: a.name || '', idNumber: a.id_number || '' })),
    minutes:   m.minutes     || '',
  };
}

function _toApiMeeting(data) {
  return {
    title:      data.title      || '',
    date:       data.date       || '',
    location:   data.location   || '',
    start_time: data.startTime  || '',
    agenda:     data.notes      || '',
    minutes:    data.minutes    || '',
  };
}

function _fromApiPayment(p) {
  return {
    id:          p.payment_id   || p.id            || String(Date.now()),
    ownerId:     p.owner_id     || null,
    amount:      parseFloat(p.amount)              || 0,
    description: p.item_name    || p.description   || '',
    status:      p.status       || 'pending',
    date:        p.created_at   ? p.created_at.split('T')[0] : (p.date || ''),
  };
}

// ── Refresh helpers (API → cache) ─────────────────────────────

async function refreshOwners() {
  const result = await OwnersAPI.list();
  if (result.ok && Array.isArray(result.data.owners)) {
    owners = result.data.owners.map(_fromApiOwner);
  }
}

async function refreshVehicles() {
  const result = await VehiclesAPI.list();
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
  const user = getCurrentUser();
  const ownerId = (user && user.role === 'owner') ? user.ownerId : null;
  const result = await PaymentsAPI.list(ownerId);
  if (result.ok && Array.isArray(result.data.payments)) {
    payments = result.data.payments.map(_fromApiPayment);
  }
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

  // Call API only when updating actual meeting fields (not local-only attendance)
  const hasApiFields = 'title' in data || 'date' in data || 'location' in data ||
                       'startTime' in data || 'notes' in data || 'minutes' in data;
  if (hasApiFields) {
    const result = await MeetingsAPI.update(id, _toApiMeeting(merged));
    if (!result.ok) throw new Error(result.data?.error || 'Failed to update meeting');
  }

  const idx = meetings.findIndex(m => m.id === id);
  if (idx !== -1) meetings[idx] = merged;
  return meetings[idx];
}

async function deleteMeeting(id) {
  const result = await MeetingsAPI.delete(id);
  if (!result.ok) throw new Error(result.data?.error || 'Failed to delete meeting');
  meetings = meetings.filter(m => m.id !== id);
}

function updateAttendance(meetingId, ownerId, attended) {
  const meeting = meetings.find(m => m.id === meetingId);
  if (!meeting) return;
  const owner = getOwnerById(ownerId);
  if (!owner) return;

  if (!meeting.attendees) meeting.attendees = [];
  if (!meeting.absentees) meeting.absentees = [];

  const person = { name: `${owner.name} ${owner.surname}`, idNumber: owner.idNumber };

  if (attended) {
    if (!meeting.attendees.some(a => a.idNumber === owner.idNumber)) {
      meeting.attendees.push(person);
    }
    meeting.absentees = meeting.absentees.filter(a => a.idNumber !== owner.idNumber);
  } else {
    meeting.attendees = meeting.attendees.filter(a => a.idNumber !== owner.idNumber);
    if (!meeting.absentees.some(a => a.idNumber === owner.idNumber)) {
      meeting.absentees.push(person);
    }
  }

  const idNumbers = meeting.attendees.map(a => a.idNumber);
  MeetingsAPI.recordAttendance(meetingId, idNumbers).catch(console.error);
}

// ── Payment mutations ─────────────────────────────────────────

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

// ── Documents (localStorage-backed) ──────────────────────────

function _loadDocumentsFromStorage() {
  try {
    return JSON.parse(localStorage.getItem('ust_documents') || '[]');
  } catch {
    return [];
  }
}

function _persistDocuments() {
  localStorage.setItem('ust_documents', JSON.stringify(documents));
}

function getDocuments()               { return [...documents]; }
function getDocumentsByOwner(ownerId) { return documents.filter(d => d.ownerId === ownerId); }
function getDocumentById(id)          { return documents.find(d => String(d.id) === String(id)); }

function addDocument(doc) {
  doc.id = Date.now();
  documents.push(doc);
  _persistDocuments();
  const owner = getOwnerById(doc.ownerId);
  if (owner) addActivity(
    `Document uploaded for ${owner.name} ${owner.surname} (${doc.fileName})`,
    'bi-file-earmark', 'document'
  );
  return doc;
}

function deleteDocument(id) {
  documents = documents.filter(d => String(d.id) !== String(id));
  _persistDocuments();
}

function deleteDocumentsByVehicle(vehicleId) {
  documents = documents.filter(d => d.vehicleId !== vehicleId);
  _persistDocuments();
}

function deleteDocumentsByDriver(driverId) {
  documents = documents.filter(d => d.driverId !== driverId);
  _persistDocuments();
}
