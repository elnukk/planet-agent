"use client";

import { useMemo, useState } from "react";

const fontFamily = '"Encode Sans Expanded", system-ui, sans-serif';

function PlanetMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10">
        <div className="h-3.5 w-3.5 rounded-full bg-white" />
      </div>
      <div className="leading-tight">
        <div className="text-[10px] font-semibold tracking-[0.42em] text-white/80">PLANET LABS</div>
        <div className="text-[10px] tracking-[0.28em] text-white/50">DATA FOR GOOD</div>
      </div>
    </div>
  );
}

function TopHeader() {
  return (
    <header className="border-b border-white/10 bg-black text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <PlanetMark />
        <div className="text-lg font-semibold tracking-wide">Centinela</div>
        <button className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white/90 shadow-sm">
          DT
        </button>
      </div>
    </header>
  );
}

function NotebookCell({
  title,
  children,
  tone = "default",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "default" | "muted" | "code";
}) {
  return (
    <div
      className={[
        "rounded-[28px] border p-5 shadow-sm",
        tone === "code" ? "border-gray-300 bg-[#fbfbfb]" : tone === "muted" ? "border-gray-200 bg-gray-50" : "border-gray-200 bg-white",
      ].join(" ")}
    >
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">{title}</div>
      {children}
    </div>
  );
}

export default function NotebookMockup() {
  const [showCode, setShowCode] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi — I can help explain the notebook layout, but this prototype does not connect to a real model." },
  ]);

  const codeSample = useMemo(
    () => `# Project Centinela
# Notebook-style prototype for conservation analysis

region = "Madre de Dios, Peru"
timeframe = ("2025-01-01", "2025-06-30")
frequency = "Weekly"

print("Preparing Planet data workflow...")
`,
    []
  );

  const sendMessage = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed },
      { role: "assistant", text: "Mock assistant reply: this is a UI-only chat panel with canned guidance." },
    ]);
    setDraft("");
  };

  return (
    <div className="min-h-screen bg-white text-black" style={{ fontFamily }}>
      <TopHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-[32px] border border-gray-200 bg-gray-50 p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">Workflow notebook</div>
              <h1 className="mt-2 text-3xl font-semibold">A notebook-style workspace for reviewing conservation analysis</h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                This is a static front-end mock-up that frames the workflow like an embedded notebook with code cells, output cells, and a helper chat drawer.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-full bg-[#009DA5] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00888f]">
                Run Code
              </button>
              <button
                onClick={() => setShowCode((value) => !value)}
                className="rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-gray-50"
              >
                View Code
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <NotebookCell title="Notebook wrapper">
              <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                <div className="text-sm font-semibold">Project Centinela</div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                  Build a repeatable review flow around Planet Labs imagery, with structured inputs, code cells, and a clear output area for analysts.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-gray-600">
                  {["Intake summary", "Notebook context", "Conservation workflow", "Prototype only"].map((tag) => (
                    <span key={tag} className="rounded-full bg-gray-100 px-3 py-2">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </NotebookCell>

            <NotebookCell title="Code cell" tone="code">
              <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-[#f7f7f7]">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                  <span>python</span>
                  <span>cell 01</span>
                </div>
                <pre className="overflow-x-auto p-5 text-sm leading-7 text-black">
                  <code>{codeSample}</code>
                </pre>
              </div>

              {showCode && (
                <div className="mt-4 rounded-[24px] border border-gray-200 bg-white p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Expanded code</div>
                  <pre className="mt-3 overflow-x-auto text-sm leading-7 text-gray-800">
                    <code>{codeSample.repeat(2)}</code>
                  </pre>
                </div>
              )}
            </NotebookCell>

            <NotebookCell title="Output" tone="muted">
              <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                <div className="text-sm font-semibold">Notebook output placeholder</div>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                  No backend is connected. This panel is reserved for preview charts, tables, or generated summaries in a future implementation.
                </p>
              </div>
            </NotebookCell>
          </section>

          <aside className="space-y-6">
            <NotebookCell title="Workflow notes" tone="muted">
              <div className="space-y-3 text-sm leading-6 text-gray-700">
                <div className="rounded-2xl bg-white p-4">1. Intake context arrives from the guided questionnaire.</div>
                <div className="rounded-2xl bg-white p-4">2. Analysts inspect the notebook wrapper and adjust code cells.</div>
                <div className="rounded-2xl bg-white p-4">3. The bottom-right assistant can explain steps in a mock conversation.</div>
              </div>
            </NotebookCell>

            <NotebookCell title="Run state" tone="default">
              <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#009DA5]/10 text-[#009DA5]">
                    ▷
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Ready to execute</div>
                    <div className="text-sm text-gray-600">This is a visual-only placeholder for notebook execution.</div>
                  </div>
                </div>
              </div>
            </NotebookCell>
          </aside>
        </div>
      </main>

      <button
        onClick={() => setChatOpen((value) => !value)}
        className="fixed bottom-5 right-5 z-40 flex h-14 items-center gap-3 rounded-full bg-black px-5 text-sm font-semibold text-white shadow-2xl transition hover:bg-black/85"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#009DA5] text-white">?</span>
        Chat with Centinela
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-5 z-40 w-[min(92vw,360px)] rounded-[28px] border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <div className="text-sm font-semibold">Centinela Assistant</div>
              <div className="text-xs text-gray-500">Mock UI only</div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="rounded-full bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600"
            >
              Close
            </button>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={[
                  "max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6",
                  message.role === "assistant" ? "bg-gray-100 text-black" : "ml-auto bg-[#009DA5] text-white",
                ].join(" ")}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Ask about the workflow..."
                className="min-w-0 flex-1 rounded-full border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#009DA5]"
              />
              <button
                onClick={sendMessage}
                className="rounded-full bg-[#009DA5] px-4 py-3 text-sm font-semibold text-white"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
