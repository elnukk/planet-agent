// app/api/run-cell/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Sandbox } from 'e2b';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    // Initialize the sandbox with your API keys passed into the environment
    const sandbox = await Sandbox.create({ 
      apiKey: process.env.E2B_API_KEY,
      envs: {
        PLANET_API_KEY: process.env.PLANET_API_KEY || '',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
      }
    });

    try {
      /**
       * 1. Install Dependencies
       * Note: 'os', 'json', 'time', and 'collections' are built-in to Python.
       * We install the third-party libraries needed for Planet and analysis.
       */
      await sandbox.commands.run(
        'pip install planet rasterio numpy matplotlib plotly scikit-learn google-generativeai anthropic -q'
      );

      /**
       * 2. Execute User Code
       * We use JSON.stringify to safely escape the code string for the shell.
       */
      const result = await sandbox.commands.run(
        `python3 -c ${JSON.stringify(code)}`
      );

      return NextResponse.json({
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      });
    } finally {
      // 3. Always kill the sandbox to prevent billing leaks
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