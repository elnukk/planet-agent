import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const PYTHON_API = process.env.PYTHON_API_URL ?? 'http://127.0.0.1:8001';

type RawCell = { cell_type: string; source: string | string[]; metadata?: unknown };
type SourceNotebook = { filename: string; cellIndex: number; content: string };

function toCellType(raw: string): 'code' | 'markdown' | 'text' {
  if (raw === 'code') return 'code';
  if (raw === 'markdown') return 'markdown';
  return 'text';
}

function cellSource(raw: string | string[]): string {
  return Array.isArray(raw) ? raw.join('') : raw;
}

async function runAssembly(intake: unknown, workflowId: string): Promise<void> {
  const pyRes = await fetch(`${PYTHON_API}/assemble`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intake }),
  });

  if (!pyRes.ok) {
    const detail = await pyRes.text();
    throw new Error(`Agent returned ${pyRes.status}: ${detail}`);
  }

  const pyData = (await pyRes.json()) as {
    cells: RawCell[];
    sourceNotebooks: SourceNotebook[];
  };

  const notebookCells = pyData.cells.map((c) => ({
    cellType: toCellType(c.cell_type),
    source: cellSource(c.source),
  }));

  const sourceNotebooks = (pyData.sourceNotebooks ?? []).map((s) => ({
    filename: s.filename,
    cellIndex: s.cellIndex,
    content: s.content ?? '',
  }));

  await convex.mutation(api.workflows.updateWorkflow, {
    id: workflowId as Id<'workflows'>,
    notebookCells,
    sourceNotebooks,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { intake, workflowId } = body as { intake: unknown; workflowId: string };

  if (!intake || !workflowId) {
    return NextResponse.json({ error: 'intake and workflowId required' }, { status: 400 });
  }

  // Return immediately — assembly runs in the background.
  // The workflow page loading state is driven by Convex's reactive notebookCells query,
  // so it updates automatically when runAssembly writes to Convex.
  runAssembly(intake, workflowId).catch((e) =>
    console.error('[assemble-workflow] background error:', e),
  );

  return NextResponse.json({ ok: true, status: 'assembling' });
}
