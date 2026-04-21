// ============================================================
// MEETINGS — Uzimeleni Scholar Transport System
// ============================================================

let _editMeetingId       = null;
let _attendanceMeetingId = null;
let _minutesMeetingId    = null;

// ---- Time helpers -----------------------------------------------

function _isAttendanceLocked(m) {
  if (!m.startTime) return false;
  const start = new Date(m.date + 'T' + m.startTime);
  return (Date.now() - start.getTime()) > 5 * 60 * 60 * 1000;
}

function _isLateArrival(m) {
  if (!m.startTime) return false;
  const start = new Date(m.date + 'T' + m.startTime);
  return (Date.now() - start.getTime()) > 30 * 60 * 1000;
}

function _hasMeetingStarted(m) {
  if (!m.startTime) return true;
  const start = new Date(m.date + 'T' + m.startTime);
  return Date.now() >= start.getTime();
}

function _elapsedLabel(m) {
  if (!m.startTime) return '';
  const start = new Date(m.date + 'T' + m.startTime);
  const diff  = Date.now() - start.getTime();
  if (diff < 0) {
    const mins = Math.floor(-diff / 60000);
    return mins < 60
      ? `Starts in ${mins}m`
      : `Starts in ${Math.floor(mins / 60)}h ${mins % 60}m`;
  }
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const rem   = mins % 60;
  return hours > 0 ? `${hours}h ${rem}m elapsed` : `${mins}m elapsed`;
}

// ---- Render sections --------------------------------------------

async function renderMeetings() {
  showLoading('meetings-content');
  await Promise.all([refreshMeetings(), refreshOwners()]);

  const canManage = hasRole('chairperson', 'secretary');

  document.getElementById('meetings-content').innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h5 class="mb-0 fw-semibold">Meetings</h5>
      ${canManage ? `<button class="btn btn-primary" onclick="openAddMeetingModal()">
        <i class="bi bi-plus-lg me-1"></i>Schedule Meeting</button>` : ''}
    </div>
    <div id="meetings-list"></div>
  `;

  renderMeetingsList();
}

function renderMeetingsList() {
  const canManage = hasRole('chairperson', 'secretary');
  const list      = getMeetings().sort((a, b) => new Date(b.date) - new Date(a.date));
  const container = document.getElementById('meetings-list');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `<div class="card border-0 shadow-sm"><div class="card-body text-center py-5 text-muted">
      <i class="bi bi-calendar-x fs-2 d-block mb-2"></i>No meetings scheduled</div></div>`;
    return;
  }

  container.innerHTML = list.map(m => {
    const presentCount = (m.attendees || []).length;
    const absentCount  = (m.absentees || []).length;
    const isPast       = new Date(m.date) < new Date();
    const locked       = _isAttendanceLocked(m);

    return `
      <div class="card border-0 shadow-sm mb-3">
        <div class="card-body">
          <div class="d-flex flex-column flex-md-row justify-content-between gap-3">
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                <h6 class="mb-0 fw-semibold">${escapeHtml(m.title)}</h6>
                ${isPast
                  ? '<span class="badge bg-secondary-subtle text-secondary border">Past</span>'
                  : '<span class="badge bg-success-subtle text-success border">Upcoming</span>'}
                ${locked ? '<span class="badge bg-dark-subtle text-secondary border"><i class="bi bi-lock-fill me-1"></i>Closed</span>' : ''}
                ${m.minutes ? '<span class="badge bg-primary-subtle text-primary border"><i class="bi bi-file-text me-1"></i>Minutes</span>' : ''}
              </div>
              <div class="text-muted small mb-2">
                <i class="bi bi-calendar3 me-1"></i>${formatDate(m.date)}
                ${m.startTime ? `<span class="ms-2"><i class="bi bi-clock me-1"></i>${m.startTime}</span>` : ''}
                ${m.location  ? `<span class="ms-2"><i class="bi bi-geo-alt me-1"></i>${escapeHtml(m.location)}</span>` : ''}
              </div>
              ${m.notes ? `<p class="text-muted small mb-2 fst-italic">${escapeHtml(m.notes)}</p>` : ''}
              <div class="d-flex flex-wrap gap-2">
                <span class="badge bg-success-subtle text-success">
                  <i class="bi bi-check-circle me-1"></i>${presentCount} Present
                </span>
                <span class="badge bg-danger-subtle text-danger">
                  <i class="bi bi-x-circle me-1"></i>${absentCount} Absent
                </span>
              </div>
            </div>
            <div class="d-flex gap-2 flex-shrink-0 align-items-start flex-wrap justify-content-end">
              <button class="btn btn-sm btn-outline-info" onclick="openAttendanceModal('${m.id}')">
                <i class="bi bi-person-check me-1"></i>${canManage && !locked ? 'Attendance' : 'View'}
              </button>
              ${m.minutes
                ? `<button class="btn btn-sm btn-outline-primary" onclick="openMinutesModal('${m.id}')">
                     <i class="bi bi-file-text me-1"></i>Minutes
                   </button>`
                : canManage && !locked
                  ? `<button class="btn btn-sm btn-outline-secondary" onclick="openMinutesModal('${m.id}')">
                       <i class="bi bi-file-text me-1"></i>Add Minutes
                     </button>`
                  : ''}
              ${canManage ? `
                <button class="btn btn-sm btn-outline-primary" title="Edit"
                        onclick="openEditMeetingModal('${m.id}')">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" title="Delete"
                        onclick="deleteMeetingConfirm('${m.id}')">
                  <i class="bi bi-trash"></i>
                </button>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

// ---- Meeting CRUD -----------------------------------------------

function openAddMeetingModal() {
  _editMeetingId = null;
  document.getElementById('meetingModalTitle').textContent = 'Schedule Meeting';
  const form = document.getElementById('meeting-form');
  form.reset();
  form.classList.remove('was-validated');
  document.getElementById('meeting-date').value       = new Date().toISOString().split('T')[0];
  document.getElementById('meeting-start-time').value = new Date().toTimeString().slice(0, 5);
  bootstrap.Modal.getOrCreateInstance(document.getElementById('meetingModal')).show();
}

function openEditMeetingModal(id) {
  _editMeetingId = id;
  const m = getMeetingById(id);
  if (!m) return;

  document.getElementById('meetingModalTitle').textContent = 'Edit Meeting';
  const form = document.getElementById('meeting-form');
  form.classList.remove('was-validated');
  document.getElementById('meeting-title').value      = m.title;
  document.getElementById('meeting-date').value       = m.date;
  document.getElementById('meeting-start-time').value = m.startTime || '';
  document.getElementById('meeting-location').value   = m.location  || '';
  document.getElementById('meeting-notes').value      = m.notes     || '';
  bootstrap.Modal.getOrCreateInstance(document.getElementById('meetingModal')).show();
}

async function saveMeeting() {
  const form = document.getElementById('meeting-form');
  form.classList.add('was-validated');
  if (!form.checkValidity()) return;

  const data = {
    title:     document.getElementById('meeting-title').value.trim(),
    date:      document.getElementById('meeting-date').value,
    startTime: document.getElementById('meeting-start-time').value || null,
    location:  document.getElementById('meeting-location').value.trim(),
    notes:     document.getElementById('meeting-notes').value.trim(),
  };

  const saveBtn = document.querySelector('#meetingModal .btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving…'; }

  try {
    if (_editMeetingId) {
      await updateMeeting(_editMeetingId, data);
      showToast('Meeting updated successfully', 'success');
    } else {
      await addMeeting(data);
      showToast('Meeting scheduled successfully', 'success');
    }
    bootstrap.Modal.getInstance(document.getElementById('meetingModal')).hide();
    renderMeetingsList();
  } catch (err) {
    showToast(err.message || 'Failed to save meeting.', 'danger');
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Save Meeting'; }
  }
}

async function deleteMeetingConfirm(id) {
  const m = getMeetingById(id);
  if (!m) return;
  if (!confirmAction(`Delete meeting "${m.title}"?`)) return;

  try {
    await deleteMeeting(id);
    showToast('Meeting deleted', 'warning');
    renderMeetingsList();
  } catch (err) {
    showToast(err.message || 'Failed to delete meeting.', 'danger');
  }
}

// ---- Attendance modal -------------------------------------------

function openAttendanceModal(meetingId) {
  _attendanceMeetingId = meetingId;
  const m = getMeetingById(meetingId);
  if (!m) return;

  const canManage = hasRole('chairperson', 'secretary');
  const locked    = _isAttendanceLocked(m);
  const started   = _hasMeetingStarted(m);
  const lateMode  = _isLateArrival(m);

  document.getElementById('attendanceModalTitle').textContent = `Attendance — ${m.title}`;

  let html = `
    <div class="d-flex flex-wrap gap-3 pb-3 mb-3 border-bottom small text-muted">
      <span><i class="bi bi-calendar3 me-1"></i>${formatDate(m.date)}</span>
      ${m.startTime ? `
        <span><i class="bi bi-clock me-1"></i>Start: <strong>${m.startTime}</strong></span>
        <span><i class="bi bi-hourglass-split me-1"></i>${_elapsedLabel(m)}</span>` : ''}
    </div>`;

  if (locked) {
    html += `
      <div class="alert alert-secondary d-flex align-items-center gap-2 py-2 mb-4">
        <i class="bi bi-lock-fill fs-5 flex-shrink-0"></i>
        <span>This register is <strong>closed</strong> — more than 5 hours have passed since the meeting started.</span>
      </div>`;
  } else if (canManage && !m.startTime) {
    html += `
      <div class="alert alert-warning py-2 mb-3 small">
        <i class="bi bi-exclamation-triangle me-1"></i>
        No start time recorded. Edit this meeting to add a start time before marking attendance.
      </div>`;
  } else if (canManage && !started) {
    html += `
      <div class="alert alert-info py-2 mb-3 small">
        <i class="bi bi-clock me-1"></i>
        This meeting hasn't started yet — attendance marking will be available once it begins.
      </div>`;
  } else if (canManage) {
    html += `
      <div class="card border-0 bg-light mb-4">
        <div class="card-body p-3">
          <p class="fw-semibold small mb-2">
            <i class="bi bi-search me-1 text-primary"></i>Search &amp; Mark Attendance
            ${lateMode
              ? '<span class="badge bg-warning text-dark ms-2 fw-normal"><i class="bi bi-clock me-1"></i>30+ min past start — will mark as <strong>Late</strong></span>'
              : '<span class="badge bg-success ms-2 fw-normal"><i class="bi bi-check-circle me-1"></i>Will mark as <strong>Present</strong></span>'}
          </p>
          <input type="text" id="att-search" class="form-control form-control-sm"
                 placeholder="Type owner name to search…"
                 oninput="_searchAttendance(this.value)" autocomplete="off">
          <div id="att-search-results" class="mt-2"></div>
        </div>
      </div>`;
  }

  html += `<div id="att-summary">${_renderAttendanceSummary(m)}</div>`;

  document.getElementById('attendance-body').innerHTML = html;

  const saveBtn = document.getElementById('save-attendance-btn');
  if (saveBtn) saveBtn.style.display = 'none';

  bootstrap.Modal.getOrCreateInstance(document.getElementById('attendanceModal')).show();
}

function _renderAttendanceSummary(m) {
  const ownersList     = getOwners();
  const attendeeNums   = new Set((m.attendees || []).map(a => a.idNumber));
  const absenteeNums   = new Set((m.absentees || []).map(a => a.idNumber));

  const present = [], absent = [], unmarked = [];

  ownersList.forEach(o => {
    const label = `${o.name} ${o.surname}`;
    if (attendeeNums.has(o.idNumber))      present.push(label);
    else if (absenteeNums.has(o.idNumber)) absent.push(label);
    else                                   unmarked.push(label);
  });

  // Also show attendees/absentees from the API that aren't in the local owners cache
  (m.attendees || []).forEach(a => {
    if (!ownersList.some(o => o.idNumber === a.idNumber)) present.push(a.name);
  });
  (m.absentees || []).forEach(a => {
    if (!ownersList.some(o => o.idNumber === a.idNumber)) absent.push(a.name);
  });

  const chips = (arr, cls) => arr.length
    ? arr.map(n => `<span class="badge ${cls} border me-1 mb-1 fw-normal">${escapeHtml(n)}</span>`).join('')
    : '<span class="text-muted small fst-italic">None</span>';

  return `
    <div class="d-flex flex-column gap-3">
      <div>
        <div class="small fw-semibold text-success mb-2">
          <i class="bi bi-check-circle me-1"></i>Present (${present.length})
        </div>
        <div>${chips(present, 'bg-success-subtle text-success')}</div>
      </div>
      <div>
        <div class="small fw-semibold text-danger mb-2">
          <i class="bi bi-x-circle me-1"></i>Absent (${absent.length})
        </div>
        <div>${chips(absent, 'bg-danger-subtle text-danger')}</div>
      </div>
      ${unmarked.length ? `
      <div>
        <div class="small fw-semibold text-muted mb-2">
          <i class="bi bi-dash-circle me-1"></i>Not Yet Marked (${unmarked.length})
        </div>
        <div>${chips(unmarked, 'bg-secondary-subtle text-secondary')}</div>
      </div>` : ''}
    </div>`;
}

function _searchAttendance(term) {
  const resultsEl = document.getElementById('att-search-results');
  if (!resultsEl) return;

  const trimmed = term.trim().toLowerCase();
  if (!trimmed) {
    resultsEl.innerHTML = '';
    return;
  }

  const m = getMeetingById(_attendanceMeetingId);
  if (!m) return;

  const matches = getOwners().filter(o =>
    (o.name    || '').toLowerCase().includes(trimmed) ||
    (o.surname || '').toLowerCase().includes(trimmed)
  );

  if (matches.length === 0) {
    resultsEl.innerHTML = '<p class="text-muted small mb-0 py-1">No members found matching that name.</p>';
    return;
  }

  const attendeeNums = new Set((m.attendees || []).map(a => a.idNumber));
  const absenteeNums = new Set((m.absentees || []).map(a => a.idNumber));

  resultsEl.innerHTML = matches.map(o => {
    const isPresent = attendeeNums.has(o.idNumber);
    const isAbsent  = absenteeNums.has(o.idNumber);

    let right = '';
    if (isPresent) {
      right = '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Present</span>';
    } else if (isAbsent) {
      right = '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Absent</span>';
    } else {
      right = `<button class="btn btn-sm btn-primary" onclick="_markOwnerAttended('${o.id}')">
                 <i class="bi bi-check2 me-1"></i>Mark Attended
               </button>`;
    }

    return `
      <div class="d-flex align-items-center justify-content-between rounded border bg-white px-3 py-2 mb-1">
        <span class="fw-medium small">${escapeHtml(o.name)} ${escapeHtml(o.surname)}</span>
        ${right}
      </div>`;
  }).join('');
}

function _markOwnerAttended(ownerId) {
  const m = getMeetingById(_attendanceMeetingId);
  if (!m || _isAttendanceLocked(m)) return;

  const isLate = _isLateArrival(m);
  updateAttendance(_attendanceMeetingId, ownerId, true);

  const owner = getOwnerById(ownerId);
  if (!owner) return;
  const name = `${owner.name} ${owner.surname}`;
  showToast(
    isLate ? `${name} marked Present (late arrival)` : `${name} marked Present`,
    isLate ? 'warning' : 'success'
  );

  const searchInput = document.getElementById('att-search');
  if (searchInput && searchInput.value.trim()) _searchAttendance(searchInput.value);

  const fresh     = getMeetingById(_attendanceMeetingId);
  const summaryEl = document.getElementById('att-summary');
  if (summaryEl && fresh) summaryEl.innerHTML = _renderAttendanceSummary(fresh);
}

// ---- Minutes modal ----------------------------------------------

function openMinutesModal(meetingId) {
  _minutesMeetingId = meetingId;
  const m = getMeetingById(meetingId);
  if (!m) return;

  const canManage = hasRole('chairperson', 'secretary');
  const locked    = _isAttendanceLocked(m);

  document.getElementById('minutesModalTitle').textContent = `Minutes — ${m.title}`;

  const ownersList   = getOwners();
  const attendeeNums = new Set((m.attendees || []).map(a => a.idNumber));
  const present = ownersList.filter(o => attendeeNums.has(o.idNumber));
  const absent  = ownersList.filter(o => !attendeeNums.has(o.idNumber));

  const nameList = (arr) => arr.length
    ? `<div class="d-flex flex-column gap-1">${arr.map(o =>
        `<div class="small">
           <span class="fw-medium">${escapeHtml(o.name)} ${escapeHtml(o.surname)}</span>
           <span class="font-monospace text-muted ms-2" style="font-size:.78rem">${escapeHtml(o.idNumber)}</span>
         </div>`).join('')}</div>`
    : '<span class="fst-italic text-muted small">None recorded</span>';

  const minutesValue = m.minutes || '';
  const placeholder  =
`1. OPENING
   Meeting opened at [time] by [name].

2. MATTERS DISCUSSED
   2.1 ...
   2.2 ...

3. DECISIONS MADE
   - ...

4. ACTION ITEMS
   - [Task] ([Responsible person])

5. CLOSURE
   Meeting closed at [time]. Next meeting: [date].`;

  document.getElementById('minutes-body').innerHTML = `
    <div class="d-flex flex-wrap gap-3 pb-3 mb-4 border-bottom small text-muted">
      <span><i class="bi bi-calendar3 me-1"></i>${formatDate(m.date)}</span>
      ${m.startTime ? `<span><i class="bi bi-clock me-1"></i>Start: ${m.startTime}</span>` : ''}
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <div class="small fw-semibold text-success mb-1">
          <i class="bi bi-check-circle me-1"></i>Members Present / Late
        </div>
        <div class="small">${nameList(present)}</div>
      </div>
      <div class="col-md-6">
        <div class="small fw-semibold text-danger mb-1">
          <i class="bi bi-x-circle me-1"></i>Apologies / Absent
        </div>
        <div class="small">${nameList(absent)}</div>
      </div>
    </div>

    <div class="mb-1">
      <label class="form-label fw-semibold">Minutes</label>
      ${canManage && !locked
        ? `<textarea id="minutes-content" class="form-control font-monospace"
                    style="min-height:320px;font-size:.82rem;line-height:1.6;resize:vertical"
                    placeholder="${escapeHtml(placeholder)}"
            >${escapeHtml(minutesValue)}</textarea>`
        : minutesValue
          ? `${locked ? `<div class="alert alert-secondary d-flex align-items-center gap-2 py-2 mb-2 small">
               <i class="bi bi-lock-fill flex-shrink-0"></i>
               <span>Minutes are <strong>locked</strong> — 5 hours have passed since the meeting started.</span>
             </div>` : ''}
             <div class="border rounded p-3 bg-light font-monospace"
                  style="white-space:pre-wrap;font-size:.82rem;line-height:1.6;min-height:160px"
              >${escapeHtml(minutesValue)}</div>`
          : `${locked ? `<div class="alert alert-secondary d-flex align-items-center gap-2 py-2 mb-2 small">
               <i class="bi bi-lock-fill flex-shrink-0"></i>
               <span>Minutes are <strong>locked</strong> — 5 hours have passed since the meeting started.</span>
             </div>` : ''}
             <div class="border rounded p-3 bg-light text-muted fst-italic small">
               No minutes were recorded for this meeting.
             </div>`
      }
    </div>
  `;

  const saveBtn = document.getElementById('save-minutes-btn');
  if (saveBtn) saveBtn.style.display = canManage && !locked ? '' : 'none';

  bootstrap.Modal.getOrCreateInstance(document.getElementById('minutesModal')).show();
}

async function saveMinutes() {
  const m = getMeetingById(_minutesMeetingId);
  if (!m || _isAttendanceLocked(m)) return;

  const content = document.getElementById('minutes-content').value.trim();

  try {
    await updateMeeting(_minutesMeetingId, { minutes: content });
    showToast('Minutes saved successfully', 'success');
    bootstrap.Modal.getInstance(document.getElementById('minutesModal')).hide();
    renderMeetingsList();
  } catch (err) {
    showToast(err.message || 'Failed to save minutes.', 'danger');
  }
}
