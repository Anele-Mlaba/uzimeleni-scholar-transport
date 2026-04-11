// ============================================================
// AUTH — Uzimeleni Scholar Transport System
// ============================================================

function login(username, password) {
  const user = MOCK_USERS.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem('ust_user', JSON.stringify(user));
    return user;
  }
  return null;
}

function logout() {
  localStorage.removeItem('ust_user');
  window.location.reload();
}

function register({ username, password }) {
  if (MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: 'That username is already taken. Please choose another.' };
  }

  const newUser = {
    id:       MOCK_USERS.length + 1,
    username: username.trim(),
    password: password,
    role:     'owner',
    name:     username.trim(),
    ownerId:  null,
  };

  MOCK_USERS.push(newUser);
  return { success: true, user: newUser };
}

function getCurrentUser() {
  const stored = localStorage.getItem('ust_user');
  return stored ? JSON.parse(stored) : null;
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
    chairperson: ['dashboard', 'owners', 'vehicles', 'drivers', 'meetings', 'payments', 'flags'],
    secretary:   ['dashboard', 'meetings'],
    treasurer:   ['dashboard', 'payments'],
    security:    ['vehicles', 'flags'],
    owner:       ['vehicles', 'payments', 'meetings'], // owners do NOT see the dashboard
  };

  return (access[user.role] || []).includes(section);
}
