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

// ─── Cookie-based session ─────────────────────────────────────────────────────

const SESSION_COOKIE = 'planet_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function writeSessionCookie(user: User): void {
  if (typeof document === 'undefined') return;
  const value = btoa(unescape(encodeURIComponent(JSON.stringify(user))));
  document.cookie = `${SESSION_COOKIE}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Strict`;
}

function readSessionCookie(): User | null {
  if (typeof document === 'undefined') return null;
  try {
    const match = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith(`${SESSION_COOKIE}=`));
    if (!match) return null;
    const value = match.trim().slice(SESSION_COOKIE.length + 1);
    return JSON.parse(decodeURIComponent(escape(atob(value))));
  } catch {
    return null;
  }
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  return readSessionCookie();
}

export function signOut(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Strict`;
}

// Sets (or replaces) the session cookie. Called after login and signup.
export function upsertLocalUser(user: User): void {
  writeSessionCookie(user);
}

// Updates the in-cookie user object. The actual Convex record is patched
// separately by the profile page via useMutation.
export function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>
): User | null {
  const session = getCurrentUser();
  if (!session || session.id !== userId) return null;
  const updated = { ...session, ...updates };
  writeSessionCookie(updated);
  return updated;
}

export function setConvexUserId(localUserId: string, convexUserId: string): void {
  const session = getCurrentUser();
  if (!session || session.id !== localUserId) return;
  writeSessionCookie({ ...session, convexUserId });
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
