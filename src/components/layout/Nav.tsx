import { useLocation } from "@solidjs/router";
import ThemeToggle from "~/components/layout/ThemeToggle";

export default function Nav() {
  const location = useLocation();
  const isActive = (path: string) => path === location.pathname;

  return (
    <nav class="border-b border-border bg-surface">
      <div class="mx-auto flex max-w-6xl items-center px-4 py-3">
        <a
          href="/"
          class="text-xs font-semibold tracking-[0.2em] uppercase text-foreground font-heading"
        >
          Tax Visualizer
        </a>

        <div class="ml-auto flex items-center gap-6">
          <a
            href="/"
            class={`text-sm border-b pb-0.5 transition-colors duration-150 ${
              isActive("/") ? "border-accent text-accent" : "border-transparent text-muted-foreground"
            }`}
          >
            Home
          </a>
          <a
            href="/about"
            class={`text-sm border-b pb-0.5 transition-colors duration-150 ${
              isActive("/about") ? "border-accent text-accent" : "border-transparent text-muted-foreground"
            }`}
          >
            Methodology
          </a>
          <div class="ml-2 border-l border-border pl-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
