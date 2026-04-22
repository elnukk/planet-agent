'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  getCurrentUser,
  signOut,
  updateUser,
  addApiKey,
  removeApiKey,
  changePassword,
  type User,
  type ApiKey,
} from '@/lib/auth';
import planetLogo from '../dashboard/planetlogo.png';

const TEAL = '#009DA5';
const TEAL_LIGHT = '#e0f7f8';

type Tab = 'account' | 'more-settings' | 'delete-account';

const TABS: { id: Tab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'more-settings', label: 'More Settings' },
  { id: 'delete-account', label: 'Delete Account' },
];

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
      style={{ backgroundColor: checked ? TEAL : '#d1d5db' }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="pr-4">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 pt-1">{children}</h3>
  );
}

// ─── Profile page ─────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>('account');
  const [mounted, setMounted] = useState(false);

  // account edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editOrg, setEditOrg] = useState('');
  const [editRole, setEditRole] = useState('');

  // security state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  // api key state
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyDesc, setNewKeyDesc] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // delete account
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    setMounted(true);
    const current = getCurrentUser();
    if (!current) { router.replace('/'); return; }
    setUser(current);
  }, [router]);

  function refreshUser() {
    const u = getCurrentUser();
    if (u) setUser(u);
  }

  function handleLogout() {
    signOut();
    router.replace('/');
  }

  function startEditing() {
    if (!user) return;
    setEditName(user.name);
    setEditPhone(user.phone ?? '');
    setEditOrg(user.organization ?? '');
    setEditRole(user.role ?? '');
    setEditing(true);
  }

  function saveProfile() {
    if (!user) return;
    updateUser(user.id, {
      name: editName.trim() || user.name,
      phone: editPhone.trim() || undefined,
      organization: editOrg.trim() || undefined,
      role: editRole.trim() || undefined,
    });
    refreshUser();
    setEditing(false);
  }

  function togglePref(key: keyof NonNullable<User['preferences']>, value: boolean) {
    if (!user) return;
    updateUser(user.id, { preferences: { ...(user.preferences ?? {}), [key]: value } });
    refreshUser();
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setPwError('');
    setPwSuccess(false);
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    const ok = changePassword(user.email, currentPw, newPw);
    if (!ok) { setPwError('Current password is incorrect.'); return; }
    setPwSuccess(true);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
  }

  function handleAddKey(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newKeyDesc.trim() || !newKeyValue.trim()) return;
    addApiKey(user.id, newKeyDesc.trim(), newKeyValue.trim());
    refreshUser();
    setNewKeyDesc('');
    setNewKeyValue('');
    setShowAddKey(false);
  }

  function handleRemoveKey(keyId: string) {
    if (!user) return;
    removeApiKey(user.id, keyId);
    refreshUser();
  }

  function copyKey(k: ApiKey) {
    navigator.clipboard.writeText(k.key);
    setCopiedId(k.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function maskKey(k: string) {
    if (k.length <= 8) return '••••••••';
    return k.slice(0, 4) + '••••••••' + k.slice(-4);
  }

  if (!mounted) return null;

  const prefs = user?.preferences ?? {};
  const apiKeys = user?.apiKeys ?? [];
  const initials = (user?.name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const INPUT =
    'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-100 transition';

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-black h-20 flex items-center flex-shrink-0 relative">
        <div className="relative h-20 w-20 flex-shrink-0 ml-2">
          <Image src={planetLogo} alt="Planet logo" fill className="object-contain" />
        </div>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tracking-wide text-white pointer-events-none">
          Project Centinela
        </span>
        <div className="ml-auto flex-shrink-0 pr-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-white text-sm font-medium border border-white rounded-full px-4 py-1.5 hover:bg-white hover:text-black transition-colors"
          >
            Home
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Profile hero ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 select-none"
            style={{ backgroundColor: TEAL }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{user?.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
            {user?.phone && <p className="text-sm text-gray-500">{user.phone}</p>}
            {(user?.organization || user?.role) && (
              <p className="text-sm mt-1 font-medium" style={{ color: TEAL }}>
                {[user.role, user.organization].filter(Boolean).join(' · ')}
              </p>
            )}
            {memberSince && <p className="text-xs text-gray-400 mt-1">Member since {memberSince}</p>}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'text-white'
                  : t.id === 'delete-account'
                  ? 'bg-white text-red-400 border border-red-200 hover:bg-red-50'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
              style={tab === t.id && t.id !== 'delete-account' ? { backgroundColor: TEAL } : tab === t.id && t.id === 'delete-account' ? { backgroundColor: '#ef4444' } : {}}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* ── Account ── */}
          {tab === 'account' && (
            <div className="p-6 space-y-8">

              {/* Profile info */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">Account Information</h2>
                  {!editing && (
                    <button
                      onClick={startEditing}
                      className="text-sm font-medium px-4 py-1.5 rounded-full border transition-colors"
                      style={{ color: TEAL, borderColor: TEAL }}
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)}
                        className={`mt-1 ${INPUT}`} placeholder="Full name" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email</label>
                      <p className="mt-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-500">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phone</label>
                      <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                        className={`mt-1 ${INPUT}`} placeholder="Phone number" type="tel" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Community Organization</label>
                      <input value={editOrg} onChange={(e) => setEditOrg(e.target.value)}
                        className={`mt-1 ${INPUT}`} placeholder="Organization name" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</label>
                      <input value={editRole} onChange={(e) => setEditRole(e.target.value)}
                        className={`mt-1 ${INPUT}`} placeholder="Your role" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setEditing(false)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                        Cancel
                      </button>
                      <button onClick={saveProfile}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                        style={{ backgroundColor: TEAL }}>
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    <InfoRow label="Full Name" value={user?.name} />
                    <InfoRow label="Email" value={user?.email} />
                    <InfoRow label="Phone" value={user?.phone} />
                    <InfoRow label="Community Organization" value={user?.organization} />
                    <InfoRow label="Role" value={user?.role} />
                  </div>
                )}
              </div>

              {/* API Keys */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">API Keys</h2>
                  {!showAddKey && (
                    <button
                      onClick={() => setShowAddKey(true)}
                      className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-full text-white"
                      style={{ backgroundColor: TEAL }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      Add Key
                    </button>
                  )}
                </div>

                {showAddKey && (
                  <form onSubmit={handleAddKey} className="mb-4 p-4 bg-gray-50 rounded-xl space-y-3">
                    <input type="text" value={newKeyDesc} onChange={(e) => setNewKeyDesc(e.target.value)}
                      required placeholder="Key description (e.g. Planet NICFI API)"
                      className={INPUT} />
                    <input type="text" value={newKeyValue} onChange={(e) => setNewKeyValue(e.target.value)}
                      required placeholder="API key value"
                      className={INPUT} />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setShowAddKey(false); setNewKeyDesc(''); setNewKeyValue(''); }}
                        className="flex-1 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors">
                        Cancel
                      </button>
                      <button type="submit"
                        className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
                        style={{ backgroundColor: TEAL }}>
                        Save Key
                      </button>
                    </div>
                  </form>
                )}

                {apiKeys.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: TEAL_LIGHT }}>
                      <svg className="w-6 h-6" style={{ color: TEAL }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">No API keys yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add a key to connect to Planet data services.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                    {apiKeys.map((k) => (
                      <div key={k.id} className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors">
                        <div className="min-w-0 mr-4">
                          <p className="text-sm font-medium text-gray-800 truncate">{k.description}</p>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">{maskKey(k.key)}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => copyKey(k)} title="Copy"
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                            {copiedId === k.id ? (
                              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                              </svg>
                            )}
                          </button>
                          <button onClick={() => handleRemoveKey(k.id)} title="Delete"
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── More Settings ── */}
          {tab === 'more-settings' && (
            <div className="p-6 space-y-8">

              {/* Notifications */}
              <div>
                <SectionHeader>Notifications</SectionHeader>
                <div className="mt-3">
                  <SettingRow label="Email Notifications" description="Receive important account alerts by email">
                    <Toggle checked={prefs.notifyEmail ?? true} onChange={(v) => togglePref('notifyEmail', v)} />
                  </SettingRow>
                  <SettingRow label="Workflow Updates" description="Get notified when your workflows complete or fail">
                    <Toggle checked={prefs.notifyWorkflow ?? true} onChange={(v) => togglePref('notifyWorkflow', v)} />
                  </SettingRow>
                  <SettingRow label="Weekly Digest" description="A weekly summary of your workflow activity">
                    <Toggle checked={prefs.notifyDigest ?? false} onChange={(v) => togglePref('notifyDigest', v)} />
                  </SettingRow>
                  <SettingRow label="Product Updates" description="News about new features and improvements">
                    <Toggle checked={prefs.notifyMarketing ?? false} onChange={(v) => togglePref('notifyMarketing', v)} />
                  </SettingRow>
                </div>
              </div>

              {/* Security */}
              <div>
                <SectionHeader>Security</SectionHeader>
                <div className="mt-3 space-y-4">
                  <p className="text-sm font-medium text-gray-700">Change Password</p>
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                      required placeholder="Current password" className={INPUT} />
                    <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
                      required placeholder="New password (min 6 characters)" className={INPUT} />
                    <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                      required placeholder="Confirm new password" className={INPUT} />
                    {pwError && <p className="text-xs text-red-500">{pwError}</p>}
                    {pwSuccess && <p className="text-xs text-green-600">Password updated successfully.</p>}
                    <button type="submit"
                      className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                      style={{ backgroundColor: TEAL }}>
                      Update Password
                    </button>
                  </form>

                  <div className="pt-2 border-t border-gray-100">
                    <SettingRow label="Two-Factor Authentication" description="Extra layer of security for your account (coming soon)">
                      <Toggle checked={prefs.twoFactor ?? false} onChange={(v) => togglePref('twoFactor', v)} />
                    </SettingRow>
                  </div>
                </div>
              </div>

              {/* Appearance */}
              <div>
                <SectionHeader>Appearance &amp; Locale</SectionHeader>
                <div className="mt-3">
                  <SettingRow label="Theme" description="Choose your preferred color scheme">
                    <select
                      value={prefs.theme ?? 'system'}
                      onChange={(e) => {
                        updateUser(user!.id, { preferences: { ...prefs, theme: e.target.value as 'light' | 'dark' | 'system' } });
                        refreshUser();
                      }}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-100 bg-white"
                    >
                      <option value="system">System Default</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </SettingRow>
                  <SettingRow label="Language" description="Display language for the interface">
                    <select
                      value={prefs.language ?? 'English'}
                      onChange={(e) => {
                        updateUser(user!.id, { preferences: { ...prefs, language: e.target.value } });
                        refreshUser();
                      }}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-100 bg-white"
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>Portuguese</option>
                      <option>German</option>
                    </select>
                  </SettingRow>
                  <SettingRow label="Timezone" description="Used for scheduling and timestamps">
                    <input
                      type="text"
                      value={prefs.timezone ?? ''}
                      onChange={(e) => {
                        updateUser(user!.id, { preferences: { ...prefs, timezone: e.target.value } });
                        refreshUser();
                      }}
                      placeholder="e.g. America/New_York"
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-44 focus:outline-none focus:ring-2 focus:ring-cyan-100"
                    />
                  </SettingRow>
                </div>
              </div>

              {/* Privacy */}
              <div>
                <SectionHeader>Privacy</SectionHeader>
                <div className="mt-3">
                  <SettingRow label="Data Sharing" description="Allow anonymized usage data to improve the platform">
                    <Toggle checked={prefs.privacySharing ?? false} onChange={(v) => togglePref('privacySharing', v)} />
                  </SettingRow>
                  <SettingRow label="Analytics" description="Help us understand how you use Project Centinela">
                    <Toggle checked={prefs.privacyAnalytics ?? false} onChange={(v) => togglePref('privacyAnalytics', v)} />
                  </SettingRow>
                  <SettingRow label="Account Visibility" description="Control whether other members can find your profile">
                    <select
                      value={prefs.accountVisibility ?? 'private'}
                      onChange={(e) => {
                        updateUser(user!.id, { preferences: { ...prefs, accountVisibility: e.target.value as 'public' | 'private' } });
                        refreshUser();
                      }}
                      className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-100 bg-white"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>
                  </SettingRow>
                  <div className="pt-4">
                    <button
                      onClick={() => {
                        const data = JSON.stringify(user, null, 2);
                        const blob = new Blob([data], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'my-centinela-data.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors text-gray-700"
                    >
                      Export My Data
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ── Delete Account ── */}
          {tab === 'delete-account' && (
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Delete Your Account</h2>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    This will permanently delete your account, all workflows, and all data associated with <span className="font-medium text-gray-700">{user?.email}</span>. This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 space-y-1">
                <p className="text-sm font-semibold text-red-700">What will be deleted:</p>
                <ul className="text-sm text-red-600 space-y-0.5 list-disc list-inside">
                  <li>Your profile and account information</li>
                  <li>All workflows and analysis history</li>
                  <li>All saved API keys</li>
                  <li>All preferences and settings</li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600 font-medium">
                  Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">delete my account</span> to confirm:
                </p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="delete my account"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition"
                />
                <button
                  onClick={() => { if (deleteConfirm === 'delete my account') { signOut(); router.replace('/'); } }}
                  disabled={deleteConfirm !== 'delete my account'}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Permanently Delete Account
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ── Logout button ── */}
        <div className="pb-6">
          <button
            onClick={handleLogout}
            className="w-full py-3.5 rounded-2xl text-base font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#374151' }}
          >
            Log Out
          </button>
        </div>

      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start gap-4 py-3">
      <span className="text-sm text-gray-400 w-52 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value || <span className="text-gray-300 italic">Not set</span>}</span>
    </div>
  );
}
