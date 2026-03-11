// Auth utilities - localStorage based
export type UserRole = 'admin' | 'branch-manager' | 'representative';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  branchId?: string;
}

const USERS_KEY = 'bilquis-users';
const SESSION_KEY = 'bilquis-session';

const DEFAULT_ADMIN: User = {
  id: 'admin-default',
  username: 'وليد',
  password: 'WALEED770976667YAMAN',
  role: 'admin',
  displayName: 'وليد',
};

export function initUsers(): void {
  const users = getUsers();
  if (users.length === 0) {
    localStorage.setItem(USERS_KEY, JSON.stringify([DEFAULT_ADMIN]));
  }
}

export function getUsers(): User[] {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function addUser(user: Omit<User, 'id'>): User {
  const users = getUsers();
  const newUser: User = { ...user, id: crypto.randomUUID() };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUser(id: string, updates: Partial<User>): void {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
  }
}

export function deleteUser(id: string): void {
  const users = getUsers().filter(u => u.id !== id);
  saveUsers(users);
}

export function login(username: string, password: string): User | null {
  initUsers();
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
    return user;
  }
  return null;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): User | null {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    const { userId } = JSON.parse(session);
    const users = getUsers();
    return users.find(u => u.id === userId) || null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

// Manager name stored per user
const MANAGER_NAME_KEY = 'bilquis-manager-name';

export function saveManagerName(userId: string, name: string): void {
  const names = getManagerNames();
  names[userId] = name;
  localStorage.setItem(MANAGER_NAME_KEY, JSON.stringify(names));
}

export function getManagerName(userId: string): string | null {
  const names = getManagerNames();
  return names[userId] || null;
}

function getManagerNames(): Record<string, string> {
  try {
    const data = localStorage.getItem(MANAGER_NAME_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

// Keep legacy signature functions as no-ops for backward compatibility
export function saveManagerSignature(_userId: string, _dataUrl: string): void {}
export function getManagerSignature(_userId: string): string | null { return null; }
export function deleteManagerSignature(_userId: string): void {}
