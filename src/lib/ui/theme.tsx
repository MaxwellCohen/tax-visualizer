import { createContext, useContext, onSettled, createEffect, createSignal, type ParentComponent } from "solid-js";
import { isServer } from "@solidjs/web";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: () => Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>();

export const ThemeProvider: ParentComponent = (props) => {
  const [theme, setTheme] = createSignal<Theme>("light");
  let persistTheme = false;

  onSettled(() => {
    if (isServer) return;
    const stored = localStorage.getItem("theme");
    const next: Theme =
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    persistTheme = true;
    setTheme(next);
  });

  createEffect(
    () => (isServer ? undefined : theme()),
    (t) => {
      if (t == null || !persistTheme) return;
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("theme", t);
    },
  );

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext value={{ theme, toggleTheme }}>
      {props.children}
    </ThemeContext>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
