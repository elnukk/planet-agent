import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
  }

  const { useCase, region, dateRange } = await req.json();

  const metadataPath = path.join(process.cwd(), 'knowledge-base', 'data', 'notebooks_metadata.json');
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

  const prompt = `You are an assistant helping a user build a satellite data analysis
workflow using Planet APIs. The user has told you:
- Use case: ${useCase}
- Region: ${region}
- Time range: ${dateRange}

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

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  if (!geminiRes.ok) {
    const errBody = await geminiRes.text();
    console.error('[intake-questions] Gemini error', geminiRes.status, errBody);
    return NextResponse.json({ error: 'Gemini API call failed', detail: errBody }, { status: 502 });
  }

  const geminiData = await geminiRes.json();
  let raw: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';

  // Strip accidental markdown fences (same as intake_bot.py)
  raw = raw.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();

  const questions: string[] = JSON.parse(raw);
  return NextResponse.json({ questions: questions.slice(0, 5) });
}
