'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  getCurrentUser,
  signOut,
  updateUser,
  type User,
} from '@/lib/auth';
import planetLogo from '../dashboard/planetlogo.png';

const TEAL = '#009DA5';
const TEAL_LIGHT = '#e0f7f8';

type Tab = 'account' | 'delete-account';

const TABS: { id: Tab; label: string }[] = [
  { id: 'account', label: 'Account' },
  { id: 'delete-account', label: 'Delete Account' },
];


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

  // api key state
  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyDesc, setNewKeyDesc] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');

  const clearApiKeyMutation = useMutation(api.users.clearApiKey);
  const updateUserProfileMutation = useMutation(api.users.updateUser);
  const deleteUserMutation = useMutation(api.users.deleteUser);

  const convexUser = useQuery(
    api.users.getUser,
    user?.convexUserId ? { id: user.convexUserId as Id<'users'> } : 'skip',
  );

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

  async function saveProfile() {
    if (!user) return;
    const updates = {
      name: editName.trim() || user.name,
      phone: editPhone.trim() || undefined,
      organization: editOrg.trim() || undefined,
      role: editRole.trim() || undefined,
    };
    updateUser(user.id, updates);
    refreshUser();
    if (user.convexUserId) {
      try {
        const convexUpdates: Record<string, string | undefined> = { name: updates.name };
        if (editPhone.trim()) convexUpdates.phoneNumber = editPhone.trim();
        if (editOrg.trim()) convexUpdates.organizationName = editOrg.trim();
        if (editRole.trim()) convexUpdates.roleInOrganization = editRole.trim();
        await updateUserProfileMutation({ id: user.convexUserId as Id<'users'>, ...convexUpdates });
      } catch { /* best-effort */ }
    }
    setEditing(false);
  }

  async function handleAddKey(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.convexUserId || !newKeyDesc.trim() || !newKeyValue.trim()) return;
    await fetch('/api/save-api-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.convexUserId,
        apiKeyDescription: newKeyDesc.trim(),
        apiKeyValue: newKeyValue.trim(),
      }),
    });
    setNewKeyDesc('');
    setNewKeyValue('');
    setShowAddKey(false);
  }

  async function handleRemoveKey() {
    if (!user?.convexUserId) return;
    await clearApiKeyMutation({ id: user.convexUserId as Id<'users'> });
  }

  if (!mounted) return null;

  const hasApiKey = !!convexUser?.apiKeyValue;
  const apiKeyDescription = convexUser?.apiKeyDescription ?? null;
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
                  <h2 className="text-base font-bold text-gray-900">Planet API Key</h2>
                  {!showAddKey && (
                    <button
                      onClick={() => setShowAddKey(true)}
                      className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-full text-white"
                      style={{ backgroundColor: TEAL }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      {hasApiKey ? 'Replace Key' : 'Add Key'}
                    </button>
                  )}
                </div>

                {showAddKey && (
                  <form onSubmit={handleAddKey} className="mb-4 p-4 bg-gray-50 rounded-xl space-y-3">
                    <input type="text" value={newKeyDesc} onChange={(e) => setNewKeyDesc(e.target.value)}
                      required placeholder="Key description (e.g. Planet NICFI API)"
                      className={INPUT} />
                    <input type="password" value={newKeyValue} onChange={(e) => setNewKeyValue(e.target.value)}
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

                {!hasApiKey ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: TEAL_LIGHT }}>
                      <svg className="w-6 h-6" style={{ color: TEAL }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">No API key configured</p>
                    <p className="text-xs text-gray-400 mt-1">Add your Planet API key to run satellite analyses.</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3.5 border border-gray-100 rounded-xl">
                    <div className="min-w-0 mr-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-800">
                          {apiKeyDescription ?? 'API key configured'}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 ml-6">Encrypted and stored securely</p>
                    </div>
                    <button onClick={handleRemoveKey} title="Remove key"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                )}
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
                  onClick={async () => {
                    if (deleteConfirm !== 'delete my account') return;
                    if (user?.convexUserId) {
                      await deleteUserMutation({ id: user.convexUserId as Id<'users'> });
                    }
                    signOut();
                    router.replace('/');
                  }}
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
