import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import solid from "@solidjs/vite-plugin";
import { fileRoutes } from "filesystem-routing/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    host: true,
  },
  resolve: {
    alias: {
      "~": path.resolve(rootDir, "src"),
    },
  },
  plugins: [
    solid({
      start: true,
      ssr: true,
      diagnostics: true,
      extensions: [".jsx", ".tsx"],
    }),
    fileRoutes({ types: true }),
    tailwindcss(),
    nitro({ serverEntry: false }),
  ],
  nitro: {
    preset: "vercel",
    vercel: {
      functions: { runtime: "nodejs24.x" },
    },
  },
});
