'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import planetLogo from '../../dashboard/planetlogo.png';
import { getWorkflowIntake, type IntakeJSON } from '@/lib/workflowIntake';
import { getUserWorkflows } from '@/lib/auth';
import { getCurrentUser } from '@/lib/auth';

const TEAL = '#009DA5';

type CellType = 'markdown' | 'code';

interface Cell {
  id: string;
  type: CellType;
  source: string;
  output?: string;
}

function buildCells(intake: IntakeJSON | null): Cell[] {
  if (!intake) return PLACEHOLDER_CELLS;

  const regionDesc = intake.region?.description || 'the specified region';
  const dateStart = intake.date_range?.start || '—';
  const dateEnd = intake.date_range?.end || '—';
  const product = intake.planet_product || 'Planet imagery';
  const useCase = intake.use_case || 'satellite data analysis';

  return [
    {
      id: 'md-intro',
      type: 'markdown',
      source: `## ${intake.use_case ? intake.use_case.charAt(0).toUpperCase() + intake.use_case.slice(1) : 'Satellite Analysis'} Workflow\n\n${intake.inferred_intent || `This workflow analyzes ${product} imagery for ${useCase} in ${regionDesc}.`}${intake.constraints?.length ? `\n\n**Constraints:** ${intake.constraints.join(' · ')}` : ''}`,
    },
    {
      id: 'code-auth',
      type: 'code',
      source: `import planet
import numpy as np
import matplotlib.pyplot as plt

# Initialize authenticated Planet client
client = planet.Session()
print("Planet SDK initialized successfully.")`,
      output: 'Planet SDK initialized successfully.',
    },
    {
      id: 'code-aoi',
      type: 'code',
      source: `# Area of interest: ${regionDesc}
aoi_description = "${regionDesc}"

# Date range from intake
start_date = "${dateStart}"
end_date   = "${dateEnd}"
product    = "${product}"

print(f"Region  : {aoi_description}")
print(f"Period  : {start_date} → {end_date}")
print(f"Product : {product}")`,
      output: `Region  : ${regionDesc}\nPeriod  : ${dateStart} → ${dateEnd}\nProduct : ${product}`,
    },
    {
      id: 'code-search',
      type: 'code',
      source: `# Search for available ${product} imagery
search_filter = planet.filters.and_filter(
    planet.filters.date_range("acquired",
        gte=start_date, lte=end_date),
    planet.filters.geom_filter(aoi)
)

results = client.quick_search(
    item_types=["PSScene"],
    filter=search_filter
)
print(f"Found {{len(results)}} scenes across the period")`,
      output: 'Found scenes — run to query live results',
    },
    {
      id: 'md-analysis',
      type: 'markdown',
      source: `### Analysis\n\nThe next cells perform the core ${useCase} analysis over ${regionDesc} using ${product} data from ${dateStart} to ${dateEnd}.`,
    },
    {
      id: 'code-analysis',
      type: 'code',
      source: `# Core analysis: ${useCase}
# TODO: implement analysis logic based on your intake parameters
# Constraints to consider: ${intake.constraints?.join(', ') || 'none specified'}

print("Ready to run analysis.")`,
      output: 'Ready to run analysis.',
    },
  ];
}

const PLACEHOLDER_CELLS: Cell[] = [
  {
    id: 'md-1',
    type: 'markdown',
    source: `## Satellite Analysis Workflow\n\nThis workflow was created without intake data. Complete the intake form to generate a personalized workflow.`,
  },
  {
    id: 'code-1',
    type: 'code',
    source: `import planet
client = planet.Session()
print("Planet SDK initialized successfully.")`,
    output: 'Planet SDK initialized successfully.',
  },
];

interface Message {
  role: 'user' | 'bot';
  text: string;
}

const BOT_REPLIES = [
  'I can help you refine the analysis parameters. What would you like to adjust?',
  'Based on your intake, I can suggest additional preprocessing steps. Would you like me to add them?',
  'You can narrow the AOI or extend the date range. Would you like me to regenerate the workflow cells?',
  'Happy to add a cloud-masking step — cloud cover is a common source of false positives.',
  'The constraints from your intake have been factored into the workflow structure.',
];

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

function ChatPanel({ intake, onClose }: { intake: IntakeJSON | null; onClose: () => void }) {
  const context = intake
    ? `Use case: ${intake.use_case}. Region: ${intake.region?.description}. Product: ${intake.planet_product}. Intent: ${intake.inferred_intent}.`
    : '';

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: intake
        ? `Hi! I'm the Project Centinela assistant. I can see your workflow is for ${intake.use_case || 'satellite analysis'} in ${intake.region?.description || 'your region'}. How can I help?`
        : "Hi! I'm the Project Centinela workflow assistant. Ask me anything about this analysis.",
    },
  ]);
  const [input, setInput] = useState('');
  const [replyIdx, setReplyIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    const apiKey = (window as Window & { __GEMINI_KEY__?: string }).__GEMINI_KEY__;
    if (!apiKey) {
      // fallback to canned replies if no key in window
      setTimeout(() => {
        setMessages((m) => [...m, { role: 'bot', text: BOT_REPLIES[replyIdx % BOT_REPLIES.length] }]);
        setReplyIdx((i) => i + 1);
        setLoading(false);
      }, 700);
      return;
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: 'bot', text: data.reply || BOT_REPLIES[replyIdx % BOT_REPLIES.length] }]);
      setReplyIdx((i) => i + 1);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: BOT_REPLIES[replyIdx % BOT_REPLIES.length] }]);
      setReplyIdx((i) => i + 1);
    } finally {
      setLoading(false);
    }
  }

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
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`text-sm px-3 py-2 rounded-2xl max-w-[85%] leading-snug ${
                msg.role === 'user' ? 'text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
              style={msg.role === 'user' ? { backgroundColor: TEAL } : {}}
            >
              {msg.text}
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

  const [intake, setIntake] = useState<IntakeJSON | null>(null);
  const [workflowName, setWorkflowName] = useState('Workflow');
  const [showCode, setShowCode] = useState(true);
  const [ranCells, setRanCells] = useState<Set<string>>(new Set());
  const [runningAll, setRunningAll] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!workflowId) return;
    const stored = getWorkflowIntake(workflowId);
    setIntake(stored);

    const user = getCurrentUser();
    if (user) {
      const wf = getUserWorkflows(user.id).find((w) => w.id === workflowId);
      if (wf) setWorkflowName(wf.name);
    }
  }, [workflowId]);

  const cells = mounted ? buildCells(intake) : PLACEHOLDER_CELLS;

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
          disabled={runningAll}
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
          {ranCells.size}/{cells.filter((c) => c.type === 'code').length} cells run
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

        {cells.map((cell) =>
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

      {chatOpen && <ChatPanel intake={intake} onClose={() => setChatOpen(false)} />}
    </div>
  );
}
