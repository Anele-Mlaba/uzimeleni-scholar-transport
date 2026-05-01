// ============================================================
// PUBLIC SITE — Zimeleni Scholar Transport System
// ============================================================

function initPublicSite() {
  _renderCommittee();
  _bindPublicNav();
  _bindNavbarScroll();
  showPublicSection('home');
}

// ---- Section navigation ---------------------------------------

function showPublicSection(name) {
  ['home', 'about', 'contact'].forEach(s => {
    const el = document.getElementById(`pub-section-${s}`);
    if (el) el.style.display = s === name ? 'block' : 'none';
  });

  // Active nav link
  document.querySelectorAll('.pub-nav-link').forEach(el => {
    el.classList.toggle('active', el.dataset.section === name);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (name === 'home') {
    // Small delay lets the section paint before animating
    setTimeout(_animateCounters, 250);
  }
}

// ---- Navbar binding -------------------------------------------

function _bindPublicNav() {
  document.querySelectorAll('.pub-nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const section = link.dataset.section;
      if (section) showPublicSection(section);

      // Collapse mobile menu
      const collapse = document.getElementById('publicNavCollapse');
      if (collapse) {
        const bsCollapse = bootstrap.Collapse.getInstance(collapse);
        if (bsCollapse) bsCollapse.hide();
      }
    });
  });
}

function _bindNavbarScroll() {
  const nav = document.getElementById('public-navbar');
  if (!nav) return;

  const onScroll = () => {
    if (window.scrollY > 40) {
      nav.classList.add('pub-navbar-scrolled');
    } else {
      nav.classList.remove('pub-navbar-scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on init
}

// ---- Committee grid -------------------------------------------

function _renderCommittee() {
  const grid = document.getElementById('committee-grid');
  if (!grid) return;

  grid.innerHTML = COMMITTEE.map(m => `
    <div class="col-lg-4 col-md-6">
      <div class="card committee-card border-0 shadow-sm text-center h-100">
        <div class="card-body p-4">
          <img src="${m.img}"
               alt="${escapeHtml(m.name)} ${escapeHtml(m.surname)}"
               class="committee-photo rounded-circle mb-3"
               onerror="this.replaceWith(_avatarEl('${m.name}','${m.surname}'))">
          <h6 class="fw-bold mb-1">${escapeHtml(m.name)} ${escapeHtml(m.surname)}</h6>
          <div class="text-primary small fw-semibold mb-2 text-uppercase" style="letter-spacing:.5px">${escapeHtml(m.role)}</div>
          <p class="text-muted small mb-0">${escapeHtml(m.bio)}</p>
        </div>
      </div>
    </div>`).join('');
}

function _avatarEl(name, surname) {
  const initials = (name[0] + surname[0]).toUpperCase();
  const palette  = ['#0d6efd','#198754','#0dcaf0','#fd7e14','#6610f2','#d63384'];
  const bg       = palette[(name.charCodeAt(0) + surname.charCodeAt(0)) % palette.length];
  const div      = document.createElement('div');
  div.className  = 'committee-photo rounded-circle mb-3 d-flex align-items-center justify-content-center mx-auto';
  div.style.cssText = `background:${bg};width:100px;height:100px;font-size:2rem;color:#fff;font-weight:700;flex-shrink:0`;
  div.textContent   = initials;
  return div;
}

// ---- Counter animation ----------------------------------------

function _animateCounters() {
  document.querySelectorAll('.stat-counter[data-target]').forEach(el => {
    if (el._animated) return;
    el._animated = true;

    const target = parseInt(el.dataset.target, 10);
    let current  = 0;
    const step   = Math.max(1, Math.ceil(target / 55));

    const tick = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current.toLocaleString('en-ZA');
      if (current >= target) clearInterval(tick);
    }, 18);
  });
}

// ---- Document download (S3) ----------------------------------

async function downloadDoc(e, name) {
  e.preventDefault();
  showToast(`Preparing "${name}" for download…`, 'info');
  const res = await FilesAPI.getDownloadUrl('org', 'price_list.pdf');
  if (!res.ok || !res.data?.url) {
    showToast(`Could not load "${name}". Please try again later.`, 'danger');
    return;
  }
  window.open(res.data.url, '_blank', 'noopener');
  showToast(`"${name}" download started.`, 'success');
}

// ---- Social media click --------------------------------------

function handleSocialClick(e, platform) {
  e.preventDefault();
  showToast(`Opening ${platform} page…`, 'info');
}
