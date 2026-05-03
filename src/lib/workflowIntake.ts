const INTAKE_KEY = 'planet_workflow_intake';

export interface IntakeJSON {
  region: {
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: { type: 'Polygon'; coordinates: unknown[] };
    description: string;
  };
  date_range: { start: string; end: string };
  temporal_resolution: string;
  planet_product: string;
  use_case: string;
  user_description: string;
  inferred_intent: string;
  constraints: string[];
}

export function storeWorkflowIntake(workflowId: string, intake: IntakeJSON): void {
  try {
    const store: Record<string, IntakeJSON> = JSON.parse(localStorage.getItem(INTAKE_KEY) || '{}');
    store[workflowId] = intake;
    localStorage.setItem(INTAKE_KEY, JSON.stringify(store));
  } catch {}
}

export function getWorkflowIntake(workflowId: string): IntakeJSON | null {
  try {
    const store: Record<string, IntakeJSON> = JSON.parse(localStorage.getItem(INTAKE_KEY) || '{}');
    return store[workflowId] ?? null;
  } catch {
    return null;
  }
}
