'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import type { Id } from 'convex/values';
import planetLogo from '../../dashboard/planetlogo.png';
import { type IntakeJSON } from '@/lib/workflowIntake';

const TEAL = '#009DA5';

type CellType = 'markdown' | 'code';

interface Cell {
  id: string;
  type: CellType;
  source: string;
  output?: string;
}

function fromConvexCells(
  convexCells: Array<{ cellType: string; source: string }>,
): Cell[] {
  return convexCells.map((c, i) => ({
    id: `cell-${i}`,
    type: c.cellType === 'code' ? 'code' : 'markdown',
    source: c.source,
  }));
}

const BOT_REPLIES = [
  'I can help you refine the analysis parameters. What would you like to adjust?',
  'Based on your intake, I can suggest additional preprocessing steps. Would you like me to add them?',
  'You can narrow the AOI or extend the date range. Would you like me to regenerate the workflow cells?',
  'Happy to add a cloud-masking step — cloud cover is a common source of false positives.',
  'The constraints from your intake have been factored into the workflow structure.',
];

interface ConvexMessage {
  _id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

function NavBar() {
  const router = useRouter();
  return (
    <header className="bg-black h-20 flex items-center flex-shrink-0 sticky top-0 z-20 relative">
      <button onClick={() => router.push('/dashboard')} className="flex-shrink-0 ml-2">
        <div className="relative h-20 w-20">
          <Image src={planetLogo} alt="Planet logo" fill className="object-contain" />
        </div>
      </button>
      <button
        onClick={() => router.push('/dashboard')}
        className="absolute inset-0 flex items-center justify-center text-2xl font-bold tracking-wide text-white hover:opacity-80 transition-opacity"
      >
        Project Centinela
      </button>
      <div className="ml-auto flex-shrink-0 pr-4">
        <button
          onClick={() => router.push('/profile')}
          className="text-white text-sm font-medium border border-white rounded-full px-4 py-1.5 hover:bg-white hover:text-black transition-colors"
        >
          Profile
        </button>
      </div>
    </header>
  );
}

function MarkdownCell({ source }: { source: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 prose prose-sm max-w-none text-gray-800">
      {source.split('\n').map((line, i) => {
        if (line.startsWith('## '))
          return <h2 key={i} className="text-lg font-bold text-gray-900 mt-0">{line.slice(3)}</h2>;
        if (line.startsWith('### '))
          return <h3 key={i} className="text-base font-semibold text-gray-800">{line.slice(4)}</h3>;
        if (line.startsWith('**') && line.endsWith('**'))
          return <p key={i} className="text-sm font-semibold text-gray-700">{line.slice(2, -2)}</p>;
        if (line.startsWith('**'))
          return <p key={i} className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
        if (!line.trim()) return <br key={i} />;
        return <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

function CodeCell({
  cell, showCode, ran, onRun,
}: {
  cell: Cell; showCode: boolean; ran: boolean; onRun: (id: string) => void;
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200">
      {showCode && (
        <div className="bg-gray-900 px-4 py-4 relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 font-mono">Python</span>
            <button
              onClick={() => onRun(cell.id)}
              className="text-xs text-white font-medium px-3 py-1 rounded-full transition-colors"
              style={{ backgroundColor: TEAL }}
            >
              ▶ Run
            </button>
          </div>
          <pre className="text-sm font-mono text-gray-100 leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {cell.source}
          </pre>
        </div>
      )}
      {ran && cell.output && (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
          <span className="text-xs text-gray-400 font-mono block mb-1">Output:</span>
          <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">{cell.output}</pre>
        </div>
      )}
      {!showCode && ran && cell.output && (
        <div className="bg-gray-50 px-4 py-3">
          <span className="text-xs text-gray-400 font-mono block mb-1">Output:</span>
          <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">{cell.output}</pre>
        </div>
      )}
    </div>
  );
}

function IntakeSummaryCard({ intake }: { intake: IntakeJSON }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
      {[
        { label: 'Use Case', value: intake.use_case },
        { label: 'Product', value: intake.planet_product },
        { label: 'Region', value: intake.region?.description },
        { label: 'Start', value: intake.date_range?.start },
        { label: 'End', value: intake.date_range?.end },
        { label: 'Resolution', value: intake.temporal_resolution },
      ].map(({ label, value }) =>
        value ? (
          <div key={label}>
            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
            <span className="block text-gray-800 mt-0.5 leading-snug">{value}</span>
          </div>
        ) : null
      )}
      {intake.constraints?.length > 0 && (
        <div className="col-span-2 sm:col-span-3">
          <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Constraints</span>
          <div className="flex flex-wrap gap-1.5">
            {intake.constraints.map((c, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ChatPanel({ workflowId, intake, onClose }: { workflowId: string; intake: IntakeJSON | null; onClose: () => void }) {
  const context = intake
    ? `Use case: ${intake.use_case}. Region: ${intake.region?.description}. Product: ${intake.planet_product}. Intent: ${intake.inferred_intent}.`
    : '';

  const convexMessages = useQuery(
    api.conversations.getConversation,
    { workflowId: workflowId as Id<'workflows'> },
  ) as ConvexMessage[] | undefined;

  const sendMessage = useMutation(api.conversations.sendMessage);

  const [input, setInput] = useState('');
  const [replyIdx, setReplyIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convexMessages]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setLoading(true);

    await sendMessage({ workflowId: workflowId as Id<'workflows'>, role: 'user', content: text });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context }),
      });
      const data = await res.json();
      const reply = data.reply || BOT_REPLIES[replyIdx % BOT_REPLIES.length];
      await sendMessage({ workflowId: workflowId as Id<'workflows'>, role: 'assistant', content: reply });
      setReplyIdx((i) => i + 1);
    } catch {
      const reply = BOT_REPLIES[replyIdx % BOT_REPLIES.length];
      await sendMessage({ workflowId: workflowId as Id<'workflows'>, role: 'assistant', content: reply });
      setReplyIdx((i) => i + 1);
    } finally {
      setLoading(false);
    }
  }

  const displayMessages = convexMessages ?? [];
  const welcomeText = intake
    ? `Hi! I'm the Project Centinela assistant. I can see your workflow is for ${intake.use_case || 'satellite analysis'} in ${intake.region?.description || 'your region'}. How can I help?`
    : "Hi! I'm the Project Centinela workflow assistant. Ask me anything about this analysis.";

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col z-30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100" style={{ backgroundColor: TEAL }}>
        <span className="text-white text-sm font-semibold">Centinela Workflow Assistant</span>
        <button onClick={onClose} className="text-white hover:opacity-70 transition-opacity">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-72">
        {displayMessages.length === 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 text-sm px-3 py-2 rounded-2xl rounded-bl-sm max-w-[85%] leading-snug">
              {welcomeText}
            </div>
          </div>
        )}
        {displayMessages.map((msg) => (
          <div key={msg._id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`text-sm px-3 py-2 rounded-2xl max-w-[85%] leading-snug ${
                msg.role === 'user' ? 'text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
              style={msg.role === 'user' ? { backgroundColor: TEAL } : {}}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-400 text-sm px-3 py-2 rounded-2xl rounded-bl-sm">…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-100">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Ask a question…"
          className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-200"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white disabled:opacity-40 flex-shrink-0 transition-opacity"
          style={{ backgroundColor: TEAL }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function WorkflowPage() {
  const params = useParams();
  const workflowId = params?.id as string;

  const workflowData = useQuery(
    api.workflows.getWorkflow,
    workflowId ? { id: workflowId as Id<'workflows'> } : 'skip',
  );

  const intake: IntakeJSON | null = workflowData
    ? {
        region: workflowData.region as IntakeJSON['region'],
        date_range: workflowData.dateRange,
        temporal_resolution: workflowData.temporalResolution ?? '',
        planet_product: workflowData.planetProduct,
        use_case: workflowData.useCase,
        user_description: workflowData.userDescription ?? '',
        inferred_intent: workflowData.inferredIntent ?? '',
        constraints: workflowData.constraints ?? [],
      }
    : null;

  const workflowName = workflowData?.useCase ?? 'Workflow';

  const [showCode, setShowCode] = useState(true);
  const [ranCells, setRanCells] = useState<Set<string>>(new Set());
  const [runningAll, setRunningAll] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [assembleError, setAssembleError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const assembleTriggered = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function triggerAssembly(wd: NonNullable<typeof workflowData>) {
    if (assembleTriggered.current) return;
    assembleTriggered.current = true;
    setAssembleError(null);
    setTimedOut(false);

    const intakeForAgent = {
      region: wd.region,
      date_range: wd.dateRange,
      temporal_resolution: wd.temporalResolution ?? 'unknown',
      planet_product: wd.planetProduct,
      use_case: wd.useCase,
      user_description: wd.userDescription ?? '',
      inferred_intent: wd.inferredIntent ?? '',
      constraints: wd.constraints ?? [],
    };

    // Route returns 200 immediately; assembly runs in the background on the server.
    // Convex reactive query picks up notebookCells when the agent finishes.
    fetch('/api/assemble-workflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intake: intakeForAgent, workflowId }),
    }).catch((e: unknown) => setAssembleError(String(e)));

    // Safety timeout: if cells haven't arrived in 10 min, surface an error.
    timeoutRef.current = setTimeout(() => setTimedOut(true), 10 * 60 * 1000);
  }

  useEffect(() => {
    if (!workflowId || workflowData === undefined || workflowData === null) return;
    if (workflowData.notebookCells.length > 0) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }
    triggerAssembly(workflowData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowData, workflowId]);

  function retryAssembly() {
    if (!workflowData) return;
    assembleTriggered.current = false;
    setTimedOut(false);
    setAssembleError(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    triggerAssembly(workflowData);
  }

  const convexCells = workflowData?.notebookCells ?? [];
  const hasRealCells = convexCells.length > 0;
  const cells: Cell[] = hasRealCells ? fromConvexCells(convexCells) : [];

  function runCell(id: string) {
    setRanCells((prev) => new Set([...prev, id]));
  }

  async function runAll() {
    setRunningAll(true);
    const codeCells = cells.filter((c) => c.type === 'code');
    for (const cell of codeCells) {
      await new Promise((r) => setTimeout(r, 400));
      setRanCells((prev) => new Set([...prev, cell.id]));
    }
    setRunningAll(false);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <NavBar />

      <div className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-3 sticky top-20 z-10">
        <button
          onClick={runAll}
          disabled={runningAll || !hasRealCells}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-60 transition-all"
          style={{ backgroundColor: TEAL }}
        >
          {runningAll ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
          )}
          {runningAll ? 'Running…' : 'Run Code'}
        </button>

        <button
          onClick={() => setShowCode((v) => !v)}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border transition-colors"
          style={{
            borderColor: TEAL,
            color: showCode ? 'white' : TEAL,
            backgroundColor: showCode ? TEAL : 'white',
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" />
          </svg>
          {showCode ? 'Hide Code' : 'View Code'}
        </button>

        <span className="text-xs text-gray-400 ml-auto">
          {hasRealCells
            ? `${ranCells.size}/${cells.filter((c) => c.type === 'code').length} cells run`
            : assembleTriggered.current ? 'Building…' : '—'}
        </span>
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-4 pb-28">
        <div className="bg-gray-100 rounded-2xl px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{workflowName}</h1>
          {intake ? (
            <>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                {intake.inferred_intent}
              </p>
              <IntakeSummaryCard intake={intake} />
            </>
          ) : (
            <p className="text-sm text-gray-500 leading-relaxed">
              Complete the intake form to generate a personalized workflow with your region, date range, and analysis parameters.
            </p>
          )}
        </div>

        {!hasRealCells && workflowData !== undefined && workflowData !== null && !assembleError && !timedOut && (
          <div className="rounded-xl border border-teal-100 bg-teal-50 px-5 py-4 flex items-center gap-4">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent flex-shrink-0 animate-spin"
              style={{ borderColor: `${TEAL} ${TEAL} ${TEAL} transparent` }}
            />
            <div>
              <p className="text-sm font-semibold text-teal-800">Building your workflow…</p>
              <p className="text-xs text-teal-600 mt-0.5">
                The agent is searching notebooks and assembling analysis steps. This may take a few minutes — please do not close this tab.
              </p>
            </div>
          </div>
        )}

        {(assembleError || timedOut) && !hasRealCells && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-red-700">
                {timedOut ? 'Assembly is taking longer than expected' : 'Failed to reach the agent'}
              </p>
              <p className="text-xs text-red-500 mt-1 font-mono">
                {assembleError ?? 'Make sure the Python server is running: python knowledge-base/api_server.py'}
              </p>
            </div>
            <button
              onClick={retryAssembly}
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors"
              style={{ borderColor: TEAL, color: TEAL }}
            >
              Retry
            </button>
          </div>
        )}

        {hasRealCells && cells.map((cell) =>
          cell.type === 'markdown' ? (
            <MarkdownCell key={cell.id} source={cell.source} />
          ) : (
            <CodeCell
              key={cell.id}
              cell={cell}
              showCode={showCode}
              ran={ranCells.has(cell.id)}
              onRun={runCell}
            />
          )
        )}
      </main>

      <button
        onClick={() => setChatOpen((v) => !v)}
        className="fixed bottom-5 right-5 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white z-30 transition-transform hover:scale-105"
        style={{ backgroundColor: TEAL }}
        aria-label="Open assistant"
      >
        {chatOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
        )}
      </button>

      {chatOpen && workflowId && (
        <ChatPanel workflowId={workflowId} intake={intake} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
}
