// ============================================================
// APP — Uzimeleni Scholar Transport System
// ============================================================

const ALL_SECTIONS = ['dashboard', 'owners', 'vehicles', 'drivers', 'meetings', 'payments', 'flags', 'documents'];

const NAV_ITEMS = [
  { section: 'dashboard', icon: 'bi-grid-fill',          label: 'Dashboard'          },
  { section: 'owners',    icon: 'bi-people-fill',         label: 'Owners'             },
  { section: 'vehicles',  icon: 'bi-truck-front-fill',    label: 'Vehicles'           },
  { section: 'drivers',   icon: 'bi-person-badge-fill',   label: 'Drivers'            },
  { section: 'meetings',  icon: 'bi-calendar-event-fill', label: 'Meetings'           },
  { section: 'payments',  icon: 'bi-cash-coin',           label: 'Payments'           },
  { section: 'flags',     icon: 'bi-flag-fill',           label: 'Flags / Compliance' },
  { section: 'documents', icon: 'bi-folder-fill',         label: 'Documents'          },
];

// ---- Init -----------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  _bindLoginForm();
  _bindSignupForm();
  _bindLogout();
  _bindSidebarToggle();
  _bindPasswordToggle();

  initPublicSite();

  const user = getCurrentUser();
  if (user) {
    _hidePublicSite();
    _showApp(user);
  }
});

// ---- Visibility toggles ---------------------------------

function _hidePublicSite() {
  const pub = document.getElementById('public-site');
  if (pub) pub.style.display = 'none';
  window.scrollTo(0, 0);
}

function showPublicSiteFromApp() {
  const pub = document.getElementById('public-site');
  if (pub) pub.style.display = 'block';
  document.getElementById('app-page').style.display = 'none';
  initPublicSite();
}

function _showApp(user) {
  document.getElementById('app-page').style.display = 'flex';
  _renderNavbar(user);
  _renderSidebar(user);
  const first = ALL_SECTIONS.find(s => canAccess(s));
  navigateTo(first || 'dashboard');
}

// ---- Navbar / Sidebar -----------------------------------

function _renderNavbar(user) {
  document.getElementById('user-display-name').textContent = user.name;
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  document.getElementById('user-display-role').textContent = roleLabel;
}

function _renderSidebar(user) {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = NAV_ITEMS
    .filter(item => canAccess(item.section))
    .map(item => `
      <li>
        <a class="sidebar-link d-flex align-items-center gap-2 py-2 px-3 text-decoration-none"
           href="#" id="nav-${item.section}"
           onclick="navigateTo('${item.section}'); return false;">
          <i class="bi ${item.icon} fs-5 flex-shrink-0"></i>
          <span>${item.label}</span>
        </a>
      </li>`).join('');
}

// ---- SPA router -----------------------------------------

async function navigateTo(section) {
  if (!canAccess(section)) {
    showToast('You do not have access to this section.', 'danger');
    return;
  }

  document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active'));
  const link = document.getElementById(`nav-${section}`);
  if (link) link.classList.add('active');

  const titles = {
    dashboard: 'Dashboard',    owners: 'Owners Management',
    vehicles:  'Vehicles',     drivers: 'Drivers',
    meetings:  'Meetings',     payments: 'Payments',
    flags:     'Flags / Compliance', documents: 'Documents',
  };
  document.getElementById('page-title').textContent = titles[section] || section;

  ALL_SECTIONS.forEach(s => {
    const el = document.getElementById(`section-${s}`);
    if (el) el.style.display = s === section ? 'block' : 'none';
  });

  const renderers = {
    dashboard: renderDashboard,
    owners:    renderOwners,
    vehicles:  renderVehicles,
    drivers:   renderDrivers,
    meetings:  renderMeetings,
    payments:  renderPayments,
    flags:     renderFlags,
    documents: renderDocuments,
  };
  if (renderers[section]) await renderers[section]();

  if (window.innerWidth < 768) {
    document.getElementById('sidebar').classList.remove('show');
    document.getElementById('sidebar-overlay').classList.remove('show');
  }
}

// ---- Event binders --------------------------------------

function _bindLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const id_number = document.getElementById('login-idnumber').value.trim();
    const password  = document.getElementById('login-password').value;
    const errorEl   = document.getElementById('login-error');

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Signing in…';

    const user = await login(id_number, password);

    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Sign In';

    if (user) {
      errorEl.style.display = 'none';
      form.reset();
      const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      if (modal) modal.hide();
      _hidePublicSite();
      _showApp(user);
    } else {
      errorEl.textContent   = 'Invalid ID number or password. Please try again.';
      errorEl.style.display = 'block';
      document.getElementById('login-password').value = '';
    }
  });
}

function _bindSignupForm() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  const pwField  = document.getElementById('signup-password');
  const pw2Field = document.getElementById('signup-confirm');

  function checkMatch() {
    if (!pw2Field.value) { pw2Field.setCustomValidity(''); return; }
    pw2Field.setCustomValidity(
      pwField.value !== pw2Field.value ? 'Passwords do not match.' : ''
    );
  }
  pwField.addEventListener('input',  checkMatch);
  pw2Field.addEventListener('input', checkMatch);

  pwField.addEventListener('input', () => _updateStrength(pwField.value));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    checkMatch();
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;

    const submitBtn = form.querySelector('[type="submit"]') ||
                      document.querySelector('[form="signup-form"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account…';
    }

    const result = await register({
      id_number: document.getElementById('signup-idnumber').value.trim(),
      name:      document.getElementById('signup-name').value.trim(),
      password:  document.getElementById('signup-password').value,
    });

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-person-check me-2"></i>Create Account';
    }

    if (!result.success) {
      document.getElementById('signup-error').textContent   = result.error;
      document.getElementById('signup-error').style.display = 'block';
      return;
    }

    form.reset();
    form.classList.remove('was-validated');
    document.getElementById('signup-error').style.display = 'none';
    _updateStrength('');

    bootstrap.Modal.getInstance(document.getElementById('signupModal')).hide();
    showToast(`Account created! Welcome, ${result.user.name}. Please sign in.`, 'success');

    setTimeout(() => {
      bootstrap.Modal.getOrCreateInstance(document.getElementById('loginModal')).show();
    }, 400);
  });
}

function _updateStrength(pw) {
  const bar   = document.getElementById('strength-bar');
  const label = document.getElementById('strength-label');
  if (!bar || !label) return;

  let score = 0;
  if (pw.length >= 8)            score++;
  if (/[A-Z]/.test(pw))         score++;
  if (/[0-9]/.test(pw))         score++;
  if (/[^A-Za-z0-9]/.test(pw))  score++;

  const levels = [
    { pct: 0,   cls: '',           text: ''       },
    { pct: 25,  cls: 'bg-danger',  text: 'Weak'   },
    { pct: 50,  cls: 'bg-warning', text: 'Fair'   },
    { pct: 75,  cls: 'bg-info',    text: 'Good'   },
    { pct: 100, cls: 'bg-success', text: 'Strong' },
  ];

  const lvl = levels[score];
  bar.style.width   = lvl.pct + '%';
  bar.className     = `progress-bar ${lvl.cls}`;
  label.textContent = lvl.text;
  label.className   = `small ${score >= 3 ? 'text-success' : score >= 2 ? 'text-warning' : 'text-danger'}`;
}

function _bindLogout() {
  const btn = document.getElementById('logout-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
    }
  });
}

function _bindSidebarToggle() {
  const toggle  = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');

  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('show');
      overlay.classList.toggle('show');
    });
  }
  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('show');
      overlay.classList.remove('show');
    });
  }
}

function _bindPasswordToggle() {
  const btn   = document.getElementById('toggle-password');
  const input = document.getElementById('login-password');
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const isText = input.type === 'text';
    input.type   = isText ? 'password' : 'text';
    btn.querySelector('i').className = isText ? 'bi bi-eye' : 'bi bi-eye-slash';
  });
}
