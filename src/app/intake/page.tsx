'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { getCurrentUser } from '@/lib/auth';
import { type IntakeJSON } from '@/lib/workflowIntake';
import planetLogo from '../dashboard/planetlogo.png';

function inferTimeFrame(start: string, end: string): "3mo" | "6mo" | "1yr" | "2yr" | "5yr" | "custom" {
  const months = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24 * 30.5)
  );
  if (months <= 3) return '3mo';
  if (months <= 6) return '6mo';
  if (months <= 13) return '1yr';
  if (months <= 26) return '2yr';
  if (months <= 62) return '5yr';
  return 'custom';
}

function mapFrequency(f: string): "daily" | "weekly" | "monthly" | "quarterly" | "yearly" {
  const lower = f.toLowerCase();
  if (lower === 'daily') return 'daily';
  if (lower === 'weekly') return 'weekly';
  if (lower === 'quarterly') return 'quarterly';
  if (lower === 'yearly') return 'yearly';
  return 'monthly';
}

function mapTemporalResolution(tr: string | undefined): "daily" | "weekly" | "biweekly" | "monthly" | "seasonal" | "unknown" {
  const valid = ['daily', 'weekly', 'biweekly', 'monthly', 'seasonal'] as const;
  const lower = (tr ?? '').toLowerCase();
  return (valid as readonly string[]).includes(lower)
    ? lower as "daily" | "weekly" | "biweekly" | "monthly" | "seasonal"
    : 'unknown';
}

const TEAL = '#009DA5';
type Frequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | '';

const FALLBACK_QUESTIONS: string[] = [
  'What specific environmental or land-use indicators are you tracking?',
  'Do you have existing baseline data or reference imagery to compare against?',
  'How will the results of this analysis be used or acted upon?',
];

const PLANET_PRODUCTS = ['PlanetScope', 'SkySat', 'Sentinel-2', 'Basemaps', 'Planetary Variables'];

async function fetchAIQuestions(
  useCase: string,
  region: string,
  startDate: string,
  endDate: string,
  planetProduct: string,
): Promise<string[]> {
  try {
    const res = await fetch('/api/intake-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        useCase,
        region,
        dateRange: `${startDate} to ${endDate}`,
        planetProduct,
      }),
    });
    if (!res.ok) return FALLBACK_QUESTIONS;
    const data = await res.json();
    const qs: string[] = data.questions;
    return qs?.length >= 3 ? qs.slice(0, 5) : FALLBACK_QUESTIONS;
  } catch {
    return FALLBACK_QUESTIONS;
  }
}

// ─── Shared NavBar ────────────────────────────────────────────────────────────
function NavBar() {
  const router = useRouter();
  return (
    <header className="bg-black h-20 flex items-center flex-shrink-0 relative">
      <div className="relative h-20 w-20 flex-shrink-0 ml-2">
        <Image src={planetLogo} alt="Planet logo" fill className="object-contain" />
      </div>
      <button
        onClick={() => router.push('/dashboard')}
        className="absolute inset-0 flex items-center justify-center text-2xl font-bold tracking-wide text-white hover:opacity-80 transition-opacity"
      >
        Project Centinela
      </button>
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
// Steps 1–5 = setup, step 6 = hidden loading, 7 = questions, 8 = summary
const STEP_LABELS = ['Use Case', 'Time Frame', 'Product', 'Region', 'Questions', 'Confirm'];

function stepToProgressIdx(step: number): number {
  if (step === 1) return 0;
  if (step === 2) return 1;
  if (step === 3) return 2;
  if (step === 4 || step === 5) return 3;
  if (step === 6) return -1;
  if (step === 7) return 4;
  if (step === 8) return 5;
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
      <div className="flex justify-end pt-6">
        <button onClick={onContinue} disabled={!value.trim()}
          className="px-8 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-40 transition-colors"
          style={{ backgroundColor: TEAL }}>
          Continue
        </button>
      </div>
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
    if (months === 0) { setShowCustom(true); setSelectedPreset(0); return; }
    setShowCustom(false);
    setSelectedPreset(months);
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    onStartDate(start.toISOString().split('T')[0]);
    onEndDate(end.toISOString().split('T')[0]);
  }

  const canContinue = ((selectedPreset !== null && selectedPreset !== 0) || (showCustom && !!startDate && !!endDate)) && !!frequency;

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What time frame are you interested in?</h2>
      <p className="text-sm text-gray-500 mb-6">Select how far back you want to investigate, and how often you want data sampled.</p>
      <div className="bg-gray-100 rounded-2xl p-5 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TIME_PRESETS.map(({ label, months }) => {
            const active = showCustom ? months === 0 : selectedPreset === months;
            return (
              <button key={label} onClick={() => applyPreset(months)}
                className="py-3 px-4 rounded-xl text-sm font-medium border-2 text-left transition-all"
                style={{
                  borderColor: active ? TEAL : '#e5e7eb',
                  backgroundColor: active ? `${TEAL}12` : 'white',
                  color: active ? TEAL : '#374151',
                }}>
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
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Data Frequency</label>
          <div className="flex gap-2 flex-wrap">
            {(['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'] as Frequency[]).map((f) => (
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
      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors">Back</button>
        <button onClick={onContinue} disabled={!canContinue}
          className="px-8 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-40 transition-colors"
          style={{ backgroundColor: TEAL }}>Continue</button>
      </div>
    </div>
  );
}

// ─── Step 3: Planet Product ───────────────────────────────────────────────────
function StepPlanetProduct({ value, onChange, onBack, onContinue }: {
  value: string[]; onChange: (v: string[]) => void; onBack: () => void; onContinue: () => void;
}) {
  const [showOther, setShowOther] = useState(false);
  const [custom, setCustom] = useState('');

  function toggle(product: string) {
    if (value.includes(product)) {
      onChange(value.filter((v) => v !== product));
    } else {
      onChange([...value, product]);
    }
  }

  function toggleOther() {
    if (showOther) {
      onChange(value.filter((v) => PLANET_PRODUCTS.includes(v)));
      setCustom('');
      setShowOther(false);
    } else {
      setShowOther(true);
    }
  }

  function handleCustomChange(v: string) {
    setCustom(v);
    const withoutCustom = value.filter((p) => PLANET_PRODUCTS.includes(p));
    onChange(v.trim() ? [...withoutCustom, v.trim()] : withoutCustom);
  }

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Which Planet products do you have access to?</h2>
      <p className="text-sm text-gray-500 mb-6">Select all that apply — this determines which bands and capabilities are available for your workflow.</p>
      <div className="bg-gray-100 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PLANET_PRODUCTS.map((product) => {
            const active = value.includes(product);
            return (
              <button key={product} onClick={() => toggle(product)}
                className="py-3 px-4 rounded-xl text-sm font-semibold border-2 text-left transition-all flex items-center gap-2"
                style={{
                  borderColor: active ? TEAL : '#e5e7eb',
                  backgroundColor: active ? `${TEAL}12` : 'white',
                  color: active ? TEAL : '#374151',
                }}>
                <span className="w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all"
                  style={{ borderColor: active ? TEAL : '#d1d5db', backgroundColor: active ? TEAL : 'white' }}>
                  {active && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {product}
              </button>
            );
          })}
          <button onClick={toggleOther}
            className="py-3 px-4 rounded-xl text-sm font-semibold border-2 text-left transition-all flex items-center gap-2"
            style={{
              borderColor: showOther ? TEAL : '#e5e7eb',
              backgroundColor: showOther ? `${TEAL}12` : 'white',
              color: showOther ? TEAL : '#374151',
            }}>
            <span className="w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all"
              style={{ borderColor: showOther ? TEAL : '#d1d5db', backgroundColor: showOther ? TEAL : 'white' }}>
              {showOther && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            Other
          </button>
        </div>
        {showOther && (
          <input
            type="text"
            value={custom}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="e.g. NICFI Basemaps, Maxar…"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-100 transition"
            autoFocus
          />
        )}
      </div>
      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors">Back</button>
        <button onClick={onContinue} disabled={value.length === 0}
          className="px-8 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-40 transition-colors"
          style={{ backgroundColor: TEAL }}>Continue</button>
      </div>
    </div>
  );
}

// Convex document limit is 1 MB; leave headroom for other fields.
const MAX_GEOJSON_BYTES = 500 * 1024; // 500 KB

// ─── Step 4: Region ───────────────────────────────────────────────────────────
function StepRegion({ onFileLoad, onBack }: {
  onFileLoad: (name: string, geojson?: object) => void; onBack: () => void;
}) {
  const [regionText, setRegionText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function readAndLoad(file: File) {
    setFileError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'geojson' || ext === 'json') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const raw = ev.target?.result as string;
        if (new TextEncoder().encode(raw).length > MAX_GEOJSON_BYTES) {
          setFileError('The area is too large — please upload a smaller or simplified GeoJSON file (max 500 KB).');
          return;
        }
        try {
          const parsed = JSON.parse(raw);
          onFileLoad(file.name, parsed);
        } catch {
          onFileLoad(file.name); // parsing failed — fall back to name only
        }
      };
      reader.readAsText(file);
    } else {
      onFileLoad(file.name); // KML or other: name only
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) readAndLoad(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) readAndLoad(file);
  }

  function handleTextChange(val: string) {
    setRegionText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5`,
          { headers: { 'User-Agent': 'PlanetAgent/1.0' } }
        );
        const data: Array<{ display_name: string }> = await res.json();
        setSuggestions(data.map((d) => d.display_name));
      } catch {
        setSuggestions([]);
      }
    }, 350);
  }

  function selectSuggestion(s: string) {
    setRegionText(s);
    setSuggestions([]);
  }

  function handleTextContinue() {
    if (regionText.trim()) { setSuggestions([]); onFileLoad(regionText.trim()); }
  }

  const canContinue = !!regionText.trim();

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">What region are you interested in?</h2>
      <p className="text-sm text-gray-500 mb-6">Search for a place name or describe your region of interest.</p>
      <div className="bg-gray-100 rounded-2xl p-5 space-y-4">
        <div className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              value={regionText}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleTextContinue(); }}
              placeholder="Search a place (e.g. Amazon Basin, Mekong Delta…)"
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-100 transition"
            />
            <button onClick={handleTextContinue} disabled={!canContinue}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 transition-colors flex-shrink-0"
              style={{ backgroundColor: TEAL }}>
              Use
            </button>
          </div>
          {suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-14 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    onMouseDown={() => selectSuggestion(s)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="flex-1 border-t border-gray-300" />
          <span>or</span>
          <div className="flex-1 border-t border-gray-300" />
        </div>
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-2 bg-white border-2 border-dashed border-gray-300 rounded-xl px-4 py-5 cursor-pointer hover:border-cyan-400 transition-colors text-center"
        >
          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <span className="text-sm text-gray-500">Upload a GeoJSON file</span>
          <span className="text-xs text-gray-400">Drag &amp; drop or click to browse</span>
          <input type="file" accept=".geojson,.json" className="hidden" onChange={handleFileChange} />
        </label>
        {fileError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <span>{fileError}</span>
          </div>
        )}
      </div>
      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors">Back</button>
        <button onClick={handleTextContinue} disabled={!canContinue}
          className="px-8 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-40 transition-colors"
          style={{ backgroundColor: TEAL }}>Continue</button>
      </div>
    </div>
  );
}

// ─── Step 5: Location Loaded confirmation ─────────────────────────────────────

/** Compute a [minLng, minLat, maxLng, maxLat] bounding box from any GeoJSON object. */
function getBBox(obj: unknown): [number, number, number, number] | null {
  const pts: [number, number][] = [];
  function collect(o: unknown) {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) {
      if (o.length >= 2 && typeof o[0] === 'number' && typeof o[1] === 'number') {
        pts.push([o[0] as number, o[1] as number]);
      } else {
        o.forEach(collect);
      }
    } else {
      const r = o as Record<string, unknown>;
      if (r.coordinates) collect(r.coordinates);
      else if (r.geometry)  collect(r.geometry);
      else if (r.geometries) collect(r.geometries);
      else if (r.features)  collect(r.features);
    }
  }
  collect(obj);
  if (!pts.length) return null;
  const lngs = pts.map(([lng]) => lng);
  const lats = pts.map(([, lat]) => lat);
  return [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)];
}

function StepLocationLoaded({ fileName, geojson, onReupload, onBack, onContinue }: {
  fileName: string; geojson?: object; onReupload: () => void; onBack: () => void; onContinue: () => void;
}) {
  const bbox = geojson ? getBBox(geojson) : null;
  const geoType = geojson
    ? ((geojson as Record<string, unknown>).type as string) ?? null
    : null;

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Location Data Loaded</h2>
      <p className="text-sm text-gray-500 mb-6">Your region has been imported. Review the details below and continue to confirm.</p>
      <div className="bg-gray-100 rounded-2xl p-5 space-y-4">
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

        {/* Region preview — show parsed geometry info if available */}
        {bbox ? (
          <div className="rounded-xl bg-white border border-gray-200 px-5 py-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: TEAL }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
              <span className="text-xs font-semibold text-gray-700">Geometry Parsed</span>
              {geoType && (
                <span className="ml-auto text-xs font-mono px-2 py-0.5 rounded-full bg-teal-50 border border-teal-100" style={{ color: TEAL }}>
                  {geoType}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-600">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <span className="block text-gray-400 mb-0.5">West / East</span>
                {bbox[0].toFixed(4)}° → {bbox[2].toFixed(4)}°
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <span className="block text-gray-400 mb-0.5">South / North</span>
                {bbox[1].toFixed(4)}° → {bbox[3].toFixed(4)}°
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden bg-gray-200 h-32 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-8 h-8 text-gray-400 mx-auto mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
              <p className="text-xs text-gray-500">Region: {fileName}</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
          <span className="text-xs text-gray-500">Not the right area?</span>
          <button onClick={onReupload} className="text-xs font-medium hover:underline transition-colors" style={{ color: TEAL }}>
            Re-upload file
          </button>
        </div>
      </div>
      <div className="flex justify-between pt-6">
        <button onClick={onBack} className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors">Back</button>
        <button onClick={onContinue}
          className="px-8 py-2.5 rounded-full text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: TEAL }}>Confirm & Continue</button>
      </div>
    </div>
  );
}

// ─── Step 6: Loading interstitial ─────────────────────────────────────────────
function StepLoading({
  useCase, region, startDate, endDate, planetProduct, onDone,
}: {
  useCase: string; region: string; startDate: string; endDate: string; planetProduct: string;
  onDone: (questions: string[]) => void;
}) {
  useEffect(() => {
    fetchAIQuestions(useCase, region, startDate, endDate, planetProduct).then(onDone);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

// ─── Step 7: Follow-up questions with dot navigation ─────────────────────────
function StepQuestions({
  questions, answers, currentIdx,
  regenerating, generatingNext,
  attachments,
  onAnswer, onAdvance, onSetIdx, onBack, onAttach, onRemoveAttachment, onRegenerate,
}: {
  questions: string[];
  answers: string[];
  currentIdx: number;
  regenerating: boolean;
  generatingNext: boolean;
  attachments: Record<number, { name: string; content: string }>;
  onAnswer: (idx: number, val: string) => void;
  onAdvance: (idx: number) => void;
  onSetIdx: (idx: number) => void;
  onBack: () => void;
  onAttach: (idx: number, file: { name: string; content: string }) => void;
  onRemoveAttachment: (idx: number) => void;
  onRegenerate: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const questionLoaded = !!questions[currentIdx];
  const canContinue = questionLoaded && !!answers[currentIdx]?.trim() && !generatingNext;
  const attachment = attachments[currentIdx];

  // Dots: one per answered question + current + loading dot if fetching next
  const dotCount = Math.max(questions.length, currentIdx + 1);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = (ev.target?.result as string) ?? '';
      onAttach(currentIdx, { name: file.name, content });
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Follow-up Question {currentIdx + 1}
        </span>
        <button
          onClick={onRegenerate}
          disabled={regenerating || !questionLoaded}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border transition-all disabled:opacity-50"
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
              Regenerate
            </>
          )}
        </button>
      </div>

      {/* Dynamic progress dots */}
      <div className="flex items-center justify-center mb-7">
        {Array.from({ length: dotCount }).map((_, i) => {
          const answered = i < currentIdx || (i === currentIdx && !!answers[i]?.trim());
          const isCurrent = i === currentIdx;
          return (
            <div key={i} className="flex items-center">
              <button
                onClick={() => i < currentIdx ? onSetIdx(i) : undefined}
                disabled={i >= currentIdx}
                className="rounded-full transition-all duration-200 focus:outline-none"
                style={{
                  width: isCurrent ? 14 : 10,
                  height: isCurrent ? 14 : 10,
                  backgroundColor: answered || isCurrent ? TEAL : 'white',
                  border: `2px solid ${answered || isCurrent ? TEAL : '#d1d5db'}`,
                  cursor: i < currentIdx ? 'pointer' : 'default',
                }}
              />
              {i < dotCount - 1 && (
                <div className="h-0.5 w-8 transition-all duration-300"
                  style={{ backgroundColor: i < currentIdx ? TEAL : '#e5e7eb' }} />
              )}
            </div>
          );
        })}
        {/* Loading dot when fetching next question */}
        {generatingNext && (
          <div className="flex items-center">
            <div className="h-0.5 w-8" style={{ backgroundColor: '#e5e7eb' }} />
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: TEAL, opacity: 0.5 }} />
          </div>
        )}
      </div>

      {!questionLoaded ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: `${TEAL} ${TEAL} ${TEAL} transparent` }} />
          <p className="text-sm text-gray-400">Generating next question…</p>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {regenerating ? '…' : questions[currentIdx]}
          </h2>
          <div className="bg-gray-100 rounded-2xl p-5 space-y-3">
            <textarea
              key={`${currentIdx}-${questions[currentIdx]}`}
              value={answers[currentIdx] ?? ''}
              onChange={(e) => onAnswer(currentIdx, e.target.value)}
              placeholder="Type your answer here…"
              rows={5}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-100 resize-none transition"
            />

            {/* File attachment area */}
            {attachment ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600">
                <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                </svg>
                <span className="flex-1 truncate font-medium">{attachment.name}</span>
                <button onClick={() => onRemoveAttachment(currentIdx)} className="text-gray-400 hover:text-red-500 transition-colors ml-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".txt,.csv,.json,.geojson,.kml,.md,.ipynb,.py"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                  </svg>
                  Attach a file (CSV, GeoJSON, notebook, etc.)
                </button>
              </>
            )}
          </div>
        </>
      )}

      <div className="flex justify-between pt-6">
        <button
          onClick={currentIdx > 0 ? () => onSetIdx(currentIdx - 1) : onBack}
          className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onAdvance(currentIdx + 1)}
          disabled={!canContinue}
          className="px-8 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-40 transition-colors"
          style={{ backgroundColor: TEAL }}
        >
          {generatingNext ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Thinking…
            </span>
          ) : 'Continue'}
        </button>
      </div>
    </div>
  );
}

// ─── Title helpers ────────────────────────────────────────────────────────────
const TC_SKIP = new Set(['a','an','the','and','but','or','for','nor','on','at','to','by','in','of','up','as','is']);
function toTitleCase(str: string): string {
  return str.split(' ').map((w, i, arr) =>
    i === 0 || i === arr.length - 1 || !TC_SKIP.has(w.toLowerCase())
      ? w.charAt(0).toUpperCase() + w.slice(1)
      : w.toLowerCase()
  ).join(' ');
}

function extractTitle(useCase: string): string {
  const line = useCase.trim().split('\n')[0].trim();
  const stripped = line
    // remove "I want/need/would like/am trying to [verb]" openers
    .replace(/^i\s+(want|need|would\s+like|am\s+trying|am\s+looking|hope|plan|wish)\s+(to\s+)?/i, '')
    // remove a leading action verb if that's now the first word
    .replace(/^(detect|identify|track|monitor|map|analyze|analyse|study|assess|measure|find|locate|understand|build|create|develop)\s+/i, '')
    .trim();
  return toTitleCase((stripped || line).slice(0, 55)) || 'New Workflow';
}

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #FF7043 0%, #BF360C 100%)',
  'linear-gradient(135deg, #66BB6A 0%, #1B5E20 100%)',
  'linear-gradient(135deg, #42A5F5 0%, #0D47A1 100%)',
  'linear-gradient(135deg, #AB47BC 0%, #4A148C 100%)',
  'linear-gradient(135deg, #FFA726 0%, #E65100 100%)',
  'linear-gradient(135deg, #26C6DA 0%, #006064 100%)',
  'linear-gradient(135deg, #EC407A 0%, #880E4F 100%)',
  'linear-gradient(135deg, #9CCC65 0%, #33691E 100%)',
  'linear-gradient(135deg, #5C6BC0 0%, #1A237E 100%)',
  'linear-gradient(135deg, #26A69A 0%, #004D40 100%)',
  'linear-gradient(135deg, #FFCA28 0%, #F57F17 100%)',
  'linear-gradient(135deg, #FF5252 0%, #B71C1C 100%)',
];

function pickGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  return CARD_GRADIENTS[Math.abs(h) % CARD_GRADIENTS.length];
}

// ─── Step 8: Summary + workflow creation ──────────────────────────────────────
function StepSummary({ useCase, startDate, endDate, frequency, fileName, regionGeoJSON, planetProduct, answers, questions, onStartOver, onEditAnswers }: {
  useCase: string;
  startDate: string;
  endDate: string;
  frequency: string;
  fileName: string;
  regionGeoJSON?: object;
  planetProduct: string;
  answers: string[];
  questions: string[];
  onStartOver: () => void;
  onEditAnswers: () => void;
}) {
  const router = useRouter();
  const createConvexWorkflow = useMutation(api.workflows.createWorkflow);
  const [workflowName, setWorkflowName] = useState(
    () => extractTitle(useCase) || 'New Workflow'
  );
  const [creating, setCreating] = useState(false);
  const [generatingMeta, setGeneratingMeta] = useState(true);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const intakeRef = useRef<IntakeJSON | null>(null);

  useEffect(() => {
    const initialTitle = extractTitle(useCase) || 'New Workflow';

    Promise.allSettled([
      fetch('/api/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCase, region: fileName, startDate, endDate }),
      }).then((r) => r.json()),
      fetch('/api/synthesize-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCaseDescription: useCase, region: fileName, startDate, endDate, frequency, planetProduct, questions, answers }),
      }).then((r) => r.json()),
    ]).then(([metaResult, intakeResult]) => {
      const aiName = metaResult.status === 'fulfilled' && metaResult.value?.name
        ? toTitleCase(metaResult.value.name)
        : null;
      if (aiName) setWorkflowName(aiName);
      if (intakeResult.status === 'fulfilled' && intakeResult.value?.intake) {
        intakeRef.current = intakeResult.value.intake;
      }
      // Fetch image using the same name the dashboard card will use
      const imageQuery = aiName ?? initialTitle;
      fetch(`/api/workflow-image?name=${encodeURIComponent(imageQuery)}&limit=1`)
        .then((r) => r.json())
        .then(({ urls }: { urls: string[] }) => { if (urls?.length) setPhotoUrl(urls[0]); })
        .catch(() => {});
    }).finally(() => setGeneratingMeta(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate() {
    const user = getCurrentUser();
    if (!user?.convexUserId || !workflowName.trim()) return;
    setCreating(true);
    try {
      const intake = intakeRef.current;
      // If the user uploaded a GeoJSON file, use its real geometry directly.
      // Otherwise fall back to what synthesize-intake produced (place-name only → empty coords).
      const regionForWorkflow = regionGeoJSON
        ? { ...regionGeoJSON, description: intake?.region?.description ?? fileName }
        : (intake?.region ?? { description: fileName });

      const convexId = await createConvexWorkflow({
        userId: user.convexUserId as Id<'users'>,
        useCase: workflowName.trim(),
        timeFrame: inferTimeFrame(startDate, endDate),
        dataFrequency: mapFrequency(frequency),
        region: regionForWorkflow,
        dateRange: { start: startDate, end: endDate },
        temporalResolution: mapTemporalResolution(intake?.temporal_resolution),
        planetProduct: planetProduct,
        inferredIntent: intake?.inferred_intent,
        userDescription: intake?.user_description,
        constraints: intake?.constraints,
        followUpQA: questions.map((q, i) => ({ question: q, answer: answers[i] || '' })),
        notebookCells: [],
        sourceNotebooks: [],
      });
      router.push(`/workflow/${convexId}`);
    } finally {
      setCreating(false);
    }
  }

  const summaryRows = [
    { label: 'Use Case', value: useCase || '—' },
    { label: 'Time Frame', value: startDate && endDate ? `${startDate} → ${endDate}${frequency ? ` (${frequency})` : ''}` : '—' },
    { label: 'Planet Product', value: planetProduct || '—' },
    { label: 'Region', value: fileName || '—' },
    ...questions.map((q, i) => ({ label: `Q${i + 1}: ${q.slice(0, 40)}…`, value: answers[i] || '—' })),
  ];

  const gradient = pickGradient(workflowName);

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Workflow</h2>
      <p className="text-sm text-gray-500 mb-6">Review your inputs and name your workflow.</p>

      <div className="bg-gray-100 rounded-2xl p-5 space-y-3 mb-4">
        {summaryRows.map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl px-4 py-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
            <div className="text-sm text-gray-800 line-clamp-2">{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-gray-100 rounded-2xl p-5 mb-2 flex gap-4 items-start">
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
          {generatingMeta ? (
            <div className="w-full h-full bg-gray-200 animate-pulse" />
          ) : photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt="card preview"
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full" style={{ background: gradient }} />
          )}
        </div>
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Workflow Name
            {generatingMeta && <span className="ml-2 text-gray-400 font-normal normal-case tracking-normal">Generating…</span>}
          </label>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="e.g. Amazon Deforestation Analysis"
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-100 transition"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <div className="flex gap-2">
          <button onClick={onStartOver}
            className="px-6 py-2.5 rounded-full text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors">
            Start Over
          </button>
          <button onClick={onEditAnswers}
            className="px-6 py-2.5 rounded-full text-sm font-medium border transition-colors"
            style={{ color: TEAL, borderColor: TEAL }}>
            Edit Answers
          </button>
        </div>
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

const MAX_QUESTIONS = 5;
// Sufficiency check starts after this many questions have been answered
const SUFFICIENCY_CHECK_AFTER = 2;

// ─── Root page ────────────────────────────────────────────────────────────────
export default function IntakePage() {
  const [step, setStep] = useState(1);

  const [useCase, setUseCase] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('');
  const [planetProduct, setPlanetProduct] = useState<string[]>([]);
  const [regionFileName, setRegionFileName] = useState('');
  
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<Record<number, { name: string; content: string }>>({});
  
  const [regionGeoJSON, setRegionGeoJSON] = useState<object | null>(null);
 
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [generatingNext, setGeneratingNext] = useState(false);

  function setAnswer(idx: number, val: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  }

  function handleAttach(idx: number, file: { name: string; content: string }) {
    setAttachments((prev) => ({ ...prev, [idx]: file }));
  }

  function handleRemoveAttachment(idx: number) {
    setAttachments((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  }

  function buildAttachedFiles(upToIndex: number) {
    return Object.entries(attachments)
      .filter(([i]) => parseInt(i) <= upToIndex)
      .map(([, file]) => ({ name: file.name, content: file.content }));
  }

  async function fetchAdaptiveQuestion(
    forIndex: number,
    currentQuestions: string[],
    currentAnswers: string[],
    currentUseCase: string,
    currentRegion: string,
    currentProduct: string,
  ): Promise<'done' | 'question'> {
    setGeneratingNext(true);
    const previousQA = currentQuestions
      .slice(0, forIndex)
      .map((question, i) => ({ question, answer: currentAnswers[i] || '' }))
      .filter(({ answer }) => answer.trim());
    const checkSufficiency = forIndex >= SUFFICIENCY_CHECK_AFTER && forIndex < MAX_QUESTIONS;
    try {
      const res = await fetch('/api/intake-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCase: currentUseCase,
          region: currentRegion,
          dateRange: `${startDate} to ${endDate}`,
          planetProduct: currentProduct,
          singleQuestion: true,
          existingQuestions: currentQuestions.slice(0, forIndex),
          previousQA,
          checkSufficiency,
          attachedFiles: buildAttachedFiles(forIndex - 1),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.done) {
          setGeneratingNext(false);
          setStep(8);
          return 'done';
        }
        const q: string = data.questions?.[0];
        if (q) {
          setAiQuestions((prev) => {
            const next = [...prev];
            next[forIndex] = q;
            return next;
          });
          setAnswers((prev) => {
            if (prev.length > forIndex) return prev;
            const next = [...prev];
            next[forIndex] = '';
            return next;
          });
        }
      }
    } catch {}
    setGeneratingNext(false);
    return 'question';
  }

  async function handleRegenerate() {
    setRegenerating(true);
    const previousQA = aiQuestions
      .slice(0, currentQIdx)
      .map((question, i) => ({ question, answer: answers[i] || '' }))
      .filter(({ answer }) => answer.trim());
    try {
      const res = await fetch('/api/intake-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCase,
          region: regionFileName,
          dateRange: `${startDate} to ${endDate}`,
          planetProduct: planetProduct.join(', '),
          singleQuestion: true,
          existingQuestions: aiQuestions,
          replaceIndex: currentQIdx,
          previousQA,
          attachedFiles: buildAttachedFiles(currentQIdx),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const replacement: string = data.questions?.[0];
        if (replacement) {
          setAiQuestions((prev) => prev.map((q, i) => (i === currentQIdx ? replacement : q)));
          setAnswer(currentQIdx, '');
        }
      }
    } catch {}
    setRegenerating(false);
  }

  function handleAdvance(toIdx: number) {
    if (toIdx >= MAX_QUESTIONS) {
      setStep(8);
      return;
    }
    setCurrentQIdx(toIdx);
    if (!aiQuestions[toIdx]) {
      fetchAdaptiveQuestion(toIdx, aiQuestions, answers, useCase, regionFileName, planetProduct.join(', '));
    }
  }

  function enterQuestions() {
    setAiQuestions([]);
    setAnswers([]);
    setAttachments({});
    setCurrentQIdx(0);
    setStep(7);
    fetchAdaptiveQuestion(0, [], [], useCase, regionFileName, planetProduct.join(', '));
  }

  function reset() {
    setStep(1);
    setUseCase('');
    setStartDate('');
    setEndDate('');
    setFrequency('');
    setPlanetProduct([]);
    setRegionFileName('');
    
    setAiQuestions([]);
    setAnswers([]);
    setAttachments({});
    
    setRegionGeoJSON(null);
    
    setCurrentQIdx(0);
  }

  function handleFileLoad(name: string, geojson?: object) {
    setRegionFileName(name);
    setRegionGeoJSON(geojson ?? null);
    setStep(5);
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
          <StepPlanetProduct
            value={planetProduct} onChange={setPlanetProduct}
            onBack={() => setStep(2)} onContinue={() => setStep(4)}
          />
        )}

        {step === 4 && (
          <StepRegion onFileLoad={handleFileLoad} onBack={() => setStep(3)} />
        )}

        {step === 5 && (
          <StepLocationLoaded
            fileName={regionFileName}
            geojson={regionGeoJSON ?? undefined}
            onReupload={() => { setRegionFileName(''); setRegionGeoJSON(null); setStep(4); }}
            onBack={() => setStep(4)}
            onContinue={enterQuestions}
          />
        )}

        {step === 7 && (
          <StepQuestions
            questions={aiQuestions}
            answers={answers}
            currentIdx={currentQIdx}
            regenerating={regenerating}
            generatingNext={generatingNext}
            attachments={attachments}
            onAnswer={setAnswer}
            onAdvance={handleAdvance}
            onSetIdx={setCurrentQIdx}
            onBack={() => setStep(5)}
            onAttach={handleAttach}
            onRemoveAttachment={handleRemoveAttachment}
            onRegenerate={handleRegenerate}
          />
        )}

        {step === 8 && (
          <StepSummary
            useCase={useCase}
            startDate={startDate}
            endDate={endDate}
            frequency={frequency}
            fileName={regionFileName}
            regionGeoJSON={regionGeoJSON ?? undefined}
            planetProduct={planetProduct.join(', ')}
            answers={answers}
            questions={aiQuestions}
            onStartOver={reset}
            onEditAnswers={() => {
              setCurrentQIdx(aiQuestions.length - 1);
              setStep(7);
            }}
          />
        )}

      </main>
    </div>
  );
}
