import { vi } from "vitest";

/** Minimal `localStorage` double for theme tests (in-memory store). */
function createThemeTestLocalStorage(store: Record<string, string>) {
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    key: () => null,
    length: 0,
  };
}

export function stubThemeLocalStorage(store: Record<string, string>) {
  vi.stubGlobal("localStorage", createThemeTestLocalStorage(store));
}

export function stubMatchMediaStatic(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  );
}

export function stubMatchMediaPrefersDark() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((q: string) => ({
      matches: q.includes("prefers-color-scheme: dark"),
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}
