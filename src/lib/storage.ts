import type { FlyerState } from '../types';

const KEY = 'cyon-flyer-studio-v1';

export interface Draft {
  state?: Partial<FlyerState>;
  dataUrl?: string;
  logoDataUrl?: string;
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDraft(state: FlyerState, dataUrl: string | null, logoDataUrl?: string | null): void {
  const payload = {
    state,
    dataUrl: dataUrl ?? undefined,
    logoDataUrl: logoDataUrl ?? undefined,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // Quota exceeded — keep the text fields at least.
    try {
      localStorage.setItem(KEY, JSON.stringify({ state }));
    } catch {
      /* storage unavailable; ignore */
    }
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
