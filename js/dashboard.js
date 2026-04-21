// ============================================================
// DASHBOARD — Uzimeleni Scholar Transport System
// ============================================================

let _memberChart   = null;
let _paymentsChart = null;

async function renderDashboard() {
  showLoading('dashboard-content');
  await Promise.all([
    refreshOwners(),
    refreshVehicles(),
    refreshDrivers(),
    refreshPayments(),
    refreshMeetings(),
  ]);

  const ownersList  = getOwners();
  const vehicleList = getVehicles();
  const driverList  = getDrivers();
  const flaggedList = getFlags();
  const activities  = getRecentActivities(6);
  const paymentList = getPayments();

  const paidAmt    = paymentList.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingAmt = paymentList.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  document.getElementById('dashboard-content').innerHTML = `
    <!-- Stat cards -->
    <div class="row g-3 mb-4">
      ${statCard('Total Owners',    ownersList.length,  ownersList.filter(o=>o.status==='Active').length + ' Active',  'primary', 'bi-people-fill')}
      ${statCard('Total Vehicles',  vehicleList.length, vehicleList.filter(v=>v.status==='Active').length + ' Active', 'success', 'bi-truck-front-fill')}
      ${statCard('Total Drivers',   driverList.length,  driverList.filter(d=>d.status==='Active').length + ' Active',  'info',    'bi-person-badge-fill')}
      ${statCard('Flagged Members', flaggedList.length, 'Compliance Issues', 'danger', 'bi-flag-fill', flaggedList.length > 0)}
    </div>

    <!-- Charts row -->
    <div class="row g-3 mb-4">
      <div class="col-lg-8">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent fw-semibold py-3">
            <i class="bi bi-bar-chart-fill text-primary me-2"></i>Payment Overview (2026)
          </div>
          <div class="card-body">
            <canvas id="paymentsChart" height="110"></canvas>
          </div>
        </div>
      </div>
      <div class="col-lg-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header bg-transparent fw-semibold py-3">
            <i class="bi bi-pie-chart-fill text-primary me-2"></i>Member Status
          </div>
          <div class="card-body d-flex align-items-center justify-content-center">
            <canvas id="memberChart" style="max-height:200px"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity + Flags -->
    <div class="row g-3">
      <div class="col-lg-7">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-transparent fw-semibold py-3">
            <i class="bi bi-clock-history text-primary me-2"></i>Recent Activities
          </div>
          <ul class="list-group list-group-flush">
            ${activities.length === 0
              ? '<li class="list-group-item text-center text-muted py-4">No recent activity</li>'
              : activities.map(a => `
              <li class="list-group-item d-flex align-items-center py-3 px-3">
                <div class="activity-icon bg-${actColor(a.type)}-subtle text-${actColor(a.type)} rounded-circle me-3 flex-shrink-0">
                  <i class="bi ${a.icon}"></i>
                </div>
                <div class="flex-grow-1 min-w-0">
                  <div class="fw-medium text-truncate">${escapeHtml(a.action)}</div>
                  <div class="text-muted small">${a.timestamp}</div>
                </div>
              </li>`).join('')}
          </ul>
        </div>
      </div>
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-transparent fw-semibold py-3">
            <i class="bi bi-flag-fill text-danger me-2"></i>Flagged Members
          </div>
          ${flaggedList.length === 0
            ? '<p class="text-muted text-center p-4 mb-0"><i class="bi bi-shield-check fs-2 d-block mb-2 text-success"></i>All clear — no issues</p>'
            : `<ul class="list-group list-group-flush">
                ${flaggedList.map(f => `
                  <li class="list-group-item py-3 px-3">
                    <div class="fw-medium">${escapeHtml(f.owner.name)} ${escapeHtml(f.owner.surname)}</div>
                    ${f.reasons.map(r => `<div class="text-danger small"><i class="bi bi-exclamation-triangle-fill me-1"></i>${escapeHtml(r)}</div>`).join('')}
                  </li>`).join('')}
              </ul>`
          }
        </div>

        <!-- Quick Payment Summary -->
        <div class="card border-0 shadow-sm mt-3">
          <div class="card-header bg-transparent fw-semibold py-3">
            <i class="bi bi-cash-coin text-success me-2"></i>Payment Summary
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between mb-2">
              <span class="text-muted small">Collected</span>
              <span class="fw-semibold text-success">${formatCurrency(paidAmt)}</span>
            </div>
            <div class="d-flex justify-content-between mb-3">
              <span class="text-muted small">Outstanding</span>
              <span class="fw-semibold text-danger">${formatCurrency(pendingAmt)}</span>
            </div>
            <div class="progress" style="height:8px">
              <div class="progress-bar bg-success" style="width:${paidAmt + pendingAmt > 0 ? Math.round(paidAmt / (paidAmt + pendingAmt) * 100) : 0}%"></div>
            </div>
            <div class="text-muted small mt-1 text-end">
              ${paidAmt + pendingAmt > 0 ? Math.round(paidAmt / (paidAmt + pendingAmt) * 100) : 0}% collected
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  _initPaymentsChart(paymentList);
  _initMemberChart(ownersList);
}

function statCard(label, value, sub, color, icon, isAlert = false) {
  return `
    <div class="col-xl-3 col-md-6">
      <div class="card stat-card border-0 shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="text-muted small fw-semibold text-uppercase mb-1">${label}</div>
              <div class="fs-2 fw-bold">${value}</div>
              <div class="small ${isAlert ? 'text-danger' : 'text-success'}">${sub}</div>
            </div>
            <div class="stat-icon bg-${color}-subtle text-${color}">
              <i class="bi ${icon} fs-3"></i>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function actColor(type) {
  return {
    owner: 'primary', vehicle: 'success', meeting: 'info',
    payment: 'warning', flag: 'danger', driver: 'secondary',
  }[type] || 'secondary';
}

function _initPaymentsChart(paymentList) {
  const ctx = document.getElementById('paymentsChart');
  if (!ctx) return;
  if (_paymentsChart) _paymentsChart.destroy();

  const months         = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const paidByMonth    = new Array(12).fill(0);
  const pendingByMonth = new Array(12).fill(0);

  paymentList.forEach(p => {
    const m = new Date((p.date || '') + 'T00:00:00').getMonth();
    if (Number.isInteger(m)) {
      if (p.status === 'paid') paidByMonth[m]    += p.amount;
      else                     pendingByMonth[m] += p.amount;
    }
  });

  _paymentsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Paid (R)',    data: paidByMonth,    backgroundColor: 'rgba(25,135,84,0.75)',  borderRadius: 4 },
        { label: 'Pending (R)', data: pendingByMonth, backgroundColor: 'rgba(255,193,7,0.75)',  borderRadius: 4 },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function _initMemberChart(ownersList) {
  const ctx = document.getElementById('memberChart');
  if (!ctx) return;
  if (_memberChart) _memberChart.destroy();

  const active    = ownersList.filter(o => o.status === 'Active').length;
  const suspended = ownersList.filter(o => o.status === 'Suspended').length;

  _memberChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Active', 'Suspended'],
      datasets: [{
        data: [active, suspended],
        backgroundColor: ['rgba(25,135,84,0.8)', 'rgba(220,53,69,0.8)'],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}
