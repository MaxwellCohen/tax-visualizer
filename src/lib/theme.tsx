import { createContext, useContext, onMount, createEffect, type ParentComponent } from "solid-js";
import { createSignal } from "solid-js";
import { isServer } from "solid-js/web";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: () => Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>();

export const ThemeProvider: ParentComponent = (props) => {
  const [theme, setTheme] = createSignal<Theme>("light");

  onMount(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  });

  createEffect(() => {
    if (isServer) return;
    const t = theme();
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("theme", t);
  });

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {props.children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
