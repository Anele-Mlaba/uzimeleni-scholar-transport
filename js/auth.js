// ============================================================
// AUTH — Zimeleni Scholar Transport System
// ============================================================

async function login(id_number, password) {
  const result = await AuthAPI.login(id_number, password);
  if (!result.ok) return null;

  const token   = result.data.token;
  const payload = _decodeJwt(token);

  const user = {
    id_number: payload?.sub      || id_number,
    token,
    name:      payload?.name     || id_number,
    role:      payload?.role     || 'owner',
    ownerId:   payload?.owner_id || null,
  };

  localStorage.setItem('ust_user', JSON.stringify(user));
  return user;
}

async function logout() {
  try { await AuthAPI.logout(); } catch (_) { /* ignore */ }
  localStorage.removeItem('ust_user');
  window.location.reload();
}

async function register({ id_number, name, password }) {
  const result = await AuthAPI.register(id_number, name, password);
  if (!result.ok) {
    return {
      success: false,
      error: result.data?.error || 'Registration failed. Please try again.',
    };
  }

  return { success: true, user: { name, id_number } };
}

function getCurrentUser() {
  try {
    const stored = localStorage.getItem('ust_user');
    if (!stored) return null;
    const user = JSON.parse(stored);
    // Always re-derive name/role from the JWT so stale stored values never win
    if (user.token) {
      const payload = _decodeJwt(user.token);
      if (payload) {
        user.id_number = payload.sub      || user.id_number;
        user.name      = payload.name     || user.name;
        user.role      = payload.role     || user.role;
        user.ownerId   = payload.owner_id || user.ownerId || null;
      }
    }
    return user;
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

function hasRole(...roles) {
  const user = getCurrentUser();
  return user && roles.includes(user.role);
}

function canAccess(section) {
  const user = getCurrentUser();
  if (!user) return false;

  const access = {
    chairperson: ['dashboard', 'owners', 'vehicles', 'drivers', 'meetings', 'payments', 'flags', 'documents', 'conduct'],
    secretary:   ['dashboard', 'meetings', 'conduct'],
    treasurer:   ['dashboard', 'payments', 'conduct'],
    security:    ['vehicles', 'flags', 'conduct'],
    owner:       ['vehicles', 'payments', 'meetings', 'flags', 'documents', 'conduct'],
  };

  return (access[user.role] || []).includes(section);
}

// ── JWT helpers ───────────────────────────────────────────────

function _decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}
