// app/api/run-cell/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Sandbox } from 'e2b';

export async function POST(req: NextRequest) {
  try {
    const { code, packages } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const sandbox = await Sandbox.create({
      apiKey: process.env.E2B_API_KEY,
      envs: {
        PLANET_API_KEY: process.env.PLANET_API_KEY || '',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
      }
    });

    try {
      // 1. Install dependencies
      const pkgList = Array.isArray(packages) && packages.length > 0
        ? packages.join(' ')
        : 'planet rasterio numpy matplotlib plotly scikit-learn google-generativeai anthropic';
      await sandbox.commands.run(`pip install ${pkgList} -q`);

      // 2. Write the code string cleanly to a file inside the sandbox
      await sandbox.files.write('exec_cell.py', code);

      try {
        // 3. Execute user code file safely
        const result = await sandbox.commands.run('python3 exec_cell.py');

        return NextResponse.json({
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
        });
      } catch (executionError: any) {
        // Intercept runtime exceptions (like raise ValueError) instead of crashing the API route
        console.log("Python execution failed. Extracting stderr traceback strings gracefully...");
        
        return NextResponse.json({
          stdout: executionError.stdout || '',
          stderr: executionError.stderr || executionError.message || 'Execution failed',
          exitCode: executionError.exitCode || 1,
        });
      }
    } finally {
      // 4. Always kill the sandbox to prevent billing leaks
      await sandbox.kill();
    }
  } catch (error: any) {
    // This only catches global infrastructure/network issues initializing the sandbox environment
    console.error("Sandbox Initialization Error:", error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}