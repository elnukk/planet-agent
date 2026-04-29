const IMAGES_KEY = 'planet_workflow_images';

export function storeWorkflowImage(workflowId: string, dataUrl: string): void {
  try {
    const store: Record<string, string> = JSON.parse(localStorage.getItem(IMAGES_KEY) || '{}');
    store[workflowId] = dataUrl;
    localStorage.setItem(IMAGES_KEY, JSON.stringify(store));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

export function getWorkflowImage(workflowId: string): string | null {
  try {
    const store: Record<string, string> = JSON.parse(localStorage.getItem(IMAGES_KEY) || '{}');
    return store[workflowId] ?? null;
  } catch {
    return null;
  }
}

export function deleteWorkflowImage(workflowId: string): void {
  try {
    const store: Record<string, string> = JSON.parse(localStorage.getItem(IMAGES_KEY) || '{}');
    delete store[workflowId];
    localStorage.setItem(IMAGES_KEY, JSON.stringify(store));
  } catch {
    // fail silently
  }
}
