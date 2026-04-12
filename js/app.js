// ============================================================
// APP — Uzimeleni Scholar Transport System
// ============================================================

const ALL_SECTIONS = ['dashboard', 'owners', 'vehicles', 'drivers', 'meetings', 'payments', 'flags'];

const NAV_ITEMS = [
  { section: 'dashboard', icon: 'bi-grid-fill',          label: 'Dashboard'          },
  { section: 'owners',    icon: 'bi-people-fill',         label: 'Owners'             },
  { section: 'vehicles',  icon: 'bi-truck-front-fill',    label: 'Vehicles'           },
  { section: 'drivers',   icon: 'bi-person-badge-fill',   label: 'Drivers'            },
  { section: 'meetings',  icon: 'bi-calendar-event-fill', label: 'Meetings'           },
  { section: 'payments',  icon: 'bi-cash-coin',           label: 'Payments'           },
  { section: 'flags',     icon: 'bi-flag-fill',           label: 'Flags / Compliance' },
];

// ---- Init -----------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
  _bindLoginForm();
  _bindSignupForm();
  _bindLogout();
  _bindSidebarToggle();
  _bindPasswordToggle();

  // Always boot the public site (counters, nav, committee, contact form)
  initPublicSite();

  const user = getCurrentUser();
  if (user) {
    // Returning session — go straight to app
    _hidePublicSite();
    _showApp(user);
  }
  // Otherwise public site is already visible (default)
});

// ---- Visibility toggles ---------------------------------

function _hidePublicSite() {
  const pub = document.getElementById('public-site');
  if (pub) pub.style.display = 'none';
  // Remove scroll listener side-effects
  window.scrollTo(0, 0);
}

function showPublicSiteFromApp() {
  const pub = document.getElementById('public-site');
  if (pub) pub.style.display = 'block';
  document.getElementById('app-page').style.display = 'none';
  initPublicSite(); // re-init so counters animate again
}

function _showApp(user) {
  document.getElementById('app-page').style.display = 'flex';
  _renderNavbar(user);
  _renderSidebar(user);
  // Navigate to first section the user can actually access
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
    flags:     'Flags / Compliance',
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

  form.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl  = document.getElementById('login-error');

    const user = login(username, password);
    if (user) {
      errorEl.style.display = 'none';
      form.reset();

      // Close modal if open
      const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      if (modal) modal.hide();

      _hidePublicSite();
      _showApp(user);
    } else {
      errorEl.textContent   = 'Invalid username or password. Please try again.';
      errorEl.style.display = 'block';
      document.getElementById('login-password').value = '';
    }
  });
}

function _bindSignupForm() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  // Live password-match feedback
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

  // Live strength meter
  pwField.addEventListener('input', () => _updateStrength(pwField.value));

  // Submit
  form.addEventListener('submit', e => {
    e.preventDefault();
    checkMatch();
    form.classList.add('was-validated');
    if (!form.checkValidity()) return;

    const result = register({
      idNumber: document.getElementById('signup-idnumber').value,
      username: document.getElementById('signup-username').value,
      password: document.getElementById('signup-password').value,
    });

    if (!result.success) {
      document.getElementById('signup-error').textContent   = result.error;
      document.getElementById('signup-error').style.display = 'block';
      return;
    }

    // Success — reset, close, switch to login modal
    form.reset();
    form.classList.remove('was-validated');
    document.getElementById('signup-error').style.display = 'none';
    _updateStrength('');

    bootstrap.Modal.getInstance(document.getElementById('signupModal')).hide();
    showToast(`Account created! Welcome, ${result.user.name}. Please sign in.`, 'success');

    // Auto-open login modal after a beat
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
    { pct: 0,   cls: '',        text: ''          },
    { pct: 25,  cls: 'bg-danger',  text: 'Weak'   },
    { pct: 50,  cls: 'bg-warning', text: 'Fair'   },
    { pct: 75,  cls: 'bg-info',    text: 'Good'   },
    { pct: 100, cls: 'bg-success', text: 'Strong' },
  ];

  const lvl = levels[score];
  bar.style.width        = lvl.pct + '%';
  bar.className          = `progress-bar ${lvl.cls}`;
  label.textContent      = lvl.text;
  label.className        = `small ${score >= 3 ? 'text-success' : score >= 2 ? 'text-warning' : 'text-danger'}`;
}

function _bindLogout() {
  const btn = document.getElementById('logout-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();           // clears localStorage + reloads page
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
