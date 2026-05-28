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

  const context = `User context:
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

  const prompt = singleQuestion
    ? `You are an assistant helping a user build a satellite data analysis workflow using Planet APIs.

${context}${prevContext}${fileContext}

${typeof replaceIndex === 'number'
  ? `The user wants to replace this question:\n"${targetQuestion}"\n\nThese other questions will stay (do NOT generate something on the same topic as any of these):\n${otherQuestions.map((q: string) => `- ${q}`).join('\n')}\n\nGenerate exactly ONE replacement question.

The question must be plain, conversational, and specific to the user's context.

Respond ONLY with a JSON array containing exactly one question string:
["Question?"]`
  : checkSufficiency
  ? `Questions already asked (do NOT repeat these topics):\n${asked.length ? asked.map((q: string) => `- ${q}`).join('\n') : '(none yet)'}

Review the information collected. You now know the use case, region, time range, product, and the user's answers above.

Decide: do you have enough information to build a comprehensive, specific satellite analysis workflow?
Consider it sufficient if you understand: the analysis goal, what outputs/deliverables are needed, any comparison baseline or thresholds, and key constraints or existing data.
Consider it insufficient if a critical unknown would significantly change the workflow design.

If sufficient → respond ONLY with: {"done": true}
If one more question is genuinely needed → respond ONLY with a JSON array: ["Question?"]`
  : `Questions already asked (do NOT repeat these topics):\n${asked.length ? asked.map((q: string) => `- ${q}`).join('\n') : '(none yet)'}\n\nGenerate exactly ONE next follow-up question.

The question must:
- Be informed by the user's answers above (if any)
- Cover an aspect not yet addressed
- Be plain, conversational, and specific to the user's context

Respond ONLY with a JSON array containing exactly one question string:
["Question?"]`}`
    : `You are an assistant helping a user build a satellite data analysis workflow using Planet APIs.

${context}

Generate between 3 and 5 follow-up questions that will help clarify exactly what this user needs.

Rules:
- Each question should uncover a different aspect of the user's requirements (e.g. output format, alert thresholds, comparison baseline, priority species/indicators, access constraints).
- Do not ask for information already provided above.
- Questions should be plain, conversational, and specific to the user's context.

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
    raw = raw.replace(/^```(?:json)?/, '').replace(/```$/, '').trim();

    // Check for done signal from sufficiency check
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.done === true) {
        return NextResponse.json({ done: true, questions: [] });
      }
    } catch {}

    const questions: string[] = JSON.parse(raw);
    return NextResponse.json({ questions: singleQuestion ? questions.slice(0, 1) : questions.slice(0, 5) });
  } catch (e) {
    console.error('[intake-questions] Anthropic error', e);
    return NextResponse.json({ error: 'Anthropic API call failed' }, { status: 502 });
  }
}
