const IMAGES_KEY = 'planet_workflow_images';
const IMAGE_LIST_KEY = 'planet_workflow_image_lists';

export function storeWorkflowImage(workflowId: string, url: string): void {
  try {
    const store: Record<string, string> = JSON.parse(localStorage.getItem(IMAGES_KEY) || '{}');
    store[workflowId] = url;
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

export function storeWorkflowImageList(workflowId: string, urls: string[]): void {
  try {
    const store: Record<string, string[]> = JSON.parse(localStorage.getItem(IMAGE_LIST_KEY) || '{}');
    store[workflowId] = urls;
    localStorage.setItem(IMAGE_LIST_KEY, JSON.stringify(store));
  } catch {}
}

export function getWorkflowImageList(workflowId: string): string[] {
  try {
    const store: Record<string, string[]> = JSON.parse(localStorage.getItem(IMAGE_LIST_KEY) || '{}');
    return store[workflowId] ?? [];
  } catch {
    return [];
  }
}

export function deleteWorkflowImage(workflowId: string): void {
  try {
    const store: Record<string, string> = JSON.parse(localStorage.getItem(IMAGES_KEY) || '{}');
    delete store[workflowId];
    localStorage.setItem(IMAGES_KEY, JSON.stringify(store));
    const listStore: Record<string, string[]> = JSON.parse(localStorage.getItem(IMAGE_LIST_KEY) || '{}');
    delete listStore[workflowId];
    localStorage.setItem(IMAGE_LIST_KEY, JSON.stringify(listStore));
  } catch {}
}
