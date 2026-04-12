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

function register({ username, password, idNumber }) {
  // Verify the ID number belongs to a registered association member
  const owner = owners.find(o => o.idNumber === idNumber.trim());
  if (!owner) {
    return {
      success: false,
      error: 'Your ID number is not registered as a member of this association. Please contact the chairperson to join.',
    };
  }

  // Prevent duplicate accounts for the same owner
  if (MOCK_USERS.find(u => u.ownerId === owner.id)) {
    return { success: false, error: 'An account already exists for this ID number. Please sign in instead.' };
  }

  if (MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase())) {
    return { success: false, error: 'That username is already taken. Please choose another.' };
  }

  const newUser = {
    id:       MOCK_USERS.length + 1,
    username: username.trim(),
    password: password,
    role:     'owner',
    name:     `${owner.name} ${owner.surname}`,
    ownerId:  owner.id,
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
    owner:       ['vehicles', 'payments', 'meetings'],
  };

  return (access[user.role] || []).includes(section);
}
