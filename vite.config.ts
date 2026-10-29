import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import solid from "@solidjs/vite-plugin";
import { fileRoutes } from "filesystem-routing/vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
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
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src/pwa",
      filename: "sw.ts",
      registerType: "autoUpdate",
      // Registered from app.tsx; there is no index.html to inject into.
      injectRegister: false,
      pwaAssets: { config: true, injectThemeColor: false },
      integration: {
        // Nitro writes client assets to the client environment's outDir, not build.outDir.
        configureOptions(viteConfig, options) {
          const clientOutDir = path.resolve(
            viteConfig.root,
            viteConfig.environments.client.build.outDir,
          );
          options.outDir = clientOutDir;
          if (typeof options.pwaAssets === "object") {
            options.pwaAssets.integration = { outDir: clientOutDir };
          }
        },
      },
      manifest: {
        id: "/",
        name: "US Tax Visualizer",
        short_name: "Tax Visualizer",
        description:
          "Interactive US federal and state tax explorer: brackets, payroll taxes, deductions, and take-home pay.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#0d9488",
        background_color: "#0f766e",
        categories: ["finance", "education", "utilities"],
        shortcuts: [{ name: "Paycheck withholding", url: "/withholding" }],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,svg,png,ico,woff2}"],
      },
    }),
  ],
  nitro: {
    // API routes, /openapi.json, /llms-full.txt (`src/routes` is the Solid app router).
    serverDir: "./server",
    preset: "vercel",
    vercel: {
      functions: { runtime: "nodejs24.x" },
    },
  },
});
