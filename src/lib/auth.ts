export interface User {
  id: string;
  name: string;
  email: string;
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

export function createAccount(name: string, email: string, password: string): User | 'exists' {
  const users = getUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) return 'exists';
  const user: User = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    createdAt: new Date().toISOString(),
  };
  const passwords: Record<string, string> = JSON.parse(
    localStorage.getItem(PASSWORDS_KEY) || '{}'
  );
  passwords[user.email] = password;
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
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
