import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import Anthropic from '@anthropic-ai/sdk';
import { decrypt } from '@/lib/encryption';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

type NotebookCell = { cellType: 'code' | 'markdown' | 'text'; source: string };

type CellEdit = {
  index: number;   // 0-based; use -1 to append a new cell at the end
  cellType: 'code' | 'markdown';
  source: string;
};

type DateRange = { start: string; end: string };

type ChatRequestBody = {
  workflowId: string;
  message: string;
  notebookCells?: NotebookCell[];
};

// Claude only needs to emit the cells that change, not the full notebook.
const EDIT_NOTEBOOK_TOOL: Anthropic.Tool = {
  name: 'edit_notebook',
  description:
    'Apply targeted edits to specific notebook cells, and optionally update workflow metadata like the date range. ' +
    'Call this when the user wants to modify, add, or remove cells, or change dates. ' +
    'Only include the cells that need to change — the server merges them into the full notebook.',
  input_schema: {
    type: 'object' as const,
    properties: {
      edits: {
        type: 'array',
        description:
          'List of cell edits to apply. Each edit targets one cell by its 0-based index. ' +
          'Use index -1 to append a brand-new cell at the end. ' +
          'To delete a cell, set source to the empty string "".',
        items: {
          type: 'object',
          properties: {
            index: {
              type: 'number',
              description: '0-based index of the cell to replace. Use -1 to append.',
            },
            cellType: {
              type: 'string',
              enum: ['code', 'markdown'],
            },
            source: {
              type: 'string',
              description: 'New source content for the cell. Empty string to delete.',
            },
          },
          required: ['index', 'cellType', 'source'],
        },
      },
      dateRange: {
        type: 'object',
        description: 'If the edit changes the analysis date range, provide the new start and end dates (YYYY-MM-DD). This updates the workflow summary header.',
        properties: {
          start: { type: 'string', description: 'Start date in YYYY-MM-DD format.' },
          end:   { type: 'string', description: 'End date in YYYY-MM-DD format.' },
        },
        required: ['start', 'end'],
      },
      regionDescription: {
        type: 'string',
        description: 'If the edit changes the region name or description, provide the new human-readable region name here. This updates the workflow summary header.',
      },
    },
    required: ['edits'],
  },
};

function applyEdits(cells: NotebookCell[], edits: CellEdit[]): NotebookCell[] {
  const result = cells.map((c) => ({ ...c }));

  const appends: NotebookCell[] = [];
  for (const edit of edits) {
    if (edit.index === -1) {
      if (edit.source !== '') appends.push({ cellType: edit.cellType, source: edit.source });
    } else if (edit.index >= 0 && edit.index < result.length) {
      if (edit.source === '') {
        // Mark for deletion
        (result[edit.index] as NotebookCell & { _delete?: boolean })._delete = true;
      } else {
        result[edit.index] = { cellType: edit.cellType, source: edit.source };
      }
    }
  }

  return [
    ...result.filter((c) => !(c as NotebookCell & { _delete?: boolean })._delete),
    ...appends,
  ];
}

function toClaudeMessages(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  latestUserMessage: string,
) {
  const cleaned = messages
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .map((msg) => ({ role: msg.role, content: msg.content }));

  const last = cleaned[cleaned.length - 1];
  if (!last || last.role !== 'user' || last.content !== latestUserMessage) {
    cleaned.push({ role: 'user', content: latestUserMessage });
  }
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { workflowId, message, notebookCells: clientCells } = body;

    if (!workflowId || !message?.trim()) {
      return NextResponse.json({ error: 'workflowId and message are required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 });
    }

    const workflow = await convex.query(api.workflows.getWorkflow, {
      id: workflowId as Id<'workflows'>,
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const workflowUser = await convex.query(api.users.getUser, { id: workflow.userId });
    const planetApiKey = workflowUser?.apiKeyValue ? decrypt(workflowUser.apiKeyValue) : null;

    const currentCells: NotebookCell[] = Array.isArray(clientCells)
      ? clientCells
      : Array.isArray(workflow.notebookCells)
        ? (workflow.notebookCells as NotebookCell[])
        : [];

    const intakeJson = {
      region: workflow.region,
      date_range: workflow.dateRange,
      temporal_resolution: workflow.temporalResolution ?? 'unknown',
      planet_product: workflow.planetProduct,
      use_case: workflow.useCase,
      user_description: workflow.userDescription ?? '',
      inferred_intent: workflow.inferredIntent ?? '',
      constraints: workflow.constraints ?? [],
    };

    // Number cells from 0 so Claude can reference them by index.
    const notebookSource = currentCells.length > 0
      ? currentCells
          .map((cell, i) => {
            const fence = cell.cellType === 'code' ? '```python' : '```markdown';
            return `### Cell ${i} (${cell.cellType})\n${fence}\n${cell.source}\n\`\`\``;
          })
          .join('\n\n')
      : '(No notebook cells assembled yet)';

    const conversation = await convex.query(api.conversations.getConversation, {
      workflowId: workflowId as Id<'workflows'>,
    });

    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `
You are a satellite data workflow assistant for Project Centinela.
Today's date is ${today}.
Planet API authentication: ${planetApiKey ? 'configured' : 'not configured — remind the user to add their key on the Profile page if they want to run cells'}.

You have two modes:
- Q&A: answer questions about the notebook, explain cells, describe what steps do and why.
- Edit: when the user wants to modify, add, or remove notebook cells, call the edit_notebook tool. Only include the cells that change — provide their 0-based index from the notebook below. Then reply with a short description of what you changed.

Rules:
- Be decisive. If you can infer what the user wants, do it immediately. Do not ask for information you already have (today's date, the notebook content, the intake JSON).
- Only ask a clarifying question if the request is genuinely ambiguous and no safe default exists.
- Only call edit_notebook for edits. For questions, just reply in text.
- Keep replies short — 2–4 sentences max.

INTAKE JSON:
${JSON.stringify(intakeJson, null, 2)}

ASSEMBLED NOTEBOOK (cells are 0-indexed):
${notebookSource}
`.trim();

    const history = Array.isArray(conversation) ? conversation : [];
    const claudeMessages = toClaudeMessages(history.slice(-10), message.trim());

    const claudeRes = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools: [EDIT_NOTEBOOK_TOOL],
      messages: claudeMessages,
    });

    const toolUse = claudeRes.content.find(
      (block): block is Anthropic.ToolUseBlock =>
        block.type === 'tool_use' && block.name === 'edit_notebook',
    );

    let editApplied = false;
    if (toolUse) {
      const input = toolUse.input as { edits?: CellEdit[]; dateRange?: DateRange; regionDescription?: string };
      const edits = Array.isArray(input.edits) ? input.edits : [];

      if (edits.length > 0 || input.dateRange || input.regionDescription) {
        const updatedCells = applyEdits(currentCells, edits).map((c) => ({
          cellType: (c.cellType === 'code' ? 'code' : 'markdown') as 'code' | 'markdown',
          source: c.source,
        }));

        await convex.mutation(api.workflows.updateWorkflow, {
          id: workflowId as Id<'workflows'>,
          notebookCells: updatedCells,
          ...(input.dateRange ? { dateRange: input.dateRange } : {}),
          ...(input.regionDescription ? { regionDescription: input.regionDescription } : {}),
        });
        editApplied = true;
      } else {
        console.warn('[api/chat] edit_notebook called but edits was empty:', JSON.stringify(input));
      }
    }

    const textReply = claudeRes.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    const reply =
      textReply ||
      (editApplied
        ? 'Done — the notebook has been updated.'
        : 'I could not generate a response. Please try again.');

    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[api/chat] error:', message);
    return NextResponse.json({ error: `Chat error: ${message}` }, { status: 500 });
  }
}
