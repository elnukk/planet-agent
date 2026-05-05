import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ name: null, imageDataUrl: null });
  }

  const { useCase, region } = await req.json();

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 32,
      messages: [
        {
          role: 'user',
          content: `Create a concise 3–6 word title for a satellite data analysis workflow.
Use Title Case. Skip articles and prepositions under 4 letters.
Use case: ${useCase}
Region: ${region}
Examples: "Amazon Deforestation Monitor", "Nile Delta Crop Tracker", "Arctic Ice Change Analysis"
Respond with ONLY the title — no quotes, no punctuation, no explanation.`,
        },
      ],
    });

    const name = (message.content[0] as { type: string; text: string }).text.trim();
    return NextResponse.json({ name, imageDataUrl: null });
  } catch (e) {
    console.error('[generate-workflow] Anthropic error', e);
    return NextResponse.json({ name: null, imageDataUrl: null });
  }
}
