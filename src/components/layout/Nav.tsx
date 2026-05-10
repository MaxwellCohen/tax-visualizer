import { useLocation } from "@solidjs/router";
import ThemeToggle from "~/components/layout/ThemeToggle";

export default function Nav() {
  const location = useLocation();
  const isActive = (path: string) => path === location.pathname;

  return (
    <nav class="border-b border-(--color-border)" style={{ background: "var(--color-surface)" }}>
      <div class="mx-auto flex max-w-6xl items-center px-4 py-3">
        <a
          href="/"
          class="text-xs font-semibold tracking-[0.2em] uppercase"
          style={{
            "font-family": "var(--font-heading)",
            color: "var(--color-foreground)",
          }}
        >
          Tax Visualizer
        </a>

        <div class="ml-auto flex items-center gap-6">
          <a
            href="/"
            class="text-sm transition-colors duration-150"
            style={{
              color: isActive("/") ? "var(--color-accent)" : "var(--color-muted-foreground)",
              "border-bottom": isActive("/") ? "1px solid var(--color-accent)" : "1px solid transparent",
              "padding-bottom": "2px",
            }}
          >
            Home
          </a>
          <a
            href="/about"
            class="text-sm transition-colors duration-150"
            style={{
              color: isActive("/about") ? "var(--color-accent)" : "var(--color-muted-foreground)",
              "border-bottom": isActive("/about") ? "1px solid var(--color-accent)" : "1px solid transparent",
              "padding-bottom": "2px",
            }}
          >
            Methodology
          </a>
          <div class="ml-2 border-l border-(--color-border) pl-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
