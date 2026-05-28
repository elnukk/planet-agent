import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
  }

  const {
    useCase, region, dateRange, planetProduct,
    singleQuestion, existingQuestions, replaceIndex,
    previousQA, checkSufficiency, attachedFiles,
  } = await req.json();

  const context = `Already known (do NOT ask about any of these):
- Use case: ${useCase}
- Region: ${region}
- Time range: ${dateRange}
- Planet product: ${planetProduct || 'not specified'}`;

  const prevContext = Array.isArray(previousQA) && previousQA.length > 0
    ? `\n\nWhat the user has already answered:\n${(previousQA as Array<{question: string; answer: string}>)
        .map(({ question, answer }) => `Q: ${question}\nA: ${answer}`)
        .join('\n\n')}`
    : '';

  const asked = (existingQuestions as string[] | undefined) ?? [];
  const targetQuestion = typeof replaceIndex === 'number' ? asked[replaceIndex] : asked[0];
  const otherQuestions = typeof replaceIndex === 'number'
    ? asked.filter((_: string, i: number) => i !== replaceIndex)
    : asked.slice(1);

  const fileContext = Array.isArray(attachedFiles) && attachedFiles.length > 0
    ? `\n\nFiles the user has shared:\n${(attachedFiles as Array<{ name: string; content: string }>)
        .map(({ name, content }) => `[${name}]:\n${content.slice(0, 800)}`)
        .join('\n\n')}`
    : '';

  const systemPrompt = `You are helping generate a Jupyter notebook that uses Planet satellite imagery APIs to fulfill the user's analysis goal. Your job is to ask only the questions whose answers would directly change what code gets written in that notebook.

NEVER ask about:
- Data collection strategies, field visits, or ground truth collection
- Whether the user has existing data or historical records
- Feasibility, data availability, or access constraints
- Temporal resolution, frequency, or date ranges (already set)
- Region or area of interest (already set)
- Which Planet product to use (already set)
- General goals or background context already captured

ONLY ask about things that parameterize the notebook code, such as:
- Specific spectral indices or algorithms to compute (e.g. NDVI vs EVI vs custom band math)
- Output format or deliverables (e.g. GeoTIFF export, CSV statistics, interactive map, charts)
- Thresholds, alert conditions, or classification cutoffs the analysis should apply
- Comparison baselines (e.g. compare to a reference year, a control field, a baseline period)
- Specific crop stages, events, or anomalies to detect or highlight
- Any masking or filtering logic (e.g. cloud threshold, minimum field size)
- Visualization preferences that affect the notebook output (e.g. false color composites, specific color ramps)`;

  const prompt = singleQuestion
    ? `${systemPrompt}

${context}${prevContext}${fileContext}

${typeof replaceIndex === 'number'
  ? `The user wants to replace this question:\n"${targetQuestion}"\n\nThese other questions will stay (do NOT generate something on the same topic as any of these):\n${otherQuestions.map((q: string) => `- ${q}`).join('\n')}\n\nGenerate exactly ONE replacement question that would change what code gets written in the notebook.

Respond ONLY with a JSON array containing exactly one question string:
["Question?"]`
  : checkSufficiency
  ? `Questions already asked (do NOT repeat these topics):\n${asked.length ? asked.map((q: string) => `- ${q}`).join('\n') : '(none yet)'}

Review the information collected. Decide: do you have enough notebook-parameterizing information to write a specific, complete analysis notebook?

Consider it sufficient if you know: what to compute/detect, what outputs to produce, and any key thresholds or comparisons needed.
Consider it insufficient only if a missing answer would cause you to write fundamentally different notebook code.

If sufficient → respond ONLY with: {"done": true}
If one more question is genuinely needed → respond ONLY with a JSON array: ["Question?"]`
  : `Questions already asked (do NOT repeat these topics):\n${asked.length ? asked.map((q: string) => `- ${q}`).join('\n') : '(none yet)'}\n\nGenerate exactly ONE next question whose answer would directly change what code gets written in the notebook.

Respond ONLY with a JSON array containing exactly one question string:
["Question?"]`}`
    : `${systemPrompt}

${context}

Generate between 3 and 5 questions whose answers would directly determine what code gets written in the notebook.

Rules:
- Each question must uncover a different code-level parameter (index/algorithm choice, output format, threshold, baseline, masking logic, visualization).
- Do not ask for information already provided above.
- Questions must be plain, conversational, and specific to the user's context.

Respond ONLY with a JSON array of 3–5 question strings, no explanation, no markdown fences:
["Question 1?", "Question 2?", ...]`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    let raw = (message.content[0] as { type: string; text: string }).text.trim();

    // Strip markdown fences
    raw = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();

    // Extract the first JSON array or object if the model wrapped it in prose
    const arrayMatch = raw.match(/\[[\s\S]*\]/);
    const objectMatch = raw.match(/\{[\s\S]*\}/);
    const extracted = arrayMatch?.[0] ?? objectMatch?.[0] ?? raw;

    let parsed: unknown;
    try {
      parsed = JSON.parse(extracted);
    } catch {
      console.error('[intake-questions] JSON parse failed, raw:', raw);
      // Return a safe fallback rather than a 502 so the UI doesn't hang
      return NextResponse.json({ questions: ['What specific output format do you need — for example, a GeoTIFF export, a CSV summary, or an interactive map?'] });
    }

    // Done signal from sufficiency check
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed as Record<string, unknown>).done === true) {
      return NextResponse.json({ done: true, questions: [] });
    }

    const questions: string[] = Array.isArray(parsed) ? parsed : [];
    return NextResponse.json({ questions: singleQuestion ? questions.slice(0, 1) : questions.slice(0, 5) });
  } catch (e) {
    console.error('[intake-questions] Anthropic error', e);
    return NextResponse.json({ questions: ['What specific output format do you need — for example, a GeoTIFF export, a CSV summary, or an interactive map?'] });
  }
}
