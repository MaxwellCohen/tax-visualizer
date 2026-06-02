import { describe, expect, it } from "vitest";
import { SCENARIO_QUERY_PARAM, WITHHOLDING_JOBS_QUERY_PARAM } from "~/lib/tax/scenario/keys.constants";
import { starterScenario } from "~/routes/taxHome/scenarioInit";
import { buildWithholdingShareUrl } from "~/routes/withholding/withholdingPersistence";

describe("buildWithholdingShareUrl", () => {
  it("includes scenario and whjobs on /withholding", () => {
    const input = starterScenario(2026);
    const url = new URL(
      buildWithholdingShareUrl("https://example.com/other", input, {
        jobs: [
          {
            incomeRowId: "job-1",
            payFrequency: "biweekly",
            federalWithheldPerPaycheck: 400,
          },
        ],
      }),
    );
    expect(url.pathname).toBe("/withholding");
    expect(url.searchParams.has(SCENARIO_QUERY_PARAM)).toBe(true);
    expect(url.searchParams.has(WITHHOLDING_JOBS_QUERY_PARAM)).toBe(true);
  });
});
