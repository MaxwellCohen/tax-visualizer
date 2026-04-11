import path from "node:path";
import { fileURLToPath } from "node:url";
import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: { "~": path.resolve(dirname, "./src") },
    conditions: ["development", "browser"],
  },
  test: {
    setupFiles: [path.resolve(dirname, "./vitest.setup.ts")],
    // jsdom so @solidjs/testing-library and *.test.tsx run correctly; lib tests are DOM-safe.
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      // Instrument logic we can unit-test to ~80%+; TSX pages/forms are excluded from thresholds.
      include: [
        "src/lib/**/*.ts",
        "src/lib/**/*.tsx",
        "src/components/**/*.ts",
        "src/routes/taxHome/*.ts",
      ],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/**/*.test.helpers.ts",
        "src/vite-env.d.ts",
        "src/global.d.ts",
        "src/components/taxInputForm/hooks/**",
        "src/routes/taxHome/taxHomePersistence.ts",
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 68,
      },
    },
  },
});
