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
      const pkgList = Array.isArray(packages) && packages.length > 0
        ? packages.join(' ')
        : 'planet rasterio numpy matplotlib plotly scikit-learn google-generativeai anthropic';
      await sandbox.commands.run(`pip install ${pkgList} -q`);

      /**
       * 2. Execute User Code
       * We use JSON.stringify to safely escape the code string for the shell.
       */
      // Write the code string cleanly to a file inside the sandbox
      await sandbox.files.write('exec_cell.py', code);

      // Run the script file safely
      const result = await sandbox.commands.run('python3 exec_cell.py');

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