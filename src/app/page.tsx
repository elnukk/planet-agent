'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useConvex } from 'convex/react';
import { signIn, createAccount, getCurrentUser, resetPassword } from '@/lib/auth';

import loginBg from './dashboard/loginbackground.png';
import planetLogo from './dashboard/planetlogo.png';

const TEAL = '#009DA5';

type Mode = 'login' | 'signup';

// ─── Forgot-password modal ────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const convex = useConvex();
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError('Failed to send code. Please try again.'); return; }
      if (data.devCode) setDevCode(data.devCode);
      setStep('reset');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (code.length < 6) { setError('Please enter the 6-digit code.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const ok = await resetPassword(email.toLowerCase().trim(), code, newPassword, convex);
      if (!ok) { setError('Invalid or expired code, or no account found for that email.'); return; }
      setStep('done');
    } finally {
      setLoading(false);
    }
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
            <p className="text-sm text-gray-500 mb-5">Enter your email and we&apos;ll send you a reset code.</p>
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
                <button type="submit" disabled={!email.trim() || loading}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: TEAL }}>
                  {loading ? 'Sending…' : 'Send Code'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Reset your password</h2>
            <p className="text-sm text-gray-500 mb-4">Enter the code sent to <span className="font-medium text-gray-700">{email}</span> and choose a new password.</p>
            {devCode && (
              <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <p className="text-xs text-amber-700 font-medium mb-1">Dev mode — code</p>
                <p className="text-lg font-mono font-bold text-amber-800 tracking-widest">{devCode}</p>
              </div>
            )}
            <form onSubmit={handleReset} className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="6-digit code"
                inputMode="numeric"
                className="w-full px-4 py-3 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition text-center tracking-widest font-mono"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="New password (min 6 characters)"
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
                <button type="submit" disabled={!code || !newPassword || !confirm || loading}
                  className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                  style={{ backgroundColor: TEAL }}>
                  {loading ? 'Resetting…' : 'Reset Password'}
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
  const convex = useConvex();
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
  const [organization, setOrganization] = useState('');
  const [orgRole, setOrgRole] = useState('');

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
    setOrganization('');
    setOrgRole('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const user = await signIn(email, password, convex);
        if (!user) { setError('Incorrect email or password.'); return; }
        router.push('/dashboard');
      } else {
        // Validate required fields
        if (!name.trim()) { setError('Please enter your full name.'); return; }
        if (confirmEmail.toLowerCase() !== email.toLowerCase()) { setError('Email addresses do not match.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

        const result = await createAccount(name, email, password, convex, {
          phone: phone.trim() || undefined,
          organization: organization.trim() || undefined,
          role: orgRole.trim() || undefined,
        });
        if (result === 'exists') { setError('An account with this email already exists.'); return; }
        if (result === 'error') { setError('Failed to create account. Please try again.'); return; }
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
          <Image src={planetLogo} alt="Planet logo" fill sizes="80px" className="object-contain" />
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
        <Image src={loginBg} alt="Satellite view" fill sizes="100vw" className="object-cover" priority />
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
                <SectionLabel required>Personal Information</SectionLabel>

                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  required placeholder="Full name" className={INPUT} />

                <SectionLabel required>Email</SectionLabel>

                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required placeholder="Email address" className={INPUT} />

                <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)}
                  required placeholder="Confirm email address" className={INPUT} />

                <SectionLabel required>Password</SectionLabel>

                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required placeholder="Password (min 6 characters)" className={INPUT} />

                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  required placeholder="Confirm password" className={INPUT} />

                <SectionLabel>Contact <OptLabel /></SectionLabel>

                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number" className={INPUT} />

                <SectionLabel>Organization <OptLabel /></SectionLabel>

                <input type="text" value={organization} onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Community organization" className={INPUT} />

                <input type="text" value={orgRole} onChange={(e) => setOrgRole(e.target.value)}
                  placeholder="Your role in organization" className={INPUT} />
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
              {loading
                ? (mode === 'signup' ? 'Creating account…' : 'Please wait…')
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
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

function SectionLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2 pb-0.5">
      {children}
      {required && <span className="text-red-400 normal-case font-normal tracking-normal ml-1">*required</span>}
    </p>
  );
}

function OptLabel() {
  return <span className="text-gray-300 normal-case font-normal tracking-normal">(optional)</span>;
}
