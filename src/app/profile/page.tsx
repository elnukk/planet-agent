'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCurrentUser, signOut, type User } from '@/lib/auth';
import planetLogo from '../dashboard/planetlogo.png';

type Tab = 'basic' | 'settings' | 'privacy';

const TABS: { id: Tab; label: string }[] = [
  { id: 'basic', label: 'Basic Information' },
  { id: 'settings', label: 'More Settings' },
  { id: 'privacy', label: 'Privacy Preferences' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>('basic');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const current = getCurrentUser();
    if (!current) { router.replace('/'); return; }
    setUser(current);
  }, [router]);

  function handleLogout() {
    signOut();
    router.replace('/');
  }

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="bg-black h-14 px-4 flex items-center justify-between">
        <button onClick={() => router.push('/dashboard')} className="flex-shrink-0">
          <div className="relative h-12 w-12">
            <Image src={planetLogo} alt="Planet logo" fill className="object-contain" />
          </div>
        </button>

        <span className="text-white text-xl font-semibold tracking-wide">Centinela</span>

        <button
          onClick={handleLogout}
          className="text-white text-xs font-medium border border-white rounded-full px-4 py-1.5 hover:bg-white hover:text-black transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-5">Profile</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-gray-200 text-gray-900'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-gray-100 rounded-2xl px-6 py-5 mb-8">
          {tab === 'basic' && (
            <div className="space-y-4">
              <Field label="Full Name:" value={user?.name} />
              <Field label="Email:" value={user?.email} />
              <Field label="Number:" value="" />
              <Field label="Community Organizations:" value="" />
              <Field label="Community Members:" value="" />
            </div>
          )}
          {tab === 'settings' && (
            <div className="space-y-4">
              <Field label="Notification Preferences:" value="Email" />
              <Field label="Language:" value="English" />
              <Field label="Timezone:" value="" />
            </div>
          )}
          {tab === 'privacy' && (
            <div className="space-y-4">
              <Field label="Data Sharing:" value="Disabled" />
              <Field label="Analytics:" value="Disabled" />
              <Field label="Account Visibility:" value="Private" />
            </div>
          )}
        </div>

        {/* API Keys */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">API Keys</h2>
        <div className="bg-gray-100 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-2 px-5 py-3 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-600">Description</span>
            <span className="text-sm font-medium text-gray-600">API Key</span>
          </div>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`grid grid-cols-2 px-5 py-4 ${i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-100'}`}
            >
              <span className="text-sm text-gray-400">—</span>
              <span className="text-sm text-gray-400">—</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-sm text-gray-500 w-52 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value || ''}</span>
    </div>
  );
}
