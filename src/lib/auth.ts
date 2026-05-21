import type { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";

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
  username?: string;
  convexUserId?: string;
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

const SESSION_KEY = 'planet_session';
const WORKFLOWS_KEY = 'planet_workflows';

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

export async function signIn(
  email: string,
  password: string,
  convex: ConvexReactClient
): Promise<User | null> {
  const result = await convex.action(api.auth.signIn, {
    email: email.toLowerCase().trim(),
    password,
  });
  if (!result) return null;
  const user: User = {
    id: result.convexId,
    convexUserId: result.convexId,
    name: result.name,
    email: result.email,
    username: result.username,
    phone: result.phoneNumber,
    organization: result.organizationName,
    role: result.roleInOrganization,
    apiKeys: [],
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
  refreshSession(user);
  return user;
}

export async function createAccount(
  name: string,
  email: string,
  password: string,
  convex: ConvexReactClient,
  extra?: { username?: string; phone?: string; organization?: string; role?: string }
): Promise<User | 'exists' | 'error'> {
  const result = await convex.action(api.auth.createVerifiedAccount, {
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    username: extra?.username,
    phoneNumber: extra?.phone,
    organizationName: extra?.organization,
    roleInOrganization: extra?.role,
  });
  if ('error' in result) return result.error;
  const user: User = {
    id: result.convexId,
    convexUserId: result.convexId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    username: extra?.username,
    phone: extra?.phone,
    organization: extra?.organization,
    role: extra?.role,
    apiKeys: [],
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
  refreshSession(user);
  return user;
}

export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string,
  convex: ConvexReactClient
): Promise<boolean> {
  return convex.action(api.auth.changePassword, {
    email: email.toLowerCase().trim(),
    currentPassword,
    newPassword,
  });
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
  convex: ConvexReactClient
): Promise<boolean> {
  return convex.action(api.auth.resetPassword, {
    email: email.toLowerCase().trim(),
    code,
    newPassword,
  });
}

export function signOut(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>
): User | null {
  const session = getCurrentUser();
  if (!session || session.id !== userId) return null;
  const updated = { ...session, ...updates };
  refreshSession(updated);
  return updated;
}

export function addApiKey(userId: string, description: string, key: string): User | null {
  const session = getCurrentUser();
  if (!session || session.id !== userId) return null;
  const newKey: ApiKey = {
    id: crypto.randomUUID(),
    description,
    key,
    createdAt: new Date().toISOString(),
  };
  const updated = { ...session, apiKeys: [...(session.apiKeys ?? []), newKey] };
  refreshSession(updated);
  return updated;
}

export function removeApiKey(userId: string, keyId: string): User | null {
  const session = getCurrentUser();
  if (!session || session.id !== userId) return null;
  const updated = { ...session, apiKeys: (session.apiKeys ?? []).filter((k) => k.id !== keyId) };
  refreshSession(updated);
  return updated;
}

export function setConvexUserId(localUserId: string, convexUserId: string): void {
  const session = getCurrentUser();
  if (!session || session.id !== localUserId) return;
  refreshSession({ ...session, convexUserId });
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
