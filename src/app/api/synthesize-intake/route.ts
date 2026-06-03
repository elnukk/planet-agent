// POST /api/synthesize-intake
//
// Converts the user's intake conversation (Q&A pairs + form fields) into the
// structured intake JSON consumed by the Python assembly pipeline.

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ intake: null });

  const { useCaseDescription, region, startDate, endDate, frequency, planetProduct, questions, answers } =
    await req.json();

  const conversationLines = [
    `Use case: ${useCaseDescription}`,
    `Region: ${region}`,
    `Date range: ${startDate} to ${endDate} (${frequency})`,
    `Planet product: ${planetProduct}`,
    ...(questions as string[]).map((q: string, i: number) => `Q: ${q}\nA: ${(answers as string[])[i] || '(no answer)'}`),
  ].join('\n');

  const prompt = `You are synthesizing a satellite data analysis intake form from a conversation.

Here is the full conversation:
${conversationLines}

Based solely on what the user said, produce a JSON object with exactly these fields:

{
  "region": {
    "type": "Feature",
    "properties": {},
    "geometry": {
      "type": "Polygon",
      "coordinates": []
    },
    "description": "<human-readable description of the region the user mentioned>"
  },
  "date_range": {
    "start": "${startDate}",
    "end": "${endDate}"
  },
  "temporal_resolution": "<infer from context: daily | weekly | biweekly | monthly | seasonal | unknown>",
  "planet_product": "<exact product name the user mentioned>",
  "use_case": "<short label for the analytical use case, e.g. 'bare soil detection'>",
  "user_description": "<faithful condensation of what the user described>",
  "inferred_intent": "<one sentence describing what the user is ultimately trying to achieve>",
  "constraints": ["<constraint 1>", "<constraint 2>"]
}

Rules:
- For region.geometry.coordinates: leave as empty array [] — the user provided a place name, not a bounding box.
- For date_range: use exactly ${startDate} and ${endDate}.
- For constraints: infer from context (cloud cover needs, resolution requirements, delivery format, etc).
- Respond with valid JSON only — no markdown fences, no explanation.`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    let raw = (message.content[0] as { type: string; text: string }).text.trim();
    raw = raw.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();
    const intake = JSON.parse(raw);
    return NextResponse.json({ intake });
  } catch (e) {
    console.error('[synthesize-intake] Anthropic error', e);
    return NextResponse.json({ intake: null });
  }
}
