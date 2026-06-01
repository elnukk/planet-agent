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
