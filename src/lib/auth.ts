export interface ApiKey {
  id: string;
  description: string;
  key: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  role?: string;
  apiKeys?: ApiKey[];
  preferences?: {
    notifyEmail?: boolean;
    notifyWorkflow?: boolean;
    notifyDigest?: boolean;
    notifyMarketing?: boolean;
    privacySharing?: boolean;
    privacyAnalytics?: boolean;
    accountVisibility?: 'public' | 'private';
    language?: string;
    timezone?: string;
    twoFactor?: boolean;
    theme?: 'light' | 'dark' | 'system';
  };
  createdAt: string;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const USERS_KEY = 'planet_users';
const PASSWORDS_KEY = 'planet_passwords';
const SESSION_KEY = 'planet_session';
const WORKFLOWS_KEY = 'planet_workflows';

function getUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users: User[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function refreshSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function signIn(email: string, password: string): User | null {
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  const passwords: Record<string, string> = JSON.parse(
    localStorage.getItem(PASSWORDS_KEY) || '{}'
  );
  if (passwords[user.email] !== password) return null;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function createAccount(
  name: string,
  email: string,
  password: string,
  extra?: { phone?: string; organization?: string; role?: string; apiKeys?: ApiKey[] }
): User | 'exists' {
  const users = getUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) return 'exists';
  const user: User = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    phone: extra?.phone || undefined,
    organization: extra?.organization || undefined,
    role: extra?.role || undefined,
    apiKeys: extra?.apiKeys ?? [],
    preferences: {
      notifyEmail: true,
      notifyWorkflow: true,
      notifyDigest: false,
      notifyMarketing: false,
      privacySharing: false,
      privacyAnalytics: false,
      accountVisibility: 'private',
      language: 'English',
      timezone: '',
      twoFactor: false,
      theme: 'system',
    },
    createdAt: new Date().toISOString(),
  };
  const passwords: Record<string, string> = JSON.parse(
    localStorage.getItem(PASSWORDS_KEY) || '{}'
  );
  passwords[user.email] = password;
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  users.push(user);
  saveUsers(users);
  refreshSession(user);
  return user;
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function resetPassword(email: string, newPassword: string): boolean {
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return false;
  const passwords: Record<string, string> = JSON.parse(
    localStorage.getItem(PASSWORDS_KEY) || '{}'
  );
  passwords[user.email] = newPassword;
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  return true;
}

export function changePassword(email: string, currentPassword: string, newPassword: string): boolean {
  const users = getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return false;
  const passwords: Record<string, string> = JSON.parse(
    localStorage.getItem(PASSWORDS_KEY) || '{}'
  );
  if (passwords[user.email] !== currentPassword) return false;
  passwords[user.email] = newPassword;
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  return true;
}

export function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>
): User | null {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  saveUsers(users);
  const session = getCurrentUser();
  if (session?.id === userId) refreshSession(users[idx]);
  return users[idx];
}

export function addApiKey(userId: string, description: string, key: string): User | null {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  const newKey: ApiKey = {
    id: crypto.randomUUID(),
    description,
    key,
    createdAt: new Date().toISOString(),
  };
  users[idx].apiKeys = [...(users[idx].apiKeys ?? []), newKey];
  saveUsers(users);
  const session = getCurrentUser();
  if (session?.id === userId) refreshSession(users[idx]);
  return users[idx];
}

export function removeApiKey(userId: string, keyId: string): User | null {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;
  users[idx].apiKeys = (users[idx].apiKeys ?? []).filter((k) => k.id !== keyId);
  saveUsers(users);
  const session = getCurrentUser();
  if (session?.id === userId) refreshSession(users[idx]);
  return users[idx];
}

export function getUserWorkflows(userId: string): Workflow[] {
  try {
    const all: Workflow[] = JSON.parse(localStorage.getItem(WORKFLOWS_KEY) || '[]');
    return all
      .filter((w) => w.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch {
    return [];
  }
}

export function createWorkflow(userId: string, name: string): Workflow {
  const workflow: Workflow = {
    id: crypto.randomUUID(),
    userId,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const all: Workflow[] = JSON.parse(localStorage.getItem(WORKFLOWS_KEY) || '[]');
  all.push(workflow);
  localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(all));
  return workflow;
}

// ─── Trash / soft-delete ──────────────────────────────────────────────────────

const TRASH_KEY = 'planet_trash';

export interface DeletedWorkflow extends Workflow {
  deletedAt: string;
}

function getTrash(): DeletedWorkflow[] {
  try {
    return JSON.parse(localStorage.getItem(TRASH_KEY) || '[]');
  } catch {
    return [];
  }
}

export function softDeleteWorkflow(workflowId: string): boolean {
  const all: Workflow[] = JSON.parse(localStorage.getItem(WORKFLOWS_KEY) || '[]');
  const idx = all.findIndex((w) => w.id === workflowId);
  if (idx === -1) return false;
  const [deleted] = all.splice(idx, 1);
  localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(all));
  const trash = getTrash();
  trash.push({ ...deleted, deletedAt: new Date().toISOString() });
  localStorage.setItem(TRASH_KEY, JSON.stringify(trash));
  return true;
}

export function getDeletedWorkflows(userId: string): DeletedWorkflow[] {
  return getTrash()
    .filter((w) => w.userId === userId)
    .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
}

export function restoreWorkflow(workflowId: string): Workflow | null {
  const trash = getTrash();
  const idx = trash.findIndex((w) => w.id === workflowId);
  if (idx === -1) return null;
  const item = trash[idx];
  const remaining = trash.filter((_, i) => i !== idx);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { deletedAt: _d, ...restored } = item;
  localStorage.setItem(TRASH_KEY, JSON.stringify(remaining));
  const all: Workflow[] = JSON.parse(localStorage.getItem(WORKFLOWS_KEY) || '[]');
  all.push(restored);
  localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(all));
  return restored;
}

export function permanentlyDeleteWorkflow(workflowId: string): boolean {
  const trash = getTrash();
  const filtered = trash.filter((w) => w.id !== workflowId);
  if (filtered.length === trash.length) return false;
  localStorage.setItem(TRASH_KEY, JSON.stringify(filtered));
  return true;
}

export function purgeExpiredWorkflows(): void {
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const trash = getTrash();
  const kept = trash.filter((w) => Date.now() - new Date(w.deletedAt).getTime() < THIRTY_DAYS_MS);
  if (kept.length !== trash.length) {
    localStorage.setItem(TRASH_KEY, JSON.stringify(kept));
  }
}
