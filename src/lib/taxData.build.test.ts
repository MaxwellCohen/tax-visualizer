import { describe, expect, it } from "vitest";
import { buildFederalBrackets, thresholdsToBrackets } from "~/lib/taxData.build";

describe("taxData.build", () => {
  it("thresholdsToBrackets pairs rates with upTo", () => {
    const b = thresholdsToBrackets([1, 2, 3]);
    expect(b).toHaveLength(7);
    expect(b[0]).toEqual({ rate: 0.1, upTo: 1 });
    expect(b[1]).toEqual({ rate: 0.12, upTo: 2 });
    expect(b[2]).toEqual({ rate: 0.22, upTo: 3 });
    expect(b[6]).toEqual({ rate: 0.37, upTo: null });
  });

  it("buildFederalBrackets returns all filing statuses", () => {
    const single = [10, 20];
    const rec = buildFederalBrackets(single, [11, 21], [12, 22], [13, 23]);
    expect(rec.single).toHaveLength(7);
    expect(rec.marriedJoint[0].upTo).toBe(11);
    expect(rec.marriedSeparate[0].upTo).toBe(12);
    expect(rec.headOfHousehold[0].upTo).toBe(13);
  });
});
