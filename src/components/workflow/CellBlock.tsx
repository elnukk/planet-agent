// Displays a single notebook cell — supports markdown, code, and data-table output types.
'use strict';

import React, { useState } from 'react';

interface Cell {
  id: string;
  code: string;
  output?: string;
  stderr?: string;
}

interface CellBlockProps {
  cell: Cell;
  onUpdateCode: (id: string, newCode: string) => void;
}

export default function CellBlock({ cell, onUpdateCode }: CellBlockProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [localCell, setLocalCell] = useState<Cell>(cell);
  const [ran, setRan] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setRan(false);

    try {
      const response = await fetch('/api/run-cell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: localCell.code,
          packages: [], // Add packages dynamically here if your interface supports it
        }),
      });

      const data = await response.json();

      // Update local state with whatever the backend returned
      setLocalCell((prev) => ({
        ...prev,
        output: data.stdout,
        stderr: data.stderr,
      }));
    } catch (err) {
      setLocalCell((prev) => ({
        ...prev,
        output: '',
        stderr: 'Network or server initialization failure.',
      }));
    } finally {
      setIsRunning(false);
      setRan(true);
    }
  };

  const isError = 
    localCell.output?.startsWith('Error') || 
    localCell.output?.includes('Traceback') || 
    (localCell.stderr && localCell.stderr.trim().length > 0);

  return (
    <div className="w-full max-w-3xl mx-auto my-4 border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
      {/* Code Input Header */}
      <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-500 font-mono">Python Code Cell</span>
        <button
          onClick={handleRun}
          disabled={isRunning}
          className={`px-3 py-1 rounded text-xs font-medium font-mono text-white shadow-sm transition-colors ${
            isRunning 
              ? 'bg-amber-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isRunning ? 'Running...' : 'Run Cell'}
        </button>
      </div>

      {/* Editor Area */}
      <div className="p-4">
        <textarea
          value={localCell.code}
          onChange={(e) => {
            const val = e.target.value;
            setLocalCell(prev => ({ ...prev, code: val }));
            onUpdateCode(localCell.id, val);
          }}
          className="w-full min-h-[100px] font-mono text-sm p-3 bg-gray-900 text-gray-100 rounded border border-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="# Write your code here... e.g., raise ValueError('test')"
        />
      </div>

      {/* Output Segment matching the specification */}
      {ran && (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
          <span className="text-xs text-gray-400 font-mono block mb-1">Output:</span>
          <pre className={`text-sm font-mono whitespace-pre-wrap ${
            isError ? 'text-red-600' : 'text-gray-800'
          }`}>
            {localCell.output || localCell.stderr || '(no output)'}
          </pre>
        </div>
      )}
    </div>
  );
}