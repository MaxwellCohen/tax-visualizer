import { describe, expect, it } from "vitest";
import { isCorsPath } from "./cors";

describe("isCorsPath", () => {
  it("matches API and machine-readable paths only", () => {
    for (const p of ["/api/calculate", "/api/years", "/openapi.json", "/llms-full.txt", "/mcp", "/.well-known/mcp.json"]) expect(isCorsPath(p)).toBe(true);
    for (const p of ["/", "/about", "/apiary"]) expect(isCorsPath(p)).toBe(false);
  });
});
