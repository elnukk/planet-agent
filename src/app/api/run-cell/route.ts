// POST /api/run-cell
//
// Executes a single notebook cell in an isolated E2B sandbox.
// Installs required packages, injects the user's Planet API key as an env var,
// and returns stdout, stderr, and exit code.

import { NextRequest, NextResponse } from 'next/server';
import { Sandbox } from 'e2b';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import type { Id } from '../../../../convex/_generated/dataModel';
import { decrypt } from '@/lib/encryption';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function getApiKey(workflowId: string): Promise<string | null> {
  const workflow = await convex.query(api.workflows.getWorkflow, {
    id: workflowId as Id<'workflows'>,
  });
  if (!workflow) return null;

  const user = await convex.query(api.users.getUser, {
    id: workflow.userId,
  });
  if (!user?.apiKeyValue) return null;

  return decrypt(user.apiKeyValue);
}

export async function POST(req: NextRequest) {
  try {
    const { code, packages, workflowId } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const planetApiKey = workflowId ? await getApiKey(workflowId) : null;

    const sandbox = await Sandbox.create({
      apiKey: process.env.E2B_API_KEY,
      envs: {
        PL_API_KEY: planetApiKey ?? '',
        PLANET_API_KEY: planetApiKey ?? '',
      },
    });

    try {
      const pkgList = Array.isArray(packages) && packages.length > 0
        ? packages.join(' ')
        : 'planet rasterio numpy pandas matplotlib plotly scikit-learn';
      await sandbox.commands.run(`pip install ${pkgList} -q`);

      const envPreamble = planetApiKey
        ? `import os\nos.environ['PL_API_KEY'] = ${JSON.stringify(planetApiKey)}\nos.environ['PLANET_API_KEY'] = ${JSON.stringify(planetApiKey)}\n\n`
        : '';
      await sandbox.files.write('exec_cell.py', envPreamble + code);

      try {
        const result = await sandbox.commands.run('python3 exec_cell.py');
        return NextResponse.json({
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
        });
      } catch (executionError: any) {
        return NextResponse.json({
          stdout: executionError.stdout || '',
          stderr: executionError.stderr || executionError.message || 'Execution failed',
          exitCode: executionError.exitCode || 1,
        });
      }
    } finally {
      await sandbox.kill();
    }
  } catch (error: any) {
    console.error('Sandbox initialization error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
