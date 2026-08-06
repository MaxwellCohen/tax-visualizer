import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import { solidStart } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import devtools from "solid-devtools/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    host: true
  },
  resolve: {
    alias: [
      {
        // Exact match only — a string alias would also rewrite `source-map-js/source-map.js`.
        find: /^source-map-js$/,
        replacement: path.resolve(rootDir, "src/shims/source-map-js.ts"),
      },
    ],
  },
  plugins: [
    devtools({ autoname: true }),
    solidStart(),
    tailwindcss(),
    nitro()
  ],
  nitro: {
    preset: "vercel"
  }
});
