'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  getCurrentUser,
  getUserWorkflows,
  createWorkflow,
  type User,
  type Workflow,
} from '@/lib/auth';
import planetLogo from './planetlogo.png';

const GRADIENTS = [
  'linear-gradient(135deg, #FF7043 0%, #BF360C 100%)',
  'linear-gradient(135deg, #66BB6A 0%, #1B5E20 100%)',
  'linear-gradient(135deg, #42A5F5 0%, #0D47A1 100%)',
  'linear-gradient(135deg, #AB47BC 0%, #4A148C 100%)',
  'linear-gradient(135deg, #FFA726 0%, #BF360C 100%)',
  'linear-gradient(135deg, #26C6DA 0%, #006064 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #F9A825 60%, #E65100 100%)',
  'linear-gradient(135deg, #9CCC65 0%, #33691E 100%)',
];

function cardGradient(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  }
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function NewWorkflowModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (w: Workflow) => void;
}) {
  const [name, setName] = useState('');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const user = getCurrentUser();
    if (!user) return;
    onCreated(createWorkflow(user.id, name.trim()));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-gray-900 mb-1">New Workflow</h2>
        <p className="text-sm text-gray-400 mb-5">Give your workflow a name to get started.</p>
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Amazon Deforestation Analysis"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors"
              style={{ backgroundColor: '#26C6DA' }}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WorkflowCard({ workflow, onClick }: { workflow: Workflow; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 focus:outline-none"
    >
      <div
        className="w-full aspect-square flex items-end p-3 relative"
        style={{ background: cardGradient(workflow.id) }}
      >
        <span className="relative text-white text-sm font-semibold leading-snug drop-shadow-md line-clamp-2">
          {workflow.name}
        </span>
      </div>
      <div className="px-1 pt-1.5 pb-0.5">
        <p className="text-xs text-gray-400">{formatDate(workflow.updatedAt)}</p>
      </div>
    </button>
  );
}

function AddCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all duration-200 focus:outline-none aspect-square flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-2 text-gray-300 group-hover:text-cyan-400 transition-colors">
        <div className="w-10 h-10 rounded-full border-2 border-current flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const current = getCurrentUser();
    if (!current) { router.replace('/'); return; }
    setUser(current);
    setWorkflows(getUserWorkflows(current.id));
  }, [router]);

  const handleWorkflowCreated = useCallback((w: Workflow) => {
    setWorkflows((prev) => [w, ...prev]);
    setShowModal(false);
    router.push(`/workflow/${w.id}`);
  }, [router]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div className="min-h-screen bg-white">

      {/* Dark top nav */}
      <header className="bg-black h-14 px-4 flex items-center justify-between flex-shrink-0">
        <div className="relative h-12 w-12 flex-shrink-0">
          <Image src={planetLogo} alt="Planet logo" fill className="object-contain" />
        </div>

        <span className="text-white text-xl font-semibold tracking-wide">Centinela</span>

        <button
          onClick={() => router.push('/profile')}
          className="text-white text-xs font-medium border border-white rounded-full px-4 py-1.5 hover:bg-white hover:text-black transition-colors"
        >
          Profile
        </button>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {firstName ? `Hello ${firstName}!` : 'Hello!'}
        </h1>

        {workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 bg-cyan-50">
              <svg className="w-10 h-10 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Start your first workflow</h2>
            <p className="text-gray-400 text-sm max-w-xs mb-8 leading-relaxed">
              Create a satellite intelligence workflow to analyze geospatial data for your project.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#26C6DA' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <AddCard onClick={() => setShowModal(true)} />
            {workflows.map((wf) => (
              <WorkflowCard
                key={wf.id}
                workflow={wf}
                onClick={() => router.push(`/workflow/${wf.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <NewWorkflowModal
          onClose={() => setShowModal(false)}
          onCreated={handleWorkflowCreated}
        />
      )}
    </div>
  );
}
