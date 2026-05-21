import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return NextResponse.json({ reply: null }, { status: 500 });

  const { message, context, hasApiKey } = await req.json() as {
    message: string;
    context?: string;
    hasApiKey?: boolean;
  };

  if (!message?.trim()) return NextResponse.json({ reply: null }, { status: 400 });

  const client = new Anthropic({ apiKey: anthropicKey });

  const systemPrompt = [
    'You are a helpful satellite data analysis assistant for Project Centinela.',
    context ? `Workflow context: ${context}` : '',
    hasApiKey
      ? 'The user has a valid Planet API key configured and can execute workflow cells.'
      : 'The user has not yet added a Planet API key. If they ask about running or executing code, remind them to add their Planet API key on the profile page first.',
    'Keep responses concise and focused on satellite imagery analysis, Python notebooks, and Planet data products.',
    'Never ask for, repeat, or reference any API key values.',
  ].filter(Boolean).join('\n');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: 'user', content: message }],
  });

  const reply = response.content[0]?.type === 'text' ? response.content[0].text : null;

  return NextResponse.json({ reply });
}
