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
      const pkgList = Array.isArray(packages) && packages.length > 0
        ? packages.join(' ')
        : 'planet rasterio numpy pandas matplotlib plotly scikit-learn';
      await sandbox.commands.run(`pip install ${pkgList} -q`);

      await sandbox.files.write('exec_cell.py', code);

      let stdout = '';
      let stderr = '';
      let exitCode = 0;
      try {
        const result = await sandbox.commands.run('python3 exec_cell.py');
        stdout = result.stdout;
        stderr = result.stderr;
        exitCode = result.exitCode;
      } catch (execError: any) {
        stdout = execError.result?.stdout ?? '';
        stderr = execError.result?.stderr ?? execError.message ?? 'Unknown error';
        exitCode = execError.result?.exitCode ?? 1;
      }

      return NextResponse.json({ stdout, stderr, exitCode });
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
