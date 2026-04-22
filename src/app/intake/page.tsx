'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCurrentUser, createWorkflow } from '@/lib/auth';
import planetLogo from '../dashboard/planetlogo.png';

const TEAL = '#009DA5';
type Frequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';

// ─── AI question generation (simulated) ──────────────────────────────────────
type QTriple = [string, string, string];

function getQuestionSets(useCase: string): QTriple[] {
  const u = useCase.toLowerCase();

  let domainSet: QTriple;
  if (u.includes('forest') || u.includes('deforest') || u.includes('tree') || u.includes('canopy')) {
    domainSet = [
      'What tree species or forest types are the primary focus of your analysis?',
      'Are you monitoring illegal logging, natural degradation, or general canopy cover change?',
      'What is the minimum detectable change size (in hectares) relevant to your study?',
    ];
  } else if (u.includes('crop') || u.includes('agri') || u.includes('farm') || u.includes('harvest')) {
    domainSet = [
      'Which crop types are you monitoring, and which growth stage is most critical?',
      'Are you focused on yield prediction, stress detection, or pest/disease identification?',
      'What farm management decisions will this satellite analysis inform?',
    ];
  } else if (u.includes('water') || u.includes('flood') || u.includes('river') || u.includes('lake') || u.includes('coast')) {
    domainSet = [
      'Are you monitoring surface water extent, water quality, or flood risk?',
      'What water body types are included in your area of interest?',
      'What downstream decisions or actions will this monitoring support?',
    ];
  } else if (u.includes('urban') || u.includes('city') || u.includes('infrastructure') || u.includes('building')) {
    domainSet = [
      'What urban features are you analyzing — buildings, roads, green space, or other?',
      'Is this for growth monitoring, damage assessment, or urban planning purposes?',
      'What spatial resolution is required for your specific application?',
    ];
  } else {
    domainSet = [
      'What specific environmental or land-use indicators are you tracking?',
      'Do you have existing baseline data or reference imagery to compare against?',
      'How will the results of this analysis be used or acted upon?',
    ];
  }

  const generalSet1: QTriple = [
    'What spatial resolution is most critical for your use case?',
    'Are there seasonal factors (wet season, growing season, etc.) that affect your analysis?',
    'Will you be comparing results across multiple time periods or locations?',
  ];

  const generalSet2: QTriple = [
    'What stakeholders or communities will benefit most from this analysis?',
    'Does this analysis need to run on a regular schedule or is it a one-time study?',
    'What output formats do you need — maps, statistics, reports, or raw data exports?',
  ];

  return [domainSet, generalSet1, generalSet2];
}

// ─── Shared NavBar ────────────────────────────────────────────────────────────
function NavBar() {
  const router = useRouter();
  return (
    <header className="bg-black h-20 flex items-center flex-shrink-0 relative">
      <div className="relative h-20 w-20 flex-shrink-0 ml-2">
        <Image src={planetLogo} alt="Planet logo" fill className="object-contain" />
      </div>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold tracking-wide text-white pointer-events-none">
        Project Centinela
      </span>
      <div className="ml-auto flex-shrink-0 pr-4">
        <button
          onClick={() => router.push('/profile')}
          className="text-white text-sm font-medium border border-white rounded-full px-4 py-1.5 hover:bg-white hover:text-black transition-colors"
        >
          Profile
        </button>
      </div>
    </header>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
// Steps 1–4 = setup, step 5 = hidden loading, 6–8 = questions, 9 = summary
const STEP_LABELS = ['Use Case', 'Time Frame', 'Region', 'Q 1', 'Q 2', 'Q 3', 'Confirm'];

function stepToProgressIdx(step: number): number {
  if (step === 1) return 0;
  if (step === 2) return 1;
  if (step === 3 || step === 4) return 2;
  if (step === 5) return -1;
  if (step === 6) return 3;
  if (step === 7) return 4;
  if (step === 8) return 5;
  if (step === 9) return 6;
  return -1;
}

function ProgressBar({ step }: { step: number }) {
  const current = stepToProgressIdx(step);
  if (current === -1) return null;

  return (
    <div className="px-6 pt-5 pb-4">
      <div className="flex items-center max-w-2xl mx-auto">
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
                <span className="text-xs mt-1 text-gray-500 hidden sm:block whitespace-nowrap">{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
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
        <button onClick={onBack}
          className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors">
          Back
        </button>
      ) : <div />}
      <button onClick={onContinue} disabled={continueDisabled}
        className="px-8 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-40 transition-colors"
        style={{ backgroundColor: TEAL }}>
        {continueLabel}
      </button>
    </div>
  );
}

// ─── Step 1: Use Case ─────────────────────────────────────────────────────────
function StepUseCase({ value, onChange, onContinue }: {
  value: string; onChange: (v: string) => void; onContinue: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What is your use case?</h2>
      <p className="text-sm text-gray-500 mb-6">Tell us what you are trying to analyze so we can tailor your workflow.</p>
      <div className="bg-gray-100 rounded-2xl p-5">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe what you are analyzing, e.g. deforestation monitoring, crop health assessment, coastal erosion tracking…"
          rows={7}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-100 resize-none transition"
        />
      </div>
      <NavButtons onContinue={onContinue} continueDisabled={!value.trim()} />
    </div>
  );
}

// ─── Step 2: Time Frame ───────────────────────────────────────────────────────
const TIME_PRESETS = [
  { label: 'Past 3 Months', months: 3 },
  { label: 'Past 6 Months', months: 6 },
  { label: 'Past Year', months: 12 },
  { label: 'Past 2 Years', months: 24 },
  { label: 'Past 5 Years', months: 60 },
  { label: 'Custom Range', months: 0 },
];

function StepTimeFrame({ startDate, endDate, frequency, onStartDate, onEndDate, onFrequency, onBack, onContinue }: {
  startDate: string; endDate: string; frequency: Frequency;
  onStartDate: (v: string) => void; onEndDate: (v: string) => void;
  onFrequency: (v: Frequency) => void; onBack: () => void; onContinue: () => void;
}) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [showCustom, setShowCustom] = useState(false);

  function applyPreset(months: number) {
    if (months === 0) {
      setShowCustom(true);
      setSelectedPreset(0);
      return;
    }
    setShowCustom(false);
    setSelectedPreset(months);
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    onStartDate(start.toISOString().split('T')[0]);
    onEndDate(end.toISOString().split('T')[0]);
  }

  const canContinue = (selectedPreset !== null && selectedPreset !== 0) || (showCustom && !!startDate && !!endDate);

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What time frame are you interested in?</h2>
      <p className="text-sm text-gray-500 mb-6">Select how far back you want to investigate, and how often you want data sampled.</p>

      <div className="bg-gray-100 rounded-2xl p-5 space-y-5">
        {/* Preset grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TIME_PRESETS.map(({ label, months }) => {
            const active = showCustom ? months === 0 : selectedPreset === months;
            return (
              <button
                key={label}
                onClick={() => applyPreset(months)}
                className="py-3 px-4 rounded-xl text-sm font-medium border-2 text-left transition-all"
                style={{
                  borderColor: active ? TEAL : '#e5e7eb',
                  backgroundColor: active ? `${TEAL}12` : 'white',
                  color: active ? TEAL : '#374151',
                }}
              >
                <span className="block font-semibold">{label}</span>
                {months > 0 && (
                  <span className="block text-xs mt-0.5" style={{ color: active ? TEAL : '#9ca3af' }}>
                    {months < 12 ? `${months}mo` : `${months / 12}yr`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom date pickers */}
        {showCustom && (
          <div className="flex gap-4 pt-1">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => onStartDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-100 transition" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">End Date</label>
              <input type="date" value={endDate} onChange={(e) => onEndDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-100 transition" />
            </div>
          </div>
        )}

        {/* Frequency */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Data Frequency</label>
          <div className="flex gap-2 flex-wrap">
            {(['Daily', 'Weekly', 'Monthly', 'Quarterly'] as Frequency[]).map((f) => (
              <button key={f} onClick={() => onFrequency(f)}
                className="px-4 py-2 rounded-full text-sm font-medium border-2 transition-all"
                style={{
                  borderColor: frequency === f ? TEAL : '#e5e7eb',
                  backgroundColor: frequency === f ? `${TEAL}12` : 'white',
                  color: frequency === f ? TEAL : '#374151',
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <NavButtons onBack={onBack} onContinue={onContinue} continueDisabled={!canContinue} />
    </div>
  );
}

// ─── Step 3: Region ───────────────────────────────────────────────────────────
function StepRegion({ onFileLoad, onBack }: {
  onFileLoad: (name: string) => void; onBack: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [regionText, setRegionText] = useState('');

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onFileLoad(file.name);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFileLoad(file.name);
  }

  function handleTextContinue() {
    if (regionText.trim()) onFileLoad(regionText.trim());
  }

  const canContinue = !!regionText.trim();

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What region are you interested in?</h2>
      <p className="text-sm text-gray-500 mb-6">Upload a GeoJSON or KML file to define your area of interest, or type a region name below.</p>
      <div className="bg-gray-100 rounded-2xl p-5 space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border-2 border-dashed border-gray-300 px-6 py-12 flex flex-col items-center text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-colors"
        >
          <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.338-2.32 5.75 5.75 0 0 1 1.323 11.096" />
          </svg>
          <p className="text-sm text-gray-600 font-medium">Drop a GeoJSON or KML file, or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">Supported: .geojson, .kml, .json</p>
          <input ref={fileRef} type="file" accept=".geojson,.kml,.json" className="hidden" onChange={handleFileChange} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={regionText}
            onChange={(e) => setRegionText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleTextContinue(); }}
            placeholder="Type a region name (e.g. Amazon Basin, Mekong Delta…)"
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-100 transition"
          />
          <button
            onClick={handleTextContinue}
            disabled={!canContinue}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-colors flex-shrink-0"
            style={{ backgroundColor: '#009DA5' }}
          >
            Use
          </button>
        </div>
      </div>
      <NavButtons onBack={onBack} onContinue={handleTextContinue} continueDisabled={!canContinue} />
    </div>
  );
}

// ─── Step 4: Location Loaded confirmation ─────────────────────────────────────
function StepLocationLoaded({ fileName, onReupload, onBack, onContinue }: {
  fileName: string; onReupload: () => void; onBack: () => void; onContinue: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Data Loaded</h2>
      <p className="text-sm text-gray-500 mb-6">Your region has been imported. Review the details below and continue to confirm.</p>

      <div className="bg-gray-100 rounded-2xl p-5 space-y-4">
        {/* Success banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">Location Data Loaded Successfully</p>
            <p className="text-xs text-green-600 mt-0.5 font-mono">{fileName}</p>
          </div>
        </div>

        {/* Simulated map placeholder */}
        <div className="rounded-xl overflow-hidden bg-gray-200 h-40 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-10 h-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
            <p className="text-xs text-gray-500">Region preview</p>
          </div>
        </div>

        {/* Reupload option */}
        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
          <span className="text-xs text-gray-500">Not the right area?</span>
          <button
            onClick={onReupload}
            className="text-xs font-medium hover:underline transition-colors"
            style={{ color: TEAL }}
          >
            Re-upload file
          </button>
        </div>
      </div>

      <NavButtons onBack={onBack} onContinue={onContinue} continueLabel="Confirm & Continue" />
    </div>
  );
}

// ─── Step 5: Loading interstitial ─────────────────────────────────────────────
function StepLoading({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-black h-20 flex items-center justify-center">
        <span className="text-white text-2xl font-bold tracking-wide">Project Centinela</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
        <div className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${TEAL} ${TEAL} ${TEAL} transparent` }} />
        <div className="text-center space-y-1 max-w-xs">
          <p className="text-gray-800 text-base font-semibold">Analyzing your inputs…</p>
          <p className="text-gray-400 text-sm">Generating tailored follow-up questions based on your use case and region.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Steps 6–8: Follow-up questions ──────────────────────────────────────────
function StepFollowUp({ questionNumber, questionText, answer, onAnswer, onBack, onContinue, showRegenerate, onRegenerate, regenerating }: {
  questionNumber: number;
  questionText: string;
  answer: string;
  onAnswer: (v: string) => void;
  onBack: () => void;
  onContinue: () => void;
  showRegenerate?: boolean;
  onRegenerate?: () => void;
  regenerating?: boolean;
}) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-3">
        <div className="px-2.5 py-1 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: TEAL }}>
          Q{questionNumber}
        </div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Follow-up Question {questionNumber} of 3</span>
        {showRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={regenerating}
            className="ml-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border transition-all disabled:opacity-50"
            style={{ color: TEAL, borderColor: TEAL }}
          >
            {regenerating ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Regenerating…
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Regenerate questions
              </>
            )}
          </button>
        )}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">{questionText}</h2>

      <div className="bg-gray-100 rounded-2xl p-5">
        <textarea
          key={questionText}
          value={answer}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Type your answer here…"
          rows={6}
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-100 resize-none transition"
        />
      </div>

      <NavButtons onBack={onBack} onContinue={onContinue} continueDisabled={!answer.trim()} />
    </div>
  );
}

// ─── Step 9: Summary + workflow creation ──────────────────────────────────────
function StepSummary({ useCase, startDate, endDate, frequency, fileName, answers, questions, onStartOver }: {
  useCase: string;
  startDate: string;
  endDate: string;
  frequency: string;
  fileName: string;
  answers: [string, string, string];
  questions: [string, string, string];
  onStartOver: () => void;
}) {
  const router = useRouter();
  const [workflowName, setWorkflowName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const suggested = useCase.trim().split('\n')[0].trim().slice(0, 60);
    setWorkflowName(suggested || 'New Workflow');
  }, [useCase]);

  function handleCreate() {
    const user = getCurrentUser();
    if (!user || !workflowName.trim()) return;
    setCreating(true);
    const wf = createWorkflow(user.id, workflowName.trim());
    router.push(`/workflow/${wf.id}`);
  }

  const summaryRows = [
    { label: 'Use Case', value: useCase || '—' },
    { label: 'Time Frame', value: startDate && endDate ? `${startDate} → ${endDate} (${frequency})` : '—' },
    { label: 'Region', value: fileName || '—' },
    ...questions.map((q, i) => ({ label: `Q${i + 1}: ${q.slice(0, 40)}…`, value: answers[i] || '—' })),
  ];

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Workflow</h2>
      <p className="text-sm text-gray-500 mb-6">Review your inputs and give your workflow a name to get started.</p>

      <div className="bg-gray-100 rounded-2xl p-5 space-y-3 mb-6">
        {summaryRows.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl px-4 py-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
            <div className="text-sm text-gray-800 line-clamp-2">{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-100 rounded-2xl p-5 mb-2">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Workflow Name</label>
        <input
          type="text"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder="e.g. Amazon Deforestation Analysis"
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-100 transition"
        />
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onStartOver}
          className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors">
          Start Over
        </button>
        <button
          onClick={handleCreate}
          disabled={!workflowName.trim() || creating}
          className="px-8 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-50 transition-colors"
          style={{ backgroundColor: TEAL }}
        >
          {creating ? 'Creating…' : 'Create Workflow →'}
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
  // Steps 3 & 4
  const [regionFileName, setRegionFileName] = useState('');
  // Steps 6–8 — answers
  const [q1Answer, setQ1Answer] = useState('');
  const [q2Answer, setQ2Answer] = useState('');
  const [q3Answer, setQ3Answer] = useState('');
  // Question set cycling (regenerate)
  const [qSetIdx, setQSetIdx] = useState(0);
  const [regenerating, setRegenerating] = useState(false);

  const questionSets = useMemo(() => getQuestionSets(useCase), [useCase]);
  const currentQuestions = questionSets[qSetIdx % questionSets.length];

  function handleRegenerate() {
    setRegenerating(true);
    setQ1Answer('');
    setQ2Answer('');
    setQ3Answer('');
    setTimeout(() => {
      setQSetIdx((i) => i + 1);
      setRegenerating(false);
    }, 1500);
  }

  function reset() {
    setStep(1);
    setUseCase('');
    setStartDate('');
    setEndDate('');
    setFrequency('Monthly');
    setRegionFileName('');
    setQ1Answer('');
    setQ2Answer('');
    setQ3Answer('');
    setQSetIdx(0);
  }

  function handleFileLoad(name: string) {
    setRegionFileName(name);
    setStep(4);
  }

  if (step === 5) {
    return <StepLoading onDone={() => setStep(6)} />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <NavBar />
      <ProgressBar step={step} />
      <main className="flex-1 px-4 sm:px-6 pb-12 pt-4">

        {step === 1 && (
          <StepUseCase value={useCase} onChange={setUseCase} onContinue={() => setStep(2)} />
        )}

        {step === 2 && (
          <StepTimeFrame
            startDate={startDate} endDate={endDate} frequency={frequency}
            onStartDate={setStartDate} onEndDate={setEndDate} onFrequency={setFrequency}
            onBack={() => setStep(1)} onContinue={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <StepRegion onFileLoad={handleFileLoad} onBack={() => setStep(2)} />
        )}

        {step === 4 && (
          <StepLocationLoaded
            fileName={regionFileName}
            onReupload={() => { setRegionFileName(''); setStep(3); }}
            onBack={() => setStep(3)}
            onContinue={() => setStep(5)}
          />
        )}

        {step === 6 && (
          <StepFollowUp
            questionNumber={1}
            questionText={regenerating ? '…' : currentQuestions[0]}
            answer={q1Answer}
            onAnswer={setQ1Answer}
            onBack={() => setStep(4)}
            onContinue={() => setStep(7)}
            showRegenerate
            onRegenerate={handleRegenerate}
            regenerating={regenerating}
          />
        )}

        {step === 7 && (
          <StepFollowUp
            questionNumber={2}
            questionText={currentQuestions[1]}
            answer={q2Answer}
            onAnswer={setQ2Answer}
            onBack={() => setStep(6)}
            onContinue={() => setStep(8)}
          />
        )}

        {step === 8 && (
          <StepFollowUp
            questionNumber={3}
            questionText={currentQuestions[2]}
            answer={q3Answer}
            onAnswer={setQ3Answer}
            onBack={() => setStep(7)}
            onContinue={() => setStep(9)}
          />
        )}

        {step === 9 && (
          <StepSummary
            useCase={useCase}
            startDate={startDate}
            endDate={endDate}
            frequency={frequency}
            fileName={regionFileName}
            answers={[q1Answer, q2Answer, q3Answer]}
            questions={currentQuestions}
            onStartOver={reset}
          />
        )}

      </main>
    </div>
  );
}
