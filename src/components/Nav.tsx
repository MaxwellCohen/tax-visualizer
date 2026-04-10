import { useLocation } from "@solidjs/router";
import ThemeToggle from "~/components/ThemeToggle";

export default function Nav() {
  const location = useLocation();
  const isActive = (path: string) => path === location.pathname;

  return (
    <nav class="border-b border-(--border)" style={{ background: "var(--surface)" }}>
      <div class="mx-auto flex max-w-6xl items-center px-4 py-3">
        <a
          href="/"
          class="text-xs font-semibold tracking-[0.2em] uppercase"
          style={{
            "font-family": "var(--font-heading)",
            color: "var(--text)",
          }}
        >
          Tax Visualizer
        </a>

        <div class="ml-auto flex items-center gap-6">
          <a
            href="/"
            class="text-sm transition-colors duration-150"
            style={{
              color: isActive("/") ? "var(--accent)" : "var(--text-muted)",
              "border-bottom": isActive("/") ? "1px solid var(--accent)" : "1px solid transparent",
              "padding-bottom": "2px",
            }}
          >
            Home
          </a>
          <a
            href="/about"
            class="text-sm transition-colors duration-150"
            style={{
              color: isActive("/about") ? "var(--accent)" : "var(--text-muted)",
              "border-bottom": isActive("/about") ? "1px solid var(--accent)" : "1px solid transparent",
              "padding-bottom": "2px",
            }}
          >
            Methodology
          </a>
          <div class="ml-2 border-l border-(--border) pl-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
