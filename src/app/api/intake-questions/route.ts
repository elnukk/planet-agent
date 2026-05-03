import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
  }

  const { useCase, region, dateRange, planetProduct, singleQuestion, existingQuestions } = await req.json();

  const metadataPath = path.join(process.cwd(), 'knowledge-base', 'data', 'notebooks_metadata.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

  const context = `User context:
- Use case: ${useCase}
- Region: ${region}
- Time range: ${dateRange}
- Planet product: ${planetProduct || 'not specified'}`;

  const prompt = singleQuestion
    ? `You are an assistant helping a user build a satellite data analysis workflow using Planet APIs.

${context}

The user already has these follow-up questions and wants a replacement for one of them:
${(existingQuestions as string[]).map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}

Generate exactly ONE new follow-up question that:
- Is different from all questions listed above
- Helps narrow down the right workflow from this catalog: ${JSON.stringify(Object.keys(metadata))}
- Is plain, conversational, and specific to the user's context

Respond ONLY with a JSON array containing exactly one question string:
["Question?"]`
    : `You are an assistant helping a user build a satellite data analysis
workflow using Planet APIs. The user has told you:
- Use case: ${useCase}
- Region: ${region}
- Time range: ${dateRange}
- Planet product: ${planetProduct || 'not specified'}

Here is a catalog of available workflows:
${JSON.stringify(metadata, null, 2)}

Generate between 3 and 5 follow-up questions that will help you confidently
select and parameterize the right workflow for this user.

Rules:
- Each question should eliminate a large portion of the catalog when answered.
- Do not ask for information already provided above.
- Ask only what is necessary — stop when you have enough to fill the full schema.
- Questions should be plain, conversational, and specific.

Respond ONLY with a JSON array of 3–5 question strings, no explanation, no markdown fences:
["Question 1?", "Question 2?", ...]`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    let raw = (message.content[0] as { type: string; text: string }).text.trim();
    raw = raw.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();

    const questions: string[] = JSON.parse(raw);
    return NextResponse.json({ questions: singleQuestion ? questions.slice(0, 1) : questions.slice(0, 5) });
  } catch (e) {
    console.error('[intake-questions] Anthropic error', e);
    return NextResponse.json({ error: 'Anthropic API call failed' }, { status: 502 });
  }
}
