'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useMutation, useQuery } from 'convex/react';
import { api, type Id } from '@/lib/convex';
import planetLogo from '../../dashboard/planetlogo.png';

const TEAL = '#009DA5';

// ─── Mock notebook cells ──────────────────────────────────────────────────────

type CellType = 'markdown' | 'code';

interface Cell {
  id: string;
  type: CellType;
  source: string;
  output?: string;
}

const CELLS: Cell[] = [
  {
    id: 'md-1',
    type: 'markdown',
    source: `## Deforestation Analysis Workflow

This workflow analyzes Planet Labs NICFI satellite imagery to detect and quantify forest cover change over your selected time period. Results include monthly change maps, deforestation hotspots, and area statistics for your region of interest.`,
  },
  {
    id: 'code-1',
    type: 'code',
    source: `import planet
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime

# Initialize authenticated Planet client
client = planet.Session()
print("Planet SDK initialized successfully.")`,
    output: 'Planet SDK initialized successfully.',
  },
  {
    id: 'code-2',
    type: 'code',
    source: `# Define area of interest and analysis parameters
aoi = {
    "type": "Polygon",
    "coordinates": [[
        [-63.2, -3.8], [-63.2, -3.2],
        [-62.6, -3.2], [-62.6, -3.8], [-63.2, -3.8]
    ]]
}

start_date = "2023-01-01"
end_date   = "2023-12-31"
frequency  = "Monthly"

print(f"AOI area: ~3,600 km²")
print(f"Period  : {start_date} → {end_date} ({frequency})")`,
    output: `AOI area: ~3,600 km²\nPeriod  : 2023-01-01 → 2023-12-31 (Monthly)`,
  },
  {
    id: 'code-3',
    type: 'code',
    source: `# Search for available NICFI imagery
search_filter = planet.filters.and_filter(
    planet.filters.date_range("acquired",
        gte=start_date, lte=end_date),
    planet.filters.geom_filter(aoi)
)

results = client.quick_search(
    item_types=["PSScene"],
    filter=search_filter
)
print(f"Found {len(results)} scenes across the period")`,
    output: 'Found 47 scenes across the period',
  },
  {
    id: 'md-2',
    type: 'markdown',
    source: `### Change Detection

The NDVI difference method compares vegetation index values between time steps to identify areas of significant forest loss (NDVI Δ < −0.15).`,
  },
  {
    id: 'code-4',
    type: 'code',
    source: `# Compute monthly NDVI and flag loss pixels
ndvi_stack = compute_monthly_ndvi(results, aoi)
loss_mask  = (ndvi_stack.diff(dim="time") < -0.15)

total_loss_ha = float(loss_mask.sum()) * 0.09   # 30 m pixels → ha
print(f"Estimated forest loss: {total_loss_ha:,.0f} ha")
print(f"Peak loss month      : August 2023")`,
    output: `Estimated forest loss: 4,217 ha\nPeak loss month      : August 2023`,
  },
  {
    id: 'code-5',
    type: 'code',
    source: `# Export summary statistics
summary = pd.DataFrame({
    "Month"       : pd.date_range(start_date, periods=12, freq="MS"),
    "Loss_ha"     : [142,98,211,334,487,612,389,741,523,298,186,196],
    "Cumulative_ha": np.cumsum([142,98,211,334,487,612,389,741,523,298,186,196])
})
summary.to_csv("deforestation_summary_2023.csv", index=False)
print("Summary exported.")`,
    output: 'Summary exported.',
  },
];

// ─── Chat messages ────────────────────────────────────────────────────────────

const BOT_REPLIES = [
  'I can help you refine the analysis parameters. What would you like to adjust?',
  'Based on the NDVI results, the August spike aligns with the dry season when slash-and-burn activity peaks.',
  'You can narrow the AOI or extend the date range. Would you like me to regenerate the workflow cells?',
  'The 4,217 ha estimate uses 30 m resolution. For higher precision, try the 3 m PlanetScope product.',
  'Happy to add a cloud-masking step — cloud cover is a common source of false positives in this region.',
];

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavBar() {
  const router = useRouter();
  return (
    <header className="bg-black h-20 flex items-center flex-shrink-0 sticky top-0 z-20 relative">
      <button onClick={() => router.push('/dashboard')} className="flex-shrink-0 ml-2">
        <div className="relative h-20 w-20">
          <Image src={planetLogo} alt="Planet logo" fill className="object-contain" />
        </div>
      </button>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tracking-wide text-white pointer-events-none">
        Project Centinela
      </span>
      <div className="ml-auto flex-shrink-0 pr-4 flex items-center gap-2">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-white text-sm font-medium border border-white/60 rounded-full px-4 py-1.5 hover:bg-white hover:text-black transition-colors"
        >
          Home
        </button>
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
        if (!line.trim()) return <br key={i} />;
        return <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>;
      })}
    </div>
  );
}

function CodeCell({
  cell,
  showCode,
  ran,
  onRun,
}: {
  cell: Cell;
  showCode: boolean;
  ran: boolean;
  onRun: (id: string) => void;
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

function ChatPanel({ workflowId, onClose }: { workflowId: Id<'workflows'>; onClose: () => void }) {
  const storedMessages = useQuery(api.conversations.getConversation, { workflowId });
  const sendMessage = useMutation(api.conversations.sendMessage);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [storedMessages]);

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    await sendMessage({ workflowId, role: 'user', content: text });
    await sendMessage({
      workflowId,
      role: 'assistant',
      content: BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)],
    });
  }

  return (
    <div className="fixed bottom-20 right-4 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col z-30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100" style={{ backgroundColor: TEAL }}>
        <span className="text-white text-sm font-semibold">Centinela Workflow Assistant</span>
        <button onClick={onClose} className="text-white hover:opacity-70 transition-opacity">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-72">
        {(!storedMessages || storedMessages.length === 0) && (
          <div className="flex justify-start">
            <div className="text-sm px-3 py-2 rounded-2xl max-w-[85%] leading-snug bg-gray-100 text-gray-800 rounded-bl-sm">
              Hi! I&apos;m the Project Centinela workflow assistant. Ask me anything about this workflow.
            </div>
          </div>
        )}
        {(storedMessages ?? []).map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`text-sm px-3 py-2 rounded-2xl max-w-[85%] leading-snug ${
                msg.role === 'user'
                  ? 'text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
              style={msg.role === 'user' ? { backgroundColor: TEAL } : {}}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
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
          disabled={!input.trim()}
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WorkflowPage({ params }: { params: { id: string } }) {
  const workflowId = params.id as Id<'workflows'>;
  const workflow = useQuery(api.workflows.getWorkflow, { id: workflowId });
  const [showCode, setShowCode] = useState(true);
  const [ranCells, setRanCells] = useState<Set<string>>(new Set());
  const [runningAll, setRunningAll] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  function runCell(id: string) {
    setRanCells((prev) => new Set([...prev, id]));
  }

  async function runAll() {
    setRunningAll(true);
    const notebookCells = workflow?.notebookCells?.length ? workflow.notebookCells : [];
    const codeCells = notebookCells.length
      ? notebookCells
          .map((c, idx) => ({ idx, cell: c }))
          .filter(({ cell }) => cell.cell_type === 'code')
      : CELLS.map((c, idx) => ({ idx, cell: c })).filter(({ cell }) => cell.type === 'code');

    for (const cell of codeCells) {
      await new Promise((r) => setTimeout(r, 400));
      setRanCells((prev) => new Set([...prev, String(cell.idx)]));
    }
    setRunningAll(false);
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <NavBar />

      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-white px-6 py-3 flex items-center gap-3 sticky top-14 z-10">
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
          {ranCells.size}/
          {(workflow?.notebookCells?.length
            ? workflow.notebookCells.filter((c) => c.cell_type === 'code').length
            : CELLS.filter((c) => c.type === 'code').length)}{' '}
          cells run
        </span>
      </div>

      {/* Notebook body */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 space-y-4 pb-28">
        {/* Intro card */}
        <div className="bg-gray-100 rounded-2xl px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900 mb-1">{workflow?.name ?? 'Workflow'}</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            This notebook uses Planet Labs NICFI basemaps and PlanetScope imagery to detect forest cover
            change within your region of interest. Run all cells sequentially, or execute individual
            cells to inspect intermediate outputs. Use the assistant at the bottom-right for help.
          </p>
        </div>

        {/* Cells */}
        {workflow === undefined ? (
          <div className="min-h-[240px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (workflow?.notebookCells?.length ?? 0) > 0 ? (
          workflow!.notebookCells.map((cell, idx) =>
            cell.cell_type === 'markdown' ? (
              <MarkdownCell key={idx} source={cell.source} />
            ) : (
              <CodeCell
                key={idx}
                cell={{ id: String(idx), type: 'code', source: cell.source }}
                showCode={showCode}
                ran={ranCells.has(String(idx))}
                onRun={runCell}
              />
            )
          )
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-5 text-sm text-gray-600">
              No notebook cells have been generated for this workflow yet. Showing a demo notebook.
            </div>
            {CELLS.map((cell) =>
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
          </>
        )}
      </main>

      {/* Chatbot FAB */}
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

      {chatOpen && <ChatPanel workflowId={workflowId} onClose={() => setChatOpen(false)} />}
    </div>
  );
}
