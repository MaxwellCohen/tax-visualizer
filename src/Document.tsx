import type { ParentProps } from "solid-js";
import { HydrationScript } from "@solidjs/web";
import outfitLatin from "@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2?url";
import sourceSansLatin from "@fontsource-variable/source-sans-3/files/source-sans-3-latin-wght-normal.woff2?url";
import { WEB_APPLICATION_JSON_LD } from "~/lib/site/meta";

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t}else if(window.matchMedia("(prefers-color-scheme:dark)").matches){document.documentElement.dataset.theme="dark"}}catch(e){}})()`;

export default function Document(props: ParentProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Tax Visualizer" />
        <link rel="preload" href={outfitLatin} as="font" type="font/woff2" crossorigin="anonymous" />
        <link rel="preload" href={sourceSansLatin} as="font" type="font/woff2" crossorigin="anonymous" />
        <script textContent={themeInitScript} />
        <script type="application/ld+json" textContent={WEB_APPLICATION_JSON_LD} />
        <HydrationScript />
      </head>
      <body>{props.children}</body>
    </html>
  );
}
