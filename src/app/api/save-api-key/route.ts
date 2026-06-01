import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { encrypt } from '@/lib/encryption';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const { userId, apiKeyDescription, apiKeyValue } = await req.json();

  if (!userId || !apiKeyValue?.trim()) {
    return NextResponse.json({ error: 'userId and apiKeyValue are required' }, { status: 400 });
  }

  const encrypted = encrypt(apiKeyValue.trim());

  await convex.mutation(api.users.setApiKey, {
    id: userId as Id<'users'>,
    apiKeyDescription: apiKeyDescription?.trim() || undefined,
    apiKeyValue: encrypted,
  });

  return NextResponse.json({ ok: true });
}
