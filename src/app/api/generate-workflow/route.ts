import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ name: null, imageDataUrl: null });
  }

  const { useCase, region } = await req.json();

  const [nameResult, imageResult] = await Promise.allSettled([
    generateName(apiKey, useCase, region),
    generateImage(apiKey, useCase, region),
  ]);

  return NextResponse.json({
    name: nameResult.status === 'fulfilled' ? nameResult.value : null,
    imageDataUrl: imageResult.status === 'fulfilled' ? imageResult.value : null,
  });
}

async function generateName(apiKey: string, useCase: string, region: string): Promise<string> {
  const prompt = `Create a concise 3–6 word title for a satellite data analysis workflow.
Use Title Case. Skip articles and prepositions under 4 letters.
Use case: ${useCase}
Region: ${region}
Examples: "Amazon Deforestation Monitor", "Nile Delta Crop Tracker", "Arctic Ice Change Analysis"
Respond with ONLY the title — no quotes, no punctuation, no explanation.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) {
    const errBody = await res.text();
    console.error('[generate-workflow/name] Gemini error', res.status, errBody);
    throw new Error(`Gemini name error ${res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
}

async function generateImage(apiKey: string, useCase: string, region: string): Promise<string | null> {
  const useCaseShort = useCase.trim().split(/\s+/).slice(0, 8).join(' ');
  const prompt = `Aerial satellite photograph of ${region}, ${useCaseShort}, earth observation remote sensing imagery, photorealistic, high resolution, professional satellite image`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: '1:1' },
      }),
    }
  );
  if (!res.ok) {
    const errBody = await res.text();
    console.error('[generate-workflow/image] Imagen error', res.status, errBody);
    return null;
  }
  const data = await res.json();
  const b64: string | undefined = data.predictions?.[0]?.bytesBase64Encoded;
  const mime: string = data.predictions?.[0]?.mimeType ?? 'image/png';
  return b64 ? `data:${mime};base64,${b64}` : null;
}
