"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

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

function StepPill({
  label,
  active,
  done,
}: {
  label: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
        active
          ? "border-[#009DA5]/25 bg-[#009DA5]/10 text-black"
          : done
          ? "border-emerald-200 bg-emerald-50 text-black"
          : "border-gray-200 bg-white text-gray-500",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
          active
            ? "bg-[#009DA5] text-white"
            : done
            ? "bg-emerald-500 text-white"
            : "bg-gray-100 text-gray-500",
        ].join(" ")}
      >
        {done ? "✓" : ""}
      </div>
      <span>{label}</span>
    </div>
  );
}

function FooterButtons({
  onBack,
  onContinue,
  backLabel = "Back",
  continueLabel = "Continue",
  canGoBack = true,
}: {
  onBack?: () => void;
  onContinue?: () => void;
  backLabel?: string;
  continueLabel?: string;
  canGoBack?: boolean;
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-4">
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {backLabel}
      </button>
      <button
        onClick={onContinue}
        className="rounded-full bg-[#009DA5] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00888f]"
      >
        {continueLabel}
      </button>
    </div>
  );
}

export default function IntakeFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [useCase, setUseCase] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState("Weekly");
  const [region, setRegion] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [followUpA, setFollowUpA] = useState("Yes, keep all scenes in the same orbit window.");
  const [followUpB, setFollowUpB] = useState("Forest canopy and river edge.");
  const [followUpC, setFollowUpC] = useState("Operations team, then science review.");

  const completedSteps = useMemo(() => {
    return [0, 1, 2, 3, 4, 5, 6, 7].filter((n) => n < step).length;
  }, [step]);

  const steps = [
    "Use case",
    "Time frame",
    "Region",
    "Confirm",
    "Generating",
    "Follow-up 1",
    "Follow-up 2",
    "Follow-up 3",
    "Summary",
  ];

  const stepTitle = [
    "What is your use case?",
    "What time frame are you interested in?",
    "What region are you interested in?",
    "Location data loaded. Continue to confirm.",
    "Generating follow-up questions.",
    "What detail level should the analysis focus on?",
    "What land cover features matter most?",
    "Who should review the results?",
    "Workflow summary",
  ][step];

  const stepCopy = [
    "Tell us what you are analyzing so Centinela can shape the workflow.",
    "Pick the date range and cadence that matches your monitoring needs.",
    "Upload or describe the area of interest so the system can anchor the workflow.",
    "We found your location context and loaded the region for review.",
    "The system is generating follow-up questions based on your intake.",
    "A few mock follow-ups help the prototype feel like a real guided intake.",
    "These are placeholder controls that will later drive analysis settings.",
    "The final summary collects the inputs before opening the notebook workflow.",
    "Review the intake summary and jump into the workflow notebook.",
  ][step];

  const goBack = () => setStep((current) => Math.max(0, current - 1) as Step);
  const goForward = () => setStep((current) => Math.min(8, current + 1) as Step);

  const reset = () => {
    setStep(0);
    setUseCase("");
    setStartDate("");
    setEndDate("");
    setFrequency("Weekly");
    setRegion("");
    setFiles([]);
    setFollowUpA("Yes, keep all scenes in the same orbit window.");
    setFollowUpB("Forest canopy and river edge.");
    setFollowUpC("Operations team, then science review.");
  };

  return (
    <div className="min-h-screen bg-white text-black" style={{ fontFamily }}>
      <TopHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-gray-200 bg-gray-50 p-5 shadow-sm">
            <div className="mb-5">
              <div className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">Intake flow</div>
              <div className="mt-2 text-2xl font-semibold">Guided setup</div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                A clean prototype that captures project context before opening the notebook workflow.
              </p>
            </div>

            <div className="space-y-3">
              <StepPill label={steps[0]} done={step > 0} active={step === 0} />
              <StepPill label={steps[1]} done={step > 1} active={step === 1} />
              <StepPill label={steps[2]} done={step > 2} active={step === 2} />
              <StepPill label={steps[3]} done={step > 3} active={step === 3} />
              <StepPill label={steps[4]} done={step > 4} active={step === 4} />
              <StepPill label={steps[5]} done={step > 5} active={step === 5} />
              <StepPill label={steps[6]} done={step > 6} active={step === 6} />
              <StepPill label={steps[7]} done={step > 7} active={step === 7} />
              <StepPill label={steps[8]} active={step === 8} />
            </div>

            <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Progress</div>
              <div className="mt-2 text-3xl font-semibold">{Math.min(100, Math.round((step / 8) * 100))}%</div>
              <div className="mt-3 h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-[#009DA5] transition-all"
                  style={{ width: `${Math.min(100, (step / 8) * 100)}%` }}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                {completedSteps} of 8 screens completed in the prototype flow.
              </p>
            </div>
          </aside>

          <section className="rounded-[32px] border border-gray-200 bg-gray-50 shadow-sm">
            <div className="border-b border-gray-200 px-6 py-5 sm:px-8">
              <div className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500">
                Project Centinela
              </div>
              <h1 className="mt-2 text-3xl font-semibold">{stepTitle}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">{stepCopy}</p>
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-8">
              {step === 0 && (
                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-gray-900">Use case description</span>
                    <textarea
                      value={useCase}
                      onChange={(e) => setUseCase(e.target.value)}
                      placeholder="Example: Tracking deforestation pressure around protected forests and rivers..."
                      className="min-h-44 w-full rounded-[24px] border border-gray-300 bg-white px-5 py-4 text-sm outline-none ring-0 transition placeholder:text-gray-400 focus:border-[#009DA5]"
                    />
                  </label>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-[24px] border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Examples</div>
                      <div className="mt-2 text-sm leading-6 text-gray-700">
                        Forest loss, coastal change, crop monitoring, flood recovery.
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Tip</div>
                      <div className="mt-2 text-sm leading-6 text-gray-700">
                        Mention what decisions the analysis will support.
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-gray-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Output</div>
                      <div className="mt-2 text-sm leading-6 text-gray-700">
                        A tailored workflow summary and notebook prototype.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block rounded-[24px] border border-gray-200 bg-white p-5">
                    <span className="mb-2 block text-sm font-semibold">Start date</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#009DA5]"
                    />
                  </label>
                  <label className="block rounded-[24px] border border-gray-200 bg-white p-5">
                    <span className="mb-2 block text-sm font-semibold">End date</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#009DA5]"
                    />
                  </label>
                  <label className="block rounded-[24px] border border-gray-200 bg-white p-5 md:col-span-2">
                    <span className="mb-2 block text-sm font-semibold">Data frequency</span>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {["Daily", "Weekly", "Monthly"].map((value) => (
                        <button
                          key={value}
                          onClick={() => setFrequency(value)}
                          className={[
                            "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                            frequency === value
                              ? "border-[#009DA5] bg-[#009DA5]/10 text-black"
                              : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50",
                          ].join(" ")}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <label className="block rounded-[28px] border border-dashed border-gray-300 bg-white p-6 text-center transition hover:border-[#009DA5]">
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const nextFiles = Array.from(e.target.files ?? []).map((file) => file.name);
                        setFiles(nextFiles);
                        setRegion("Region selection uploaded");
                      }}
                    />
                    <div className="mx-auto flex max-w-lg flex-col items-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#009DA5]/10 text-2xl text-[#009DA5]">
                        ⤴
                      </div>
                      <div className="mt-4 text-lg font-semibold">Drop a region file or click to upload</div>
                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        Upload shapefiles, GeoJSON, or a reference file for the project region.
                      </p>
                      <div className="mt-5 rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">
                        File drop area
                      </div>
                    </div>
                  </label>

                  <label className="block rounded-[24px] border border-gray-200 bg-white p-5">
                    <span className="mb-2 block text-sm font-semibold">Region name</span>
                    <input
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="Example: Madre de Dios, Peru"
                      className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#009DA5]"
                    />
                  </label>

                  {files.length > 0 && (
                    <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950">
                      <div className="font-semibold">Uploaded files</div>
                      <ul className="mt-2 space-y-1">
                        {files.map((file) => (
                          <li key={file}>• {file}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-xl text-white">
                        ✓
                      </div>
                      <div>
                        <div className="text-lg font-semibold">Location data loaded.</div>
                        <div className="text-sm text-emerald-900/70">Continue to confirm.</div>
                      </div>
                    </div>
                    <div className="mt-5 rounded-3xl border border-emerald-200 bg-white p-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Region</div>
                          <div className="mt-2 text-sm font-medium">{region || "Madre de Dios, Peru"}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Files</div>
                          <div className="mt-2 text-sm font-medium">
                            {files.length ? `${files.length} uploaded` : "1 reference file loaded"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-gray-200 bg-white p-6">
                    <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Review</div>
                    <div className="mt-3 space-y-3 text-sm leading-6 text-gray-700">
                      <div className="rounded-2xl bg-gray-50 p-4">Coordinates anchored to a single region of interest.</div>
                      <div className="rounded-2xl bg-gray-50 p-4">The intake flow will now generate follow-up prompts.</div>
                      <div className="rounded-2xl bg-gray-50 p-4">No backend calls are made in this mock-up.</div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="rounded-[30px] border border-gray-200 bg-white p-8">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#009DA5]/10">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#009DA5] border-t-transparent" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">Generating follow-up questions</div>
                      <div className="mt-2 text-sm leading-6 text-gray-600">
                        The system is preparing the next set of intake prompts based on your region and use case.
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {["Boundary clarity", "Seasonal timing", "Reviewer group"].map((item) => (
                      <div key={item} className="rounded-[24px] bg-gray-50 p-5">
                        <div className="text-sm font-semibold">{item}</div>
                        <div className="mt-2 text-sm leading-6 text-gray-600">Placeholder hint for a future question card.</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="rounded-[30px] border border-gray-200 bg-white p-6">
                  <label className="block">
                    <div className="text-sm font-semibold">What detail level should the analysis focus on?</div>
                    <textarea
                      value={followUpA}
                      onChange={(e) => setFollowUpA(e.target.value)}
                      className="mt-3 min-h-40 w-full rounded-[24px] border border-gray-300 px-5 py-4 text-sm outline-none focus:border-[#009DA5]"
                    />
                  </label>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Scene-level", "Tile-level", "Vector summary", "Change hotspots"].map((tag) => (
                      <span key={tag} className="rounded-full bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="rounded-[30px] border border-gray-200 bg-white p-6">
                  <label className="block">
                    <div className="text-sm font-semibold">What land cover features matter most?</div>
                    <textarea
                      value={followUpB}
                      onChange={(e) => setFollowUpB(e.target.value)}
                      className="mt-3 min-h-40 w-full rounded-[24px] border border-gray-300 px-5 py-4 text-sm outline-none focus:border-[#009DA5]"
                    />
                  </label>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {["Forest edge", "River network", "Bare soil"].map((item) => (
                      <div key={item} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-medium">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 7 && (
                <div className="rounded-[30px] border border-gray-200 bg-white p-6">
                  <label className="block">
                    <div className="text-sm font-semibold">Who should review the results?</div>
                    <textarea
                      value={followUpC}
                      onChange={(e) => setFollowUpC(e.target.value)}
                      className="mt-3 min-h-40 w-full rounded-[24px] border border-gray-300 px-5 py-4 text-sm outline-none focus:border-[#009DA5]"
                    />
                  </label>
                  <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                    This is a static placeholder step that mirrors a real guided intake before the final summary.
                  </div>
                </div>
              )}

              {step === 8 && (
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[30px] border border-gray-200 bg-white p-6">
                    <div className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Summary</div>
                    <div className="mt-3 text-3xl font-semibold">Ready for workflow</div>
                    <div className="mt-4 space-y-3 text-sm leading-6 text-gray-700">
                      <div className="rounded-2xl bg-gray-50 p-4">
                        <span className="font-semibold">Use case:</span> {useCase || "Conservation monitoring and change detection"}
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-4">
                        <span className="font-semibold">Time frame:</span>{" "}
                        {startDate || "Start date"} – {endDate || "End date"} · {frequency}
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-4">
                        <span className="font-semibold">Region:</span> {region || "Loaded from uploaded region data"}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[30px] border border-gray-200 bg-gray-50 p-6">
                    <div className="text-sm font-semibold uppercase tracking-[0.3em] text-gray-500">Next actions</div>
                    <p className="mt-3 text-sm leading-6 text-gray-700">
                      Move into the notebook-style workflow, or clear the intake and start again.
                    </p>
                    <div className="mt-6 space-y-3">
                      <button
                        onClick={() => router.push("/workflow")}
                        className="w-full rounded-full bg-[#009DA5] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00888f]"
                      >
                        To Workflow
                      </button>
                      <button
                        onClick={reset}
                        className="w-full rounded-full border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-gray-50"
                      >
                        Start Over
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step !== 8 && (
                <FooterButtons
                  canGoBack={step > 0}
                  onBack={goBack}
                  onContinue={goForward}
                  continueLabel={step === 4 ? "Continue" : "Continue"}
                />
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
