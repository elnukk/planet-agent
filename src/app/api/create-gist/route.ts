// POST /api/create-gist
//
// Converts assembled notebook cells to .ipynb format and publishes them as a
// GitHub Gist. Returns a Google Colab URL so the user can open and run the notebook.

import { NextRequest, NextResponse } from 'next/server';

interface Cell {
  cellType: string;
  source: string;
}

function buildIpynb(cells: Cell[]) {
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
      language_info: { name: 'python', version: '3.10.0' },
    },
    cells: cells.map((cell) => {
      const lines = cell.source.split('\n');
      const source = lines.map((line, i) => (i < lines.length - 1 ? line + '\n' : line));
      if (cell.cellType === 'code') {
        return { cell_type: 'code', execution_count: null, metadata: {}, outputs: [], source };
      }
      return { cell_type: 'markdown', metadata: {}, source };
    }),
  };
}

export async function POST(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN is not set' }, { status: 500 });
  }

  const { cells, name } = await req.json() as { cells: Cell[]; name: string };
  const filename = `${name.replace(/\s+/g, '_').toLowerCase()}.ipynb`;

  const gistRes = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({
      description: name,
      public: true,
      files: { [filename]: { content: JSON.stringify(buildIpynb(cells), null, 2) } },
    }),
  });

  if (!gistRes.ok) {
    const err = await gistRes.text();
    console.error('GitHub Gist error', gistRes.status, err);
    return NextResponse.json({ error: err, status: gistRes.status }, { status: gistRes.status });
  }

  const gist = await gistRes.json() as { id: string; owner: { login: string } };
  return NextResponse.json({ url: `https://colab.research.google.com/gist/${gist.owner.login}/${gist.id}` });
}
