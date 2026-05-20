import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import Anthropic from '@anthropic-ai/sdk';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

type ChatRequestBody = {
  workflowId: string;
  message: string;
  planetApiKey?: string;
};

function toClaudeMessages(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  latestUserMessage: string,
) {
  const cleaned = messages
    .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
    .map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

  const last = cleaned[cleaned.length - 1];

  if (!last || last.role !== 'user' || last.content !== latestUserMessage) {
    cleaned.push({
      role: 'user',
      content: latestUserMessage,
    });
  }

  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { workflowId, message, planetApiKey } = body;

    if (!workflowId || !message?.trim()) {
      return NextResponse.json(
        { error: 'workflowId and message are required' },
        { status: 400 },
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 },
      );
    }

    const workflow = await convex.query(api.workflows.getWorkflow, {
      id: workflowId as Id<'workflows'>,
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 },
      );
    }

    const conversation = await convex.query(api.conversations.getConversation, {
      workflowId: workflowId as Id<'workflows'>,
    });

    const intakeJson = {
      use_case: workflow.useCase,
      planet_product: workflow.planetProduct,
      region: workflow.region,
      date_range: workflow.dateRange,
      temporal_resolution: workflow.temporalResolution ?? '',
      user_description: workflow.userDescription ?? '',
      inferred_intent: workflow.inferredIntent ?? '',
      constraints: workflow.constraints ?? [],
    };

    const notebookSource = (workflow.notebookCells ?? [])
      .map((cell: { cellType: string; source: string }) =>
        cell.cellType === 'code'
          ? `\`\`\`python\n${cell.source}\n\`\`\``
          : cell.source,
      )
      .join('\n\n');

    const planetAuthLine = planetApiKey
      ? 'PLANET AUTH STATUS: The user is authenticated with Planet (API key provided). You may reference Planet API capabilities and data access as available to them.'
      : 'PLANET AUTH STATUS: The user has not provided a Planet API key. Remind them to add one in their profile if they need to access Planet data directly.';

    const systemPrompt = `
You are a satellite data workflow assistant for Project Centinela.

You answer questions about this specific satellite data workflow. The user is looking at an assembled notebook generated from Planet or satellite-data workflow cells.

Use the intake JSON and assembled notebook source below as your source of truth. Be specific to this workflow. When helpful, refer to relevant notebook steps, parameters, data products, date ranges, AOI/region details, and code cells.

Do not invent cells, files, outputs, credentials, or results that are not present. If the notebook does not contain enough information, say what is missing and suggest a concrete next step.

${planetAuthLine}

INTAKE JSON:
${JSON.stringify(intakeJson, null, 2)}

ASSEMBLED NOTEBOOK:
${notebookSource}
`.trim();

    const claudeMessages = toClaudeMessages(conversation, message.trim());

    const claudeRes = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 900,
      system: systemPrompt,
      messages: claudeMessages,
    });

    const reply =
      claudeRes.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .trim() ||
      'I could not generate a response. Please try asking your question again.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('[api/chat] error:', error);

    return NextResponse.json(
      { error: 'Failed to generate chat reply' },
      { status: 500 },
    );
  }
}
