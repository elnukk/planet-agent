'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import planetLogo from '../dashboard/planetlogo.png';

// ─── Design tokens ────────────────────────────────────────────────────────────
const TEAL = '#009DA5';

// ─── Shared NavBar ────────────────────────────────────────────────────────────
function NavBar() {
  const router = useRouter();
  return (
    <header className="bg-black h-14 px-4 flex items-center justify-between flex-shrink-0">
      <div className="relative h-10 w-10 flex-shrink-0">
        <Image src={planetLogo} alt="Planet logo" fill className="object-contain" />
      </div>
      <span className="text-white text-xl font-semibold tracking-wide">Centinela</span>
      <button
        onClick={() => router.push('/profile')}
        className="text-white text-xs font-medium border border-white rounded-full px-4 py-1.5 hover:bg-white hover:text-black transition-colors"
      >
        Profile
      </button>
    </header>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
// Steps visible in progress: 1-3, 5-7 (step 4 is hidden interstitial)
const PROGRESS_STEPS = [1, 2, 3, 5, 6, 7];
const STEP_LABELS = ['Use Case', 'Time Frame', 'Region', 'Questions', 'Details', 'Summary'];

function ProgressBar({ step }: { step: number }) {
  const visibleIndex = PROGRESS_STEPS.indexOf(step);
  const total = PROGRESS_STEPS.length;
  const current = visibleIndex === -1 ? -1 : visibleIndex;

  return (
    <div className="px-6 pt-5 pb-4">
      <div className="flex items-center gap-0 max-w-xl mx-auto">
        {STEP_LABELS.map((label, i) => {
          const done = current > i;
          const active = current === i;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all"
                  style={{
                    backgroundColor: done || active ? TEAL : 'white',
                    borderColor: done || active ? TEAL : '#d1d5db',
                    color: done || active ? 'white' : '#6b7280',
                  }}
                >
                  {done ? (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="text-xs mt-1 text-gray-500 hidden sm:block">{label}</span>
              </div>
              {i < total - 1 && (
                <div
                  className="flex-1 h-0.5 mx-1 mt-0 sm:-mt-5 transition-all"
                  style={{ backgroundColor: done ? TEAL : '#e5e7eb' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Nav buttons ──────────────────────────────────────────────────────────────
function NavButtons({
  onBack,
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
}: {
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
}) {
  return (
    <div className="flex justify-between pt-6">
      {onBack ? (
        <button
          onClick={onBack}
          className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
      ) : (
        <div />
      )}
      <button
        onClick={onContinue}
        disabled={continueDisabled}
        className="px-8 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-40 transition-colors"
        style={{ backgroundColor: TEAL }}
      >
        {continueLabel}
      </button>
    </div>
  );
}

// ─── Step 1: Use Case ─────────────────────────────────────────────────────────
function StepUseCase({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What is your use case?</h2>
      <p className="text-sm text-gray-500 mb-6">Tell us what you are trying to analyze so we can tailor your workflow.</p>
      <div className="bg-gray-100 rounded-2xl p-5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe what you are analyzing, e.g. deforestation monitoring, crop health assessment…"
          rows={7}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 resize-none transition"
          style={{ focusRingColor: TEAL } as React.CSSProperties}
        />
      </div>
      <NavButtons onContinue={onContinue} continueDisabled={!value.trim()} />
    </div>
  );
}

// ─── Step 2: Time Frame ───────────────────────────────────────────────────────
type Frequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';

function StepTimeFrame({
  startDate,
  endDate,
  frequency,
  onStartDate,
  onEndDate,
  onFrequency,
  onBack,
  onContinue,
}: {
  startDate: string;
  endDate: string;
  frequency: Frequency;
  onStartDate: (v: string) => void;
  onEndDate: (v: string) => void;
  onFrequency: (v: Frequency) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const canContinue = !!startDate && !!endDate;
  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What time frame are you interested in?</h2>
      <p className="text-sm text-gray-500 mb-6">Select your analysis period and data frequency.</p>
      <div className="bg-gray-100 rounded-2xl p-5 space-y-5">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 transition"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDate(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 transition"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Data Frequency</label>
          <select
            value={frequency}
            onChange={(e) => onFrequency(e.target.value as Frequency)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 transition"
          >
            {(['Daily', 'Weekly', 'Monthly', 'Quarterly'] as Frequency[]).map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>
      <NavButtons onBack={onBack} onContinue={onContinue} continueDisabled={!canContinue} />
    </div>
  );
}

// ─── Step 3: Region ───────────────────────────────────────────────────────────
function StepRegion({
  fileLoaded,
  onFileLoad,
  onBack,
  onContinue,
}: {
  fileLoaded: boolean;
  onFileLoad: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    onFileLoad();
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleFileChange() {
    onFileLoad();
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What region are you interested in?</h2>
      <p className="text-sm text-gray-500 mb-6">Upload a GeoJSON or KML file to define your area of interest.</p>
      <div className="bg-gray-100 rounded-2xl p-5">
        {fileLoaded ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 px-6 py-10 flex flex-col items-center text-center">
            {/* Success banner */}
            <div className="w-full mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-800 font-medium">Location data loaded. Continue to confirm.</span>
            </div>
            <button
              onClick={() => { onFileLoad(); }}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Replace file
            </button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border-2 border-dashed border-gray-300 px-6 py-12 flex flex-col items-center text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50 transition-colors"
          >
            {/* Cloud upload icon */}
            <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338-2.32 5.75 5.75 0 0 1 1.323 11.096" />
            </svg>
            <p className="text-sm text-gray-500 font-medium">Drop a GeoJSON or KML file, or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">Supported formats: .geojson, .kml</p>
            <input
              ref={fileRef}
              type="file"
              accept=".geojson,.kml,.json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>
      <NavButtons onBack={onBack} onContinue={onContinue} continueDisabled={!fileLoaded} />
    </div>
  );
}

// ─── Step 4: Interstitial ─────────────────────────────────────────────────────
function StepLoading({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Simplified dark bar */}
      <div className="bg-black h-14 flex items-center justify-center">
        <span className="text-white text-xl font-semibold tracking-wide">Centinela</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        <div
          className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${TEAL} ${TEAL} ${TEAL} transparent` }}
        />
        <p className="text-gray-600 text-base font-medium text-center max-w-xs">
          Generating follow-up questions based on your inputs…
        </p>
      </div>
    </div>
  );
}

// ─── Step 5: Follow-up Q1 ─────────────────────────────────────────────────────
function StepFollowUp1({
  value,
  onChange,
  onBack,
  onContinue,
}: {
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Follow-up Question 1</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        What specific environmental indicators are you tracking?
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Examples: NDVI, land surface temperature, water quality indices, canopy cover.
      </p>
      <div className="bg-gray-100 rounded-2xl p-5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="List the indicators you plan to monitor…"
          rows={6}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 resize-none transition"
        />
      </div>
      <NavButtons onBack={onBack} onContinue={onContinue} continueDisabled={!value.trim()} />
    </div>
  );
}

// ─── Step 6: Follow-up Q2 ─────────────────────────────────────────────────────
function StepFollowUp2({
  hasBaseline,
  baselineDetail,
  onHasBaseline,
  onBaselineDetail,
  onBack,
  onContinue,
}: {
  hasBaseline: 'yes' | 'no' | null;
  baselineDetail: string;
  onHasBaseline: (v: 'yes' | 'no') => void;
  onBaselineDetail: (v: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Follow-up Question 2</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Do you have existing baseline data?</h2>
      <p className="text-sm text-gray-500 mb-6">
        Baseline data helps calibrate analysis and detect change over time more accurately.
      </p>
      <div className="bg-gray-100 rounded-2xl p-5 space-y-4">
        <div className="flex gap-4">
          {(['yes', 'no'] as const).map((opt) => (
            <label
              key={opt}
              className="flex-1 flex items-center gap-3 bg-white border-2 rounded-xl px-4 py-3 cursor-pointer transition-all"
              style={{
                borderColor: hasBaseline === opt ? TEAL : '#e5e7eb',
              }}
            >
              <input
                type="radio"
                name="baseline"
                value={opt}
                checked={hasBaseline === opt}
                onChange={() => onHasBaseline(opt)}
                className="sr-only"
              />
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{ borderColor: hasBaseline === opt ? TEAL : '#d1d5db' }}
              >
                {hasBaseline === opt && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TEAL }} />
                )}
              </div>
              <span className="text-sm font-medium text-gray-800 capitalize">{opt === 'yes' ? 'Yes' : 'No'}</span>
            </label>
          ))}
        </div>

        {hasBaseline === 'yes' && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Describe your baseline data
            </label>
            <textarea
              value={baselineDetail}
              onChange={(e) => onBaselineDetail(e.target.value)}
              placeholder="e.g. Sentinel-2 imagery from 2020 covering the study area…"
              rows={4}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 resize-none transition"
            />
          </div>
        )}
      </div>
      <NavButtons onBack={onBack} onContinue={onContinue} continueDisabled={hasBaseline === null} />
    </div>
  );
}

// ─── Step 7: Summary ──────────────────────────────────────────────────────────
function StepSummary({
  useCase,
  startDate,
  endDate,
  frequency,
  indicators,
  onStartOver,
}: {
  useCase: string;
  startDate: string;
  endDate: string;
  frequency: string;
  indicators: string;
  onStartOver: () => void;
}) {
  const router = useRouter();

  const rows: { label: string; value: string }[] = [
    { label: 'Use Case', value: useCase || '—' },
    {
      label: 'Time Frame',
      value: startDate && endDate ? `${startDate} → ${endDate} (${frequency})` : '—',
    },
    { label: 'Region', value: 'Custom area — GeoJSON uploaded' },
    { label: 'Indicators', value: indicators || 'NDVI, land surface temperature' },
  ];

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow Summary</h2>
      <p className="text-sm text-gray-500 mb-6">
        Review your inputs below. You can start over or proceed to generate the workflow.
      </p>
      <div className="bg-gray-100 rounded-2xl p-5 space-y-4">
        {rows.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl px-4 py-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
            <div className="text-sm text-gray-800">{value}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-between pt-6">
        <button
          onClick={onStartOver}
          className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Start Over
        </button>
        <button
          onClick={() => router.push('/workflow/demo')}
          className="px-8 py-2.5 rounded-full text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: TEAL }}
        >
          To Workflow
        </button>
      </div>
    </div>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────
export default function IntakePage() {
  const [step, setStep] = useState(1);

  // Step 1
  const [useCase, setUseCase] = useState('');
  // Step 2
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('Monthly');
  // Step 3
  const [fileLoaded, setFileLoaded] = useState(false);
  // Step 5
  const [indicators, setIndicators] = useState('');
  // Step 6
  const [hasBaseline, setHasBaseline] = useState<'yes' | 'no' | null>(null);
  const [baselineDetail, setBaselineDetail] = useState('');

  function reset() {
    setStep(1);
    setUseCase('');
    setStartDate('');
    setEndDate('');
    setFrequency('Monthly');
    setFileLoaded(false);
    setIndicators('');
    setHasBaseline(null);
    setBaselineDetail('');
  }

  // The interstitial step renders a full-screen layout on its own
  if (step === 4) {
    return <StepLoading onDone={() => setStep(5)} />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <NavBar />
      <ProgressBar step={step} />
      <main className="flex-1 px-4 sm:px-6 pb-12 pt-4">
        {step === 1 && (
          <StepUseCase
            value={useCase}
            onChange={setUseCase}
            onContinue={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepTimeFrame
            startDate={startDate}
            endDate={endDate}
            frequency={frequency}
            onStartDate={setStartDate}
            onEndDate={setEndDate}
            onFrequency={setFrequency}
            onBack={() => setStep(1)}
            onContinue={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepRegion
            fileLoaded={fileLoaded}
            onFileLoad={() => setFileLoaded(true)}
            onBack={() => setStep(2)}
            onContinue={() => setStep(4)}
          />
        )}
        {step === 5 && (
          <StepFollowUp1
            value={indicators}
            onChange={setIndicators}
            onBack={() => setStep(3)}
            onContinue={() => setStep(6)}
          />
        )}
        {step === 6 && (
          <StepFollowUp2
            hasBaseline={hasBaseline}
            baselineDetail={baselineDetail}
            onHasBaseline={setHasBaseline}
            onBaselineDetail={setBaselineDetail}
            onBack={() => setStep(5)}
            onContinue={() => setStep(7)}
          />
        )}
        {step === 7 && (
          <StepSummary
            useCase={useCase}
            startDate={startDate}
            endDate={endDate}
            frequency={frequency}
            indicators={indicators}
            onStartOver={reset}
          />
        )}
      </main>
    </div>
  );
}
