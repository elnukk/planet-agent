'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signIn, createAccount, getCurrentUser, resetPassword } from '@/lib/auth';
import loginBg from './dashboard/loginbackground.png';
import planetLogo from './dashboard/planetlogo.png';

const TEAL = '#009DA5';

type Mode = 'login' | 'signup';

// ─── Forgot-password modal ────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStep('reset');
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
    const ok = resetPassword(email, newPassword);
    if (!ok) { setError('No account found with that email.'); setStep('email'); return; }
    setStep('done');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 'done' ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: TEAL }}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">Password updated!</h2>
            <p className="text-sm text-gray-500">You can now sign in with your new password.</p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-full text-white text-sm font-semibold"
              style={{ backgroundColor: TEAL }}
            >
              Back to Login
            </button>
          </div>
        ) : step === 'email' ? (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Forgot password?</h2>
            <p className="text-sm text-gray-500 mb-5">Enter your email and we&apos;ll let you set a new password.</p>
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Email address"
                className="w-full px-4 py-3 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={!email.trim()}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: TEAL }}>
                  Continue
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Set new password</h2>
            <p className="text-sm text-gray-500 mb-5">Choose a new password for <span className="font-medium text-gray-700">{email}</span>.</p>
            <form onSubmit={handleReset} className="space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="New password"
                className="w-full px-4 py-3 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition"
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Confirm new password"
                className="w-full px-4 py-3 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep('email')}
                  className="flex-1 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors">
                  Back
                </button>
                <button type="submit" disabled={!newPassword || !confirm}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: TEAL }}>
                  Reset Password
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const INPUT = 'w-full px-4 py-3 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-100 transition';

// ─── Main auth page ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>('login');

  // shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

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
        const user = signIn(email, password);
        if (!user) { setError('Incorrect email or password.'); return; }
        router.push('/dashboard');
      } else {
        if (!name.trim()) { setError('Please enter your full name.'); return; }
        if (confirmEmail.toLowerCase() !== email.toLowerCase()) { setError('Email addresses do not match.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (phone && phone !== confirmPhone) { setError('Phone numbers do not match.'); return; }
        const apiKeys = (showApiKey && apiKeyDesc.trim() && apiKeyValue.trim())
          ? [{ id: crypto.randomUUID(), description: apiKeyDesc.trim(), key: apiKeyValue.trim(), createdAt: new Date().toISOString() }]
          : [];
        const result = createAccount(name, email, password, {
          phone: phone.trim() || undefined,
          organization: organization.trim() || undefined,
          role: orgRole.trim() || undefined,
          apiKeys,
        });
        if (result === 'exists') { setError('An account with this email already exists.'); return; }
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

                <div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    required placeholder="Password" className={INPUT} />
                  {mounted && mode === 'login' && (
                    <div className="text-right mt-1.5">
                      <button type="button" onClick={() => setShowForgot(true)}
                        className="text-xs hover:underline transition-colors" style={{ color: TEAL }}>
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>
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

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
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
