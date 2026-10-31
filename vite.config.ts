import { defineConfig, loadEnv } from "vite";
import { nitro } from "nitro/vite";
import solid from "@solidjs/vite-plugin";
import { fileRoutes } from "filesystem-routing/vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
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
        // Fontsource ships every script subset; precache latin only (others load on demand via unicode-range).
        globIgnores: ["**/*-{latin-ext,cyrillic,cyrillic-ext,vietnamese,greek,greek-ext}-*.woff2"],
      },
    }),
  ],
  nitro: {
    // API routes, /openapi.json, /llms-full.txt (`src/routes` is the Solid app router).
    serverDir: "./server",
    preset: "vercel",
    // Pages and origin-independent endpoints are built once and served from the CDN.
    // /.well-known/mcp.json derives its URL from the request origin, so it stays dynamic.
    prerender: {
      routes: ["/", "/about", "/withholding", "/api/years", "/openapi.json", "/llms-full.txt"],
      crawlLinks: true,
      failOnError: true,
    },
    // Static per deploy: let the CDN cache and revalidate in the background.
    // Prerendered files are served by the CDN and skip server/middleware/cors.ts, so set CORS here too.
    routeRules: Object.fromEntries(
      ["/api/years", "/api/config/**", "/api/states/**", "/openapi.json", "/llms-full.txt"].map((path) => [
        path,
        {
          headers: {
            "cache-control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
            "access-control-allow-origin": "*",
          },
        },
      ]),
    ),
    // The prerender bundle has no `import.meta.env`; inline the one variable the server code reads.
    replace: {
      "import.meta.env.VITE_SITE_ORIGIN": JSON.stringify(
        loadEnv(mode, rootDir, "VITE_").VITE_SITE_ORIGIN ?? "",
      ),
    },
    // The prerender bundle is built outside Vite, so `?raw` imports need their own loader.
    rollupConfig: {
      plugins: [
        {
          name: "raw-import",
          load(id: string) {
            if (!id.endsWith("?raw")) return null;
            return `export default ${JSON.stringify(readFileSync(id.slice(0, -4), "utf8"))};`;
          },
        },
      ],
    },
    vercel: {
      functions: { runtime: "nodejs24.x" },
    },
  },
}));
