import path from "node:path";
import { fileURLToPath } from "node:url";
import solid from "@solidjs/vite-plugin";
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
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
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
        "src/components/tax/inputForm/hooks/**",
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
