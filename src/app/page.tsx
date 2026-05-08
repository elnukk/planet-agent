'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useMutation, useConvex } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { signIn, createAccount, getCurrentUser, resetPassword, setConvexUserId } from '@/lib/auth';

import loginBg from './dashboard/loginbackground.png';
import planetLogo from './dashboard/planetlogo.png';

const TEAL = '#009DA5';

type Mode = 'login' | 'signup' | 'verify';

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

// ─── 6-digit code input ───────────────────────────────────────────────────────
function CodeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  function handleKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs[i - 1].current?.focus();
  }

  function handleChange(i: number, char: string) {
    const digits = char.replace(/\D/g, '').slice(0, 1);
    const arr = (value + '      ').slice(0, 6).split('');
    arr[i] = digits;
    const next = arr.join('').trimEnd();
    onChange(next);
    if (digits && i < 5) refs[i + 1].current?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    refs[Math.min(pasted.length, 5)].current?.focus();
    e.preventDefault();
  }

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className="w-11 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-colors"
          style={{
            borderColor: value[i] ? TEAL : '#e5e7eb',
            color: '#111',
          }}
        />
      ))}
    </div>
  );
}

const INPUT = 'w-full px-4 py-3 border border-gray-200 rounded-full text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-100 transition';

// ─── Main auth page ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const router = useRouter();
  const convex = useConvex();
  const createUser = useMutation(api.users.createUser);
  const verifyCodeMutation = useMutation(api.verificationCodes.verifyCode);
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
  const [username, setUsername] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [orgRole, setOrgRole] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyDesc, setApiKeyDesc] = useState('');
  const [apiKeyValue, setApiKeyValue] = useState('');

  // verification step
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  // store pending signup data to complete after verification
  const pendingRef = useRef<{
    name: string; email: string; password: string;
    username?: string; phone?: string; organization?: string;
    role?: string; apiKeyDesc?: string; apiKeyValue?: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    if (getCurrentUser()) router.replace('/dashboard');
  }, [router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setName('');
    setUsername('');
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
    setVerifyCode('');
    setVerifyError('');
    setDevCode(null);
    pendingRef.current = null;
  }

  async function sendVerification(targetEmail: string): Promise<boolean> {
    const res = await fetch('/api/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: targetEmail }),
    });
    const data = await res.json();
    if (!res.ok) return false;
    // Dev mode: show code directly if RESEND_API_KEY not configured
    if (data.devCode) setDevCode(data.devCode);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const user = signIn(email, password);
        if (!user) { setError('Incorrect email or password.'); return; }
        if (!user.convexUserId) {
          const convexUser = await convex.query(api.users.getUserByEmail, { email: email.toLowerCase().trim() });
          if (convexUser) {
            setConvexUserId(user.id, convexUser._id as string);
          } else {
            const convexId = await createUser({ name: user.name, email: email.toLowerCase().trim() });
            setConvexUserId(user.id, convexId as string);
          }
        }
        router.push('/dashboard');
      } else {
        // Validate signup fields
        if (!name.trim()) { setError('Please enter your full name.'); return; }
        if (confirmEmail.toLowerCase() !== email.toLowerCase()) { setError('Email addresses do not match.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (phone && phone !== confirmPhone) { setError('Phone numbers do not match.'); return; }

        // Store pending data and send verification email
        pendingRef.current = {
          name, email, password,
          username: username.trim() || undefined,
          phone: phone.trim() || undefined,
          organization: organization.trim() || undefined,
          role: orgRole.trim() || undefined,
          apiKeyDesc: apiKeyDesc.trim() || undefined,
          apiKeyValue: apiKeyValue.trim() || undefined,
        };

        const sent = await sendVerification(email);
        if (!sent) { setError('Failed to send verification email. Please try again.'); return; }

        setVerifyCode('');
        setVerifyError('');
        setResendCooldown(60);
        setMode('verify');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (verifyCode.length < 6) return;
    setVerifyError('');
    setLoading(true);
    try {
      const pending = pendingRef.current;
      if (!pending) { setVerifyError('Session expired. Please start over.'); return; }

      const result = await verifyCodeMutation({ email: pending.email, code: verifyCode });
      if (!result.valid) {
        setVerifyError(
          result.reason === 'expired'
            ? 'Code expired. Request a new one.'
            : 'Incorrect code. Please try again.'
        );
        setVerifyCode('');
        return;
      }

      // Code verified — create the account
      const apiKeys = (pending.apiKeyDesc && pending.apiKeyValue)
        ? [{ id: crypto.randomUUID(), description: pending.apiKeyDesc, key: pending.apiKeyValue, createdAt: new Date().toISOString() }]
        : [];
      const result2 = createAccount(pending.name, pending.email, pending.password, {
        username: pending.username,
        phone: pending.phone,
        organization: pending.organization,
        role: pending.role,
        apiKeys,
      });
      if (result2 === 'exists') { setVerifyError('An account with this email already exists.'); return; }
      const convexId = await createUser({
        name: pending.name.trim(),
        email: pending.email.toLowerCase().trim(),
        username: pending.username,
      });
      setConvexUserId(result2.id, convexId as string);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!pendingRef.current || resendCooldown > 0) return;
    setResending(true);
    setVerifyError('');
    setDevCode(null);
    try {
      const sent = await sendVerification(pendingRef.current.email);
      if (sent) {
        setResendCooldown(60);
        setVerifyCode('');
      } else {
        setVerifyError('Failed to resend. Please try again.');
      }
    } finally {
      setResending(false);
    }
  }

  const isSignup = mounted && mode === 'signup';
  const isVerify = mounted && mode === 'verify';

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

          {/* ── Verify email step ── */}
          {isVerify ? (
            <>
              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#e0f7f8' }}>
                  <svg className="w-7 h-7" style={{ color: TEAL }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 text-center">Check your email</h1>
                <p className="text-sm text-gray-500 text-center mt-2 leading-relaxed">
                  We sent a 6-digit code to{' '}
                  <span className="font-semibold text-gray-800">{pendingRef.current?.email}</span>.
                  Enter it below to verify your email address.
                </p>
              </div>

              {devCode && (
                <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <p className="text-xs text-amber-700 font-medium mb-1">Dev mode — no RESEND_API_KEY set</p>
                  <p className="text-lg font-mono font-bold text-amber-800 tracking-widest">{devCode}</p>
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-5">
                <CodeInput value={verifyCode} onChange={setVerifyCode} />

                {verifyError && (
                  <p className="text-xs text-red-500 text-center">{verifyError}</p>
                )}

                <button
                  type="submit"
                  disabled={verifyCode.length < 6 || loading}
                  className="w-full py-3 rounded-full text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: TEAL }}
                >
                  {loading ? 'Verifying…' : 'Verify Email'}
                </button>
              </form>

              <div className="mt-5 text-center space-y-2">
                <p className="text-sm text-gray-500">
                  Didn&apos;t receive a code?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || resending}
                    className="font-semibold disabled:opacity-40 hover:underline transition-colors"
                    style={{ color: TEAL }}
                  >
                    {resending
                      ? 'Sending…'
                      : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : 'Resend code'}
                  </button>
                </p>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Back to sign up
                </button>
              </div>
            </>
          ) : (
            <>
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

                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                      placeholder="Username (optional, e.g. @jsmith)"
                      className={INPUT}
                    />

                    <SectionLabel>Email <span className="text-red-400 normal-case font-normal tracking-normal">*required</span></SectionLabel>

                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      required placeholder="Email address" className={INPUT} />

                    <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)}
                      required placeholder="Confirm email address" className={INPUT} />

                    <SectionLabel>Password</SectionLabel>

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
                        {showApiKey ? 'Hide API key fields' : 'Add a Planet API key (optional)'}
                      </button>

                      {showApiKey && (
                        <div className="mt-3 space-y-2 pl-2 border-l-2 border-gray-100">
                          <input type="text" value={apiKeyDesc} onChange={(e) => setApiKeyDesc(e.target.value)}
                            placeholder="Key description (e.g. Planet NICFI API)" className={INPUT} />
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
                  {loading
                    ? (mode === 'signup' ? 'Sending code…' : 'Please wait…')
                    : (mode === 'login' ? 'Sign In' : 'Continue')}
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
            </>
          )}
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
