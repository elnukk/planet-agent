'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useMutation, useConvex } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { signIn, getCurrentUser, hashPassword, upsertLocalUser, type User } from '@/lib/auth';

import loginBg from '../dashboard/loginbackground.png';
import planetLogo from '../dashboard/planetlogo.png';

const TEAL = '#009DA5';

type Mode = 'login' | 'signup';

const INPUT = 'w-full px-4 py-3 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-100 transition';

// ─── Main auth page ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const router = useRouter();
  const convex = useConvex();
  const createUser = useMutation(api.users.createUser);
  const updatePassword = useMutation(api.users.updateUserPassword);
  const saveApiKey = useMutation(api.users.setApiKey);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>('login');

  // shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // signup-only
  const [name, setName] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [orgRole, setOrgRole] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyDesc, setApiKeyDesc] = useState('');
  const [apiKeyValue, setApiKeyValue] = useState('');

  useEffect(() => {
    setMounted(true);
    if (getCurrentUser()) router.replace('/dashboard');
  }, [router]);

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setConfirmEmail('');
    setConfirmPassword('');
    setPhone('');
    setConfirmPhone('');
    setOrganization('');
    setOrgRole('');
    setApiKeyDesc('');
    setApiKeyValue('');
    setShowApiKey(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const normalizedEmail = email.toLowerCase().trim();
        const hash = await hashPassword(password);
        const convexUser = await convex.query(api.users.getUserByEmail, { email: normalizedEmail });

        if (!convexUser) {
          // Legacy user — exists only in localStorage on this device
          const legacy = signIn(email, password);
          if (!legacy) { setError('Incorrect email or password.'); return; }
          // Migrate to Convex with password hash
          const convexId = await createUser({ name: legacy.name, email: normalizedEmail, passwordHash: hash });
          upsertLocalUser({ ...legacy, convexUserId: convexId as string });
          router.push('/dashboard');
          return;
        }

        if (convexUser.passwordHash) {
          if (convexUser.passwordHash !== hash) { setError('Incorrect email or password.'); return; }
        } else {
          // Convex user exists but was created before password hashing — check localStorage
          const legacy = signIn(email, password);
          if (!legacy) { setError('Incorrect email or password.'); return; }
          // Migrate: save hash to Convex
          await updatePassword({ id: convexUser._id, passwordHash: hash });
        }

        const sessionUser: User = {
          id: convexUser._id as string,
          convexUserId: convexUser._id as string,
          name: convexUser.name,
          email: convexUser.email,
          phone: convexUser.phoneNumber,
          organization: convexUser.organizationName,
          role: convexUser.roleInOrganization,
          apiKeys: convexUser.apiKeyValue
            ? [{ id: 'primary', description: convexUser.apiKeyDescription || 'API Key', key: convexUser.apiKeyValue, createdAt: new Date(convexUser.createdAt).toISOString() }]
            : [],
          createdAt: new Date(convexUser.createdAt).toISOString(),
        };
        upsertLocalUser(sessionUser);
        router.push('/dashboard');

      } else {
        if (!name.trim()) { setError('Please enter your full name.'); return; }
        if (confirmEmail.toLowerCase() !== email.toLowerCase()) { setError('Email addresses do not match.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (phone && phone !== confirmPhone) { setError('Phone numbers do not match.'); return; }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await convex.query(api.users.getUserByEmail, { email: normalizedEmail });
        if (existing) { setError('An account with this email already exists.'); return; }

        const hash = await hashPassword(password);
        const convexId = await createUser({ name: name.trim(), email: normalizedEmail, passwordHash: hash });

        const hasApiKey = showApiKey && apiKeyDesc.trim() && apiKeyValue.trim();
        if (hasApiKey) {
          await saveApiKey({ id: convexId as Id<'users'>, apiKeyDescription: apiKeyDesc.trim(), apiKeyValue: apiKeyValue.trim() });
        }

        const sessionUser: User = {
          id: convexId as string,
          convexUserId: convexId as string,
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim() || undefined,
          organization: organization.trim() || undefined,
          role: orgRole.trim() || undefined,
          apiKeys: hasApiKey
            ? [{ id: 'primary', description: apiKeyDesc.trim(), key: apiKeyValue.trim(), createdAt: new Date().toISOString() }]
            : [],
          createdAt: new Date().toISOString(),
        };
        upsertLocalUser(sessionUser);
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  const isSignup = mounted && mode === 'signup';

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* Top bar */}
      <header className="flex items-center h-20 bg-black flex-shrink-0 relative">
        <div className="relative h-20 w-20 flex-shrink-0 ml-2">
          <Image src={planetLogo} alt="Planet logo" fill className="object-contain" />
        </div>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tracking-wide text-white pointer-events-none">
          Project Centinela
        </span>
        <div className="w-20 flex-shrink-0" />
      </header>

      {/* Hero */}
      <div
        className={`flex-1 relative flex justify-center ${isSignup ? 'items-start py-10' : 'items-center'}`}
        style={{ minHeight: 520 }}
      >
        <Image src={loginBg} alt="Satellite view" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/25" />

        <div className={`relative z-10 bg-white rounded-2xl shadow-2xl w-full mx-4 ${isSignup ? 'max-w-md' : 'max-w-sm'} p-8`}>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-0.5">Welcome!</h1>
          <p className="text-center text-base font-semibold mb-6" style={{ color: TEAL }}>
            {mounted ? (mode === 'login' ? 'Login' : 'Create your account') : 'Login'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">

            {/* ── Signup-only fields ── */}
            {isSignup && (
              <>
                <SectionLabel>Personal Information</SectionLabel>

                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  required placeholder="Full name" className={INPUT} />

                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="Email address" className={INPUT} />

                <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)}
                  required placeholder="Confirm email address" className={INPUT} />

                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required placeholder="Password (min 6 characters)" className={INPUT} />

                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  required placeholder="Confirm password" className={INPUT} />

                <SectionLabel>Contact</SectionLabel>

                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number (optional)" className={INPUT} />

                {phone.trim() && (
                  <input type="tel" value={confirmPhone} onChange={(e) => setConfirmPhone(e.target.value)}
                    placeholder="Confirm phone number" className={INPUT} />
                )}

                <SectionLabel>Organization</SectionLabel>

                <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Community organization (optional)" className={INPUT} />

                <input type="text" value={orgRole} onChange={(e) => setOrgRole(e.target.value)}
                  placeholder="Your role in organization (optional)" className={INPUT} />

                <SectionLabel>API Key</SectionLabel>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className="flex items-center gap-2 text-sm font-medium transition-colors"
                    style={{ color: TEAL }}
                  >
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${showApiKey ? 'rotate-90' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    {showApiKey ? 'Hide API key fields' : 'Add an API key (optional)'}
                  </button>

                  {showApiKey && (
                    <div className="mt-3 space-y-2 pl-2 border-l-2 border-gray-100">
                      <input type="text" value={apiKeyDesc} onChange={(e) => setApiKeyDesc(e.target.value)}
                        placeholder="Key description (e.g. Planet API)" className={INPUT} />
                      <input type="text" value={apiKeyValue} onChange={(e) => setApiKeyValue(e.target.value)}
                        placeholder="API key value" className={INPUT} />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── Login-only fields ── */}
            {!isSignup && (
              <>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="Email address" className={INPUT} />

                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required placeholder="Password" className={INPUT} />
              </>
            )}

            {error && <p className="text-xs text-red-500 text-center pt-1">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity mt-2"
              style={{ backgroundColor: TEAL }}
            >
              {loading ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-5">
            {mounted && mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchMode(mounted && mode === 'login' ? 'signup' : 'login')}
              className="font-semibold text-gray-800 hover:underline"
            >
              {mounted && mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>

    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2 pb-0.5">
      {children}
    </p>
  );
}
