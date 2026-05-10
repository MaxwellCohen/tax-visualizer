import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "~/lib/ui/theme";
import {
  stubMatchMediaPrefersDark,
  stubMatchMediaStatic,
  stubThemeLocalStorage,
} from "~/lib/ui/theme.test.helpers";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme()}</span>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
    </div>
  );
}

function MissingProvider() {
  useTheme();
  return null;
}

describe("theme", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("data-theme");
  });

  it("throws if useTheme is used outside ThemeProvider", () => {
    expect(() => render(() => <MissingProvider />)).toThrow(/ThemeProvider/);
  });

  it("reads theme from localStorage on mount", () => {
    const store: Record<string, string> = { theme: "dark" };
    stubThemeLocalStorage(store);
    stubMatchMediaStatic(false);

    render(() => (
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    ));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("falls back to prefers-color-scheme when storage unset", () => {
    const store: Record<string, string> = {};
    stubThemeLocalStorage(store);
    stubMatchMediaPrefersDark();

    render(() => (
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    ));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("toggleTheme flips light/dark", () => {
    const store: Record<string, string> = {};
    stubThemeLocalStorage(store);
    stubMatchMediaStatic(false);

    render(() => (
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    ));
    expect(screen.getByTestId("theme").textContent).toBe("light");
    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });
});
