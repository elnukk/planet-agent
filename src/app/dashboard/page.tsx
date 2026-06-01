'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import {
  getCurrentUser,
  setConvexUserId,
  type User,
} from '@/lib/auth';
import planetLogo from './planetlogo.png';

interface DisplayWorkflow {
  id: string;
  name: string;
  updatedAt: string;
  imageUrl?: string;
}

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

const TITLE_CASE_SKIP = new Set(['a','an','the','and','but','or','for','nor','on','at','to','by','in','of','up','as','is']);
function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map((word, i, arr) =>
      i === 0 || i === arr.length - 1 || !TITLE_CASE_SKIP.has(word.toLowerCase())
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word.toLowerCase()
    )
    .join(' ');
}


function WorkflowCard({
  workflow,
  onClick,
  onDelete,
}: {
  workflow: DisplayWorkflow;
  onClick: () => void;
  onDelete: () => void;
}) {
  const imgUrl = workflow.imageUrl ?? null;

  return (
    <div className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200">
      <button onClick={onClick} className="block w-full text-left focus:outline-none">
        <div
          className="w-full aspect-square flex items-end p-3 relative"
          style={{ background: cardGradient(workflow.id) }}
        >
          {imgUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="relative z-10 text-white text-sm font-semibold leading-snug drop-shadow-md line-clamp-2">
            {toTitleCase(workflow.name)}
          </span>
        </div>
      </button>

      {/* Delete button shown on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete"
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      </button>
    </div>
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
  const [mounted, setMounted] = useState(false);

  const createConvexUser = useMutation(api.users.createUser);
  const deleteConvexWorkflow = useMutation(api.workflows.deleteWorkflow);

  const convexWorkflows = useQuery(
    api.workflows.getUserWorkflows,
    user?.convexUserId ? { userId: user.convexUserId as Id<'users'> } : 'skip',
  );

  const workflows: DisplayWorkflow[] = (convexWorkflows ?? []).map((w) => ({
    id: w._id as string,
    name: w.useCase,
    updatedAt: new Date(w.updatedAt).toISOString(),
    imageUrl: w.imageUrl ?? undefined,
  }));

  useEffect(() => {
    setMounted(true);
    const current = getCurrentUser();
    if (!current) { router.replace('/'); return; }
    setUser(current);
  }, [router]);

  useEffect(() => {
    if (!user || user.convexUserId) return;
    createConvexUser({ name: user.name, email: user.email }).then((id) => {
      setConvexUserId(user.id, id as string);
      setUser(getCurrentUser());
    });
  }, [user, createConvexUser]);

  async function handleDelete(workflowId: string) {
    await deleteConvexWorkflow({ id: workflowId as Id<'workflows'> });
  }

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
      <header className="bg-black h-20 flex items-center flex-shrink-0 relative">
        <div className="relative h-20 w-20 flex-shrink-0 ml-2">
          <Image src={planetLogo} alt="Planet logo" fill className="object-contain" />
        </div>

        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tracking-wide text-white pointer-events-none">
          Project Centinela
        </span>

        <div className="ml-auto flex-shrink-0 pr-4">
          <button
            onClick={() => router.push('/profile')}
            className="text-white text-sm font-medium border border-white rounded-full px-4 py-1.5 hover:bg-white hover:text-black transition-colors"
          >
            Profile
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Section header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {firstName ? `Hello ${firstName}!` : 'Hello!'}
          </h1>
        </div>

        {/* Workflows view */}
        <>
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
                  onClick={() => router.push('/intake')}
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
                <AddCard onClick={() => router.push('/intake')} />
                {workflows.map((wf) => (
                  <WorkflowCard
                    key={wf.id}
                    workflow={wf}
                    onClick={() => router.push(`/workflow/${wf.id}`)}
                    onDelete={() => handleDelete(wf.id)}
                  />
                ))}
              </div>
            )}
          </>
      </main>

    </div>
  );
}
