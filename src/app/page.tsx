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
            <p className="text-sm text-gray-500 mb-5">Enter your email and we'll let you set a new password.</p>
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

// ─── Main auth page ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (getCurrentUser()) router.replace('/dashboard');
  }, [router]);

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setName('');
    setPassword('');
    setConfirmPassword('');
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
        if (!name.trim()) { setError('Please enter your name.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        const result = createAccount(name, email, password);
        if (result === 'exists') { setError('An account with this email already exists.'); return; }
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* Top bar */}
      <header className="flex items-center px-4 h-14 bg-black flex-shrink-0">
        <div className="relative h-12 w-12 flex-shrink-0">
          <Image src={planetLogo} alt="Planet logo" fill className="object-contain" />
        </div>
        <span className="flex-1 text-center text-xl font-semibold tracking-wide text-white">
          Centinela
        </span>
        <div className="w-12" />
      </header>

      {/* Hero */}
      <div className="flex-1 relative flex items-center justify-center" style={{ minHeight: 480 }}>
        <Image src={loginBg} alt="Satellite view" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-0.5">Welcome!</h1>
          <p className="text-center text-base font-medium mb-6" style={{ color: TEAL }}>
            {mounted ? (mode === 'login' ? 'Login' : 'Sign up') : 'Login'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mounted && mode === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Full name"
                className="w-full px-4 py-3 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition"
              />
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email address"
              className="w-full px-4 py-3 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition"
            />

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="w-full px-4 py-3 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition"
              />
              {mounted && mode === 'login' && (
                <div className="text-right mt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-xs hover:underline transition-colors"
                    style={{ color: TEAL }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {mounted && mode === 'signup' && (
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm password"
                className="w-full px-4 py-3 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition"
              />
            )}

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity mt-2"
              style={{ backgroundColor: TEAL }}
            >
              {loading ? 'Please wait…' : 'Continue'}
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
