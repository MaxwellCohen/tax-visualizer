// fallow-ignore-file unused-file
import { A } from "@solidjs/router";
import { NotFoundSeo } from "~/components/seo/Seo";

export default function NotFound() {
  return (
    <main class="mx-auto max-w-2xl px-4 py-16 text-center">
      <NotFoundSeo />
      <p class="text-sm font-semibold uppercase tracking-[0.15em] text-accent">
        404
      </p>
      <h1 class="mt-3 text-4xl font-light tracking-tight text-foreground font-heading">
        Page not found
      </h1>
      <p class="mt-4 text-sm text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <div class="mt-10 flex items-center justify-center gap-4 text-sm text-faint-foreground">
        <A
          href="/"
          class="text-accent underline underline-offset-2 transition-colors duration-150"
        >
          Home
        </A>
        <span aria-hidden="true">&middot;</span>
        <A
          href="/about"
          class="text-accent underline underline-offset-2 transition-colors duration-150"
        >
          About
        </A>
      </div>
    </main>
  );
}
