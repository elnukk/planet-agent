// app/api/run-cell/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Sandbox } from 'e2b';

export async function POST(req: NextRequest) {
  try {
    const { code, packages, userApiKeys } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    // Build env vars from user's saved keys — description is used as the var name
    const userEnvs: Record<string, string> = {};
    if (Array.isArray(userApiKeys)) {
      for (const { description, key } of userApiKeys) {
        if (description && key) userEnvs[description] = key;
      }
    }

    const sandbox = await Sandbox.create({
      apiKey: process.env.E2B_API_KEY,
      envs: {
        // Fallback empty names — overridden by user's profile keys if present
        PL_API_KEY: '',
        PLANET_API_KEY: '',
        ...userEnvs,
      }
    });

    try {
      // 1. Install dependencies
      const pkgList = Array.isArray(packages) && packages.length > 0
        ? packages.join(' ')
        : 'planet rasterio numpy pandas matplotlib plotly scikit-learn';
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
