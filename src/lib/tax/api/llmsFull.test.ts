import { describe, expect, it } from "vitest";
import {
  ASSUMPTIONS,
  DISCLAIMER,
  GLOSSARY,
  MODELED,
  OMITTED,
  PROVENANCE,
} from "~/routes/about/aboutContent";
import { buildLlmsFullTxt } from "./llmsFull";

describe("buildLlmsFullTxt", () => {
  it("includes every shared About section", () => {
    const text = buildLlmsFullTxt("# Test");
    for (const item of [...MODELED, ...OMITTED, ...ASSUMPTIONS, PROVENANCE, DISCLAIMER]) {
      expect(text).toContain(item);
    }
    for (const { term, definition } of GLOSSARY) {
      expect(text).toContain(term);
      expect(text).toContain(definition);
    }
  });
});
