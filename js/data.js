// ============================================================
// MOCK DATA — Uzimeleni Scholar Transport System
// ============================================================

// ---- Public site data ----------------------------------------

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

// ---- End public site data ------------------------------------

const MOCK_USERS = [
  { id: 1, username: 'chairperson', password: 'password123', role: 'chairperson', name: 'John Dlamini' },
  { id: 2, username: 'secretary',   password: 'password123', role: 'secretary',   name: 'Sarah Khumalo' },
  { id: 3, username: 'treasurer',   password: 'password123', role: 'treasurer',   name: 'Mike Nkosi' },
  { id: 4, username: 'owner1',      password: 'password123', role: 'owner',       name: 'Thabo Mokoena', ownerId: 1 },
  { id: 5, username: 'security',    password: 'password123', role: 'security',    name: 'David Sithole' },
];

let owners = [
  { id: 1, name: 'Thabo',   surname: 'Mokoena',  idNumber: '8501015800086', phone: '0821234567', email: 'thabo@example.com',   status: 'Active',    numberOfCars: 2 },
  { id: 2, name: 'Lindiwe', surname: 'Dube',     idNumber: '9002285000087', phone: '0839876543', email: 'lindiwe@example.com', status: 'Active',    numberOfCars: 1 },
  { id: 3, name: 'Sipho',   surname: 'Zulu',     idNumber: '7803124800088', phone: '0711234567', email: 'sipho@example.com',   status: 'Suspended', numberOfCars: 3 },
  { id: 4, name: 'Nomsa',   surname: 'Mthembu',  idNumber: '8812065000089', phone: '0760987654', email: 'nomsa@example.com',   status: 'Active',    numberOfCars: 1 },
  { id: 5, name: 'Bongani', surname: 'Ngcobo',   idNumber: '9105235800090', phone: '0841112222', email: 'bongani@example.com', status: 'Active',    numberOfCars: 2 },
];

let vehicles = [
  { id: 1, registrationNumber: 'GP 123 ABC',  ownerId: 1, carType: 'Toyota Quantum',    status: 'Active'   },
  { id: 2, registrationNumber: 'GP 456 DEF',  ownerId: 1, carType: 'Toyota HiAce',      status: 'Active'   },
  { id: 3, registrationNumber: 'NP 789 GHI',  ownerId: 2, carType: 'Mercedes Sprinter', status: 'Inactive' },
  { id: 4, registrationNumber: 'EC 321 JKL',  ownerId: 3, carType: 'Toyota Quantum',    status: 'Active'   },
  { id: 5, registrationNumber: 'WC 654 MNO',  ownerId: 4, carType: 'Ford Transit',      status: 'Active'   },
  { id: 6, registrationNumber: 'KZN 987 PQR', ownerId: 5, carType: 'Toyota HiAce',      status: 'Active'   },
];

let drivers = [
  { id: 1, name: 'Mandla',   surname: 'Buthelezi', idNumber: '8806125800091', phone: '0823334444', status: 'Active'    },
  { id: 2, name: 'Zanele',   surname: 'Khumalo',   idNumber: '9204285000092', phone: '0795556666', status: 'Active'    },
  { id: 3, name: 'Siyanda',  surname: 'Cele',      idNumber: '8512074800093', phone: '0717778888', status: 'Suspended' },
  { id: 4, name: 'Thandeka', surname: 'Mhlongo',   idNumber: '9308115000094', phone: '0849990000', status: 'Active'    },
  { id: 5, name: 'Lungelo',  surname: 'Shabalala', idNumber: '9001235800095', phone: '0821111222', status: 'Active'    },
];

// Always 90 minutes ago — meeting is open and in "late" mode for demo
const _openMeetingDate  = new Date().toISOString().split('T')[0];
const _openMeetingStart = (() => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - 90);
  return d.toTimeString().slice(0, 5);
})();

let meetings = [
  {
    id: 1, title: 'Monthly General Meeting — January', date: '2026-01-15', startTime: '09:00',
    notes: 'Discussed new route allocations and payment structure for the new year.',
    attendance: [
      { ownerId: 1, status: 'present' }, { ownerId: 2, status: 'present' },
      { ownerId: 3, status: 'absent'  }, { ownerId: 4, status: 'late'    }, { ownerId: 5, status: 'present' },
    ],
    minutes: `MINUTES OF MONTHLY GENERAL MEETING
Date: 15 January 2026 | Start: 09:00 | Venue: Uzimeleni Community Hall

APOLOGIES: Sipho Zulu

1. OPENING
   Meeting opened at 09:05 by Chairperson John Dlamini. A quorum was confirmed.

2. MATTERS DISCUSSED
   2.1 New route allocations for the 2026 school year were tabled and discussed.
   2.2 The revised monthly fee structure was presented by Treasurer Mike Nkosi.
   2.3 Members agreed on a fee of R500/month effective 1 February 2026.
   2.4 Nomsa Mthembu raised concerns about overlapping routes in the D-Section area.

3. DECISIONS MADE
   - Route 7 (Umlazi D-Section) to be reassigned to Thabo Mokoena from 1 February.
   - Payment deadline set to the 20th of each month.
   - Any member with two consecutive unpaid months will be suspended pending review.

4. ACTION ITEMS
   - Secretary to circulate updated route map by 22 January. (Sarah Khumalo)
   - Treasurer to issue payment invoices by 31 January. (Mike Nkosi)
   - Chairperson to confirm new route allocation with the municipality. (John Dlamini)

5. CLOSURE
   No further business. Meeting closed at 10:50.
   Next meeting: 19 February 2026 at 09:00.`,
  },
  {
    id: 2, title: 'Monthly General Meeting — February', date: '2026-02-19', startTime: '09:00',
    notes: 'Vehicle inspection requirements discussed. New compliance checklist introduced.',
    attendance: [
      { ownerId: 1, status: 'present' }, { ownerId: 2, status: 'absent'  },
      { ownerId: 3, status: 'absent'  }, { ownerId: 4, status: 'present' }, { ownerId: 5, status: 'late' },
    ],
    minutes: `MINUTES OF MONTHLY GENERAL MEETING
Date: 19 February 2026 | Start: 09:00 | Venue: Uzimeleni Community Hall

APOLOGIES: Lindiwe Dube, Sipho Zulu

1. OPENING
   Meeting opened at 09:02 by Chairperson John Dlamini.

2. MATTERS DISCUSSED
   2.1 Safety Officer David Sithole presented the new vehicle compliance checklist.
   2.2 All operators must submit a valid roadworthy certificate by 28 February 2026.
   2.3 Members were reminded that vehicles without valid certification will be grounded.
   2.4 Bongani Ngcobo arrived at 09:38 — marked late.

3. DECISIONS MADE
   - New compliance checklist adopted with immediate effect.
   - Vehicles failing inspection to be removed from routes until cleared.
   - A compliance inspection day scheduled for 27 February at the community hall.

4. ACTION ITEMS
   - Safety Officer to distribute compliance checklist to all members. (David Sithole)
   - Secretary to send written notice to absent members. (Sarah Khumalo)

5. CLOSURE
   Meeting closed at 11:10.
   Next meeting: 5 March 2026 (Emergency — Vehicle Compliance) at 10:00.`,
  },
  {
    id: 3, title: 'Emergency Meeting — Vehicle Compliance', date: '2026-03-05', startTime: '10:00',
    notes: 'Urgent meeting regarding vehicles failing roadworthy tests. Three vehicles flagged for re-inspection.',
    attendance: [
      { ownerId: 1, status: 'present' }, { ownerId: 2, status: 'present' },
      { ownerId: 3, status: 'absent'  }, { ownerId: 4, status: 'absent'  }, { ownerId: 5, status: 'present' },
    ],
    minutes: `MINUTES OF EMERGENCY MEETING — VEHICLE COMPLIANCE
Date: 5 March 2026 | Start: 10:00 | Venue: Uzimeleni Community Hall

APOLOGIES: Sipho Zulu, Nomsa Mthembu

1. OPENING
   Emergency meeting called by Chairperson John Dlamini following inspection failures.
   Meeting opened at 10:05.

2. BACKGROUND
   Three vehicles failed the municipal roadworthy inspection conducted on 3 March 2026:
   - NP 789 GHI (Owner: Lindiwe Dube) — brake system failure
   - EC 321 JKL (Owner: Sipho Zulu) — tyre tread below legal limit
   - WC 654 MNO (Owner: Nomsa Mthembu) — rear lighting fault

3. MATTERS DISCUSSED
   3.1 Safety Officer presented the inspection reports for each failed vehicle.
   3.2 The Chairperson emphasised that learner safety cannot be compromised.
   3.3 Members discussed a temporary route-cover arrangement while vehicles are repaired.

4. DECISIONS MADE
   - All three flagged vehicles suspended from routes with immediate effect.
   - Owners have 14 days to obtain clearance certificates or face membership review.
   - Thabo Mokoena and Bongani Ngcobo to cover affected routes temporarily.

4. ACTION ITEMS
   - Affected owners to submit repair evidence to Secretary by 19 March. (Lindiwe Dube, Nomsa Mthembu)
   - Secretary to notify affected schools of temporary driver changes. (Sarah Khumalo)

5. CLOSURE
   Meeting closed at 11:40.
   Next scheduled meeting: 19 March 2026 at 09:00.`,
  },
  {
    id: 4, title: 'Monthly General Meeting — March', date: '2026-03-19', startTime: '09:00',
    notes: 'Year review and payment updates. Impact of school calendar on routes discussed.',
    attendance: [
      { ownerId: 1, status: 'present' }, { ownerId: 2, status: 'late'    },
      { ownerId: 3, status: 'absent'  }, { ownerId: 4, status: 'present' }, { ownerId: 5, status: 'present' },
    ],
    minutes: `MINUTES OF MONTHLY GENERAL MEETING
Date: 19 March 2026 | Start: 09:00 | Venue: Uzimeleni Community Hall

APOLOGIES: Sipho Zulu

1. OPENING
   Meeting opened at 09:03 by Chairperson John Dlamini. Lindiwe Dube arrived at 09:41 — marked late.

2. MATTERS DISCUSSED
   2.1 Treasurer presented the Q1 2026 financial summary. Total collected: R6 000.
   2.2 Three members have outstanding payments totalling R1 500.
   2.3 The impact of school term dates on route scheduling was discussed.
   2.4 Update on compliance: Lindiwe Dube submitted clearance — vehicle NP 789 GHI reinstated.
   2.5 Nomsa Mthembu's vehicle WC 654 MNO still under repair — extension granted until 31 March.
   2.6 Sipho Zulu's vehicle EC 321 JKL — no update received. Referred for membership review.

3. DECISIONS MADE
   - Members with outstanding payments as of 1 April will receive a formal warning letter.
   - School holiday route schedule to be published by 25 March.
   - Sipho Zulu's membership to be reviewed at the April meeting pending no response.

4. ACTION ITEMS
   - Treasurer to issue warning letters to members in arrears. (Mike Nkosi)
   - Secretary to publish school holiday route schedule. (Sarah Khumalo)
   - Chairperson to contact Sipho Zulu formally. (John Dlamini)

5. CLOSURE
   Meeting closed at 11:25.
   Next meeting: 11 April 2026 at 09:00.`,
  },
  {
    id: 5, title: 'Monthly General Meeting — April', date: '2026-04-11', startTime: '09:00',
    notes: 'April general meeting. Route updates and upcoming school term discussed.',
    attendance: [
      { ownerId: 1, status: 'absent' }, { ownerId: 2, status: 'absent' },
      { ownerId: 3, status: 'absent' }, { ownerId: 4, status: 'absent' }, { ownerId: 5, status: 'absent' },
    ],
    minutes: '',
  },
  {
    id: 6, title: 'Special Compliance Meeting', date: _openMeetingDate, startTime: _openMeetingStart,
    notes: 'Urgent review of outstanding compliance issues and member suspensions.',
    attendance: [
      { ownerId: 1, status: 'absent' }, { ownerId: 2, status: 'absent' },
      { ownerId: 3, status: 'absent' }, { ownerId: 4, status: 'absent' }, { ownerId: 5, status: 'absent' },
    ],
    minutes: '',
  },
];

let payments = [
  { id:  1, ownerId: 1, amount: 500, description: 'Association Fee — January',  status: 'paid',    date: '2026-01-20' },
  { id:  2, ownerId: 1, amount: 500, description: 'Association Fee — February', status: 'paid',    date: '2026-02-20' },
  { id:  3, ownerId: 1, amount: 500, description: 'Association Fee — March',    status: 'paid',    date: '2026-03-20' },
  { id:  4, ownerId: 2, amount: 500, description: 'Association Fee — January',  status: 'paid',    date: '2026-01-22' },
  { id:  5, ownerId: 2, amount: 500, description: 'Association Fee — February', status: 'pending', date: '2026-02-22' },
  { id:  6, ownerId: 2, amount: 500, description: 'Association Fee — March',    status: 'pending', date: '2026-03-22' },
  { id:  7, ownerId: 3, amount: 500, description: 'Association Fee — January',  status: 'pending', date: '2026-01-18' },
  { id:  8, ownerId: 3, amount: 500, description: 'Association Fee — February', status: 'pending', date: '2026-02-18' },
  { id:  9, ownerId: 3, amount: 500, description: 'Association Fee — March',    status: 'pending', date: '2026-03-18' },
  { id: 10, ownerId: 4, amount: 500, description: 'Association Fee — January',  status: 'paid',    date: '2026-01-25' },
  { id: 11, ownerId: 4, amount: 500, description: 'Association Fee — February', status: 'paid',    date: '2026-02-25' },
  { id: 12, ownerId: 4, amount: 500, description: 'Association Fee — March',    status: 'pending', date: '2026-03-25' },
  { id: 13, ownerId: 5, amount: 500, description: 'Association Fee — January',  status: 'paid',    date: '2026-01-21' },
  { id: 14, ownerId: 5, amount: 500, description: 'Association Fee — February', status: 'paid',    date: '2026-02-21' },
  { id: 15, ownerId: 5, amount: 500, description: 'Association Fee — March',    status: 'paid',    date: '2026-03-21' },
];

let activityLog = [
  { id: 1, action: 'Owner Thabo Mokoena registered',                     timestamp: '2026-03-20 10:30', icon: 'bi-person-plus',    type: 'owner'   },
  { id: 2, action: 'Vehicle GP 123 ABC added to fleet',                  timestamp: '2026-03-19 14:20', icon: 'bi-truck',          type: 'vehicle' },
  { id: 3, action: 'Meeting: Monthly General Meeting — March scheduled', timestamp: '2026-03-15 09:00', icon: 'bi-calendar-event', type: 'meeting' },
  { id: 4, action: 'Payment received from Thabo Mokoena (R500)',         timestamp: '2026-03-20 11:45', icon: 'bi-cash',           type: 'payment' },
  { id: 5, action: 'Sipho Zulu flagged for missing meetings',            timestamp: '2026-03-21 08:30', icon: 'bi-flag',           type: 'flag'    },
  { id: 6, action: 'Driver Mandla Buthelezi added',                      timestamp: '2026-03-22 12:00', icon: 'bi-person-badge',   type: 'driver'  },
];

let nextOwnerId   = 6;
let nextVehicleId = 7;
let nextDriverId  = 6;
let nextMeetingId = 7;
let nextPaymentId = 16;

// ============================================================
// DATA ACCESS FUNCTIONS
// ============================================================

function getOwners()          { return [...owners]; }
function getOwnerById(id)     { return owners.find(o => o.id === id); }

function addOwner(owner) {
  owner.id = nextOwnerId++;
  owners.push(owner);
  addActivity(`Owner ${owner.name} ${owner.surname} registered`, 'bi-person-plus', 'owner');
  return owner;
}

function updateOwner(id, data) {
  const idx = owners.findIndex(o => o.id === id);
  if (idx !== -1) owners[idx] = { ...owners[idx], ...data };
  return owners[idx];
}

function deleteOwner(id) {
  owners = owners.filter(o => o.id !== id);
}

// ---

function getVehicles()        { return [...vehicles]; }
function getVehicleById(id)   { return vehicles.find(v => v.id === id); }

function addVehicle(vehicle) {
  vehicle.id = nextVehicleId++;
  vehicles.push(vehicle);
  addActivity(`Vehicle ${vehicle.registrationNumber} added to fleet`, 'bi-truck', 'vehicle');
  return vehicle;
}

function updateVehicle(id, data) {
  const idx = vehicles.findIndex(v => v.id === id);
  if (idx !== -1) vehicles[idx] = { ...vehicles[idx], ...data };
  return vehicles[idx];
}

function deleteVehicle(id) {
  vehicles = vehicles.filter(v => v.id !== id);
}

// ---

function getDrivers()         { return [...drivers]; }
function getDriverById(id)    { return drivers.find(d => d.id === id); }

function addDriver(driver) {
  driver.id = nextDriverId++;
  drivers.push(driver);
  addActivity(`Driver ${driver.name} ${driver.surname} added`, 'bi-person-badge', 'driver');
  return driver;
}

function updateDriver(id, data) {
  const idx = drivers.findIndex(d => d.id === id);
  if (idx !== -1) drivers[idx] = { ...drivers[idx], ...data };
  return drivers[idx];
}

function deleteDriver(id) {
  drivers = drivers.filter(d => d.id !== id);
}

// ---

function getMeetings()        { return [...meetings]; }
function getMeetingById(id)   { return meetings.find(m => m.id === id); }

function addMeeting(meeting) {
  meeting.id = nextMeetingId++;
  if (!meeting.attendance) {
    meeting.attendance = owners.map(o => ({ ownerId: o.id, status: 'absent' }));
  }
  meetings.push(meeting);
  addActivity(`Meeting: ${meeting.title} scheduled`, 'bi-calendar-event', 'meeting');
  return meeting;
}

function updateMeeting(id, data) {
  const idx = meetings.findIndex(m => m.id === id);
  if (idx !== -1) meetings[idx] = { ...meetings[idx], ...data };
  return meetings[idx];
}

function deleteMeeting(id) {
  meetings = meetings.filter(m => m.id !== id);
}

function updateAttendance(meetingId, ownerId, status) {
  const meeting = meetings.find(m => m.id === meetingId);
  if (!meeting) return;
  const att = meeting.attendance.find(a => a.ownerId === ownerId);
  if (att) { att.status = status; }
  else { meeting.attendance.push({ ownerId, status }); }
}

// ---

function getPayments()              { return [...payments]; }
function getPaymentsByOwner(ownerId){ return payments.filter(p => p.ownerId === ownerId); }

function addPayment(payment) {
  payment.id = nextPaymentId++;
  payments.push(payment);
  const owner = getOwnerById(payment.ownerId);
  if (owner) addActivity(`Payment received from ${owner.name} ${owner.surname} (R${payment.amount})`, 'bi-cash', 'payment');
  return payment;
}

function markPaymentPaid(id) {
  const idx = payments.findIndex(p => p.id === id);
  if (idx !== -1) {
    payments[idx].status = 'paid';
    payments[idx].date = new Date().toISOString().split('T')[0];
  }
  return payments[idx];
}

// ---

function getFlags() {
  const flagged = [];
  owners.forEach(owner => {
    const reasons = [];

    // Rule 1: Missing 3+ meetings
    let absentCount = 0;
    meetings.forEach(m => {
      const att = m.attendance.find(a => a.ownerId === owner.id);
      if (!att || att.status === 'absent') absentCount++;
    });
    if (absentCount >= 3) {
      reasons.push(`Absent from ${absentCount} meeting(s)`);
    }

    // Rule 2: Unpaid payments
    const unpaid = payments.filter(p => p.ownerId === owner.id && p.status === 'pending');
    if (unpaid.length > 0) {
      const total = unpaid.reduce((s, p) => s + p.amount, 0);
      reasons.push(`${unpaid.length} unpaid payment(s) — R${total} outstanding`);
    }

    if (reasons.length > 0) {
      flagged.push({ owner, reasons });
    }
  });
  return flagged;
}

// ---

function addActivity(action, icon, type) {
  const now = new Date();
  const timestamp = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
  activityLog.unshift({ id: Date.now(), action, timestamp, icon, type });
  if (activityLog.length > 20) activityLog.pop();
}

function getRecentActivities(limit = 6) {
  return activityLog.slice(0, limit);
}
