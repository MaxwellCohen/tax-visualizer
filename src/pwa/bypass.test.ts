import { describe, expect, it } from "vitest";
import { shouldBypassServiceWorker } from "./bypass";

describe("shouldBypassServiceWorker", () => {
  it.each(["/api/calculate", "/api/years", "/llms.txt", "/llms-full.txt", "/openapi.json", "/robots.txt", "/mcp", "/.well-known/mcp.json"])(
    "bypasses %s",
    (path) => expect(shouldBypassServiceWorker(path)).toBe(true),
  );
  it.each(["/", "/about", "/withholding"])("does not bypass %s", (path) =>
    expect(shouldBypassServiceWorker(path)).toBe(false),
  );
});
