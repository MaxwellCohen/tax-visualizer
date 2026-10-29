import { useLocation } from "@solidjs/router";
import ThemeToggle from "~/components/layout/ThemeToggle";

export default function Nav() {
  const location = useLocation();
  const isActive = (path: string) => path === location.pathname;

  return (
    <nav class="border-b border-border bg-surface">
      <a
        href="#main-content"
        class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2 focus:text-sm focus:text-accent"
      >
        Skip to content
      </a>
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <a
          href="/"
          class="text-xs font-semibold tracking-[0.2em] uppercase text-foreground font-heading"
        >
          Tax Visualizer
        </a>

        <div class="flex items-center gap-x-4 max-sm:order-last max-sm:w-full sm:ml-auto sm:gap-x-6">
          <a
            href="/"
            class={`text-sm border-b py-1.5 transition-colors duration-150 ${
              isActive("/") ? "border-accent text-accent" : "border-transparent text-muted-foreground"
            }`}
          >
            Home
          </a>
          <a
            href="/withholding"
            class={`text-sm border-b py-1.5 transition-colors duration-150 ${
              isActive("/withholding") ? "border-accent text-accent" : "border-transparent text-muted-foreground"
            }`}
          >
            Withholding
          </a>
          <a
            href="/about"
            class={`text-sm border-b py-1.5 transition-colors duration-150 ${
              isActive("/about") ? "border-accent text-accent" : "border-transparent text-muted-foreground"
            }`}
          >
            Methodology
          </a>
          <div class="ml-auto border-l border-border pl-4 sm:ml-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
