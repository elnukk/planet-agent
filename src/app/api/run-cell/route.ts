// app/api/run-cell/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Sandbox } from 'e2b';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const sandbox = await Sandbox.create({ 
      apiKey: process.env.E2B_API_KEY 
    });

    try {
      // UPDATED LINE: Use sandbox.commands.run for newer E2B SDKs
      const result = await sandbox.commands.run(
        `python3 -c ${JSON.stringify(code)}`
      );

      return NextResponse.json({
        stdout: result.stdout,
        stderr: result.stderr,
      });
    } finally {
      await sandbox.kill();
    }
  } catch (error: any) {
    console.error("Sandbox Error:", error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}