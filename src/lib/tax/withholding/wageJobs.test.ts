import { describe, expect, it } from "vitest";
import { deriveWageJobsFromTaxInput, mergeWithholdingJobsWithWageJobs } from "./wageJobs";

describe("deriveWageJobsFromTaxInput", () => {
  it("lists each W-2 income row as a job with spouse key", () => {
    const jobs = deriveWageJobsFromTaxInput({
      rows: [
        { type: "setting", id: "taxYear", value: 2026 },
        {
          type: "income",
          id: "w1",
          kind: "income-ordinary-wages-spouse1",
          label: "Acme",
          amount: 80_000,
        },
        {
          type: "income",
          id: "w2",
          kind: "income-ordinary-wages-spouse2",
          label: "Beta",
          amount: 40_000,
        },
        {
          type: "income",
          id: "ltcg",
          kind: "income-longTermCapGains-longTermCapGains-spouse1",
          label: "Gains",
          amount: 10_000,
        },
      ],
    });
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({ incomeRowId: "w1", spouseKey: "spouse1", amount: 80_000 });
    expect(jobs[1]).toMatchObject({ incomeRowId: "w2", spouseKey: "spouse2", amount: 40_000 });
  });
});

describe("mergeWithholdingJobsWithWageJobs", () => {
  it("preserves pay settings for existing ids and drops removed jobs", () => {
    const wageJobs = deriveWageJobsFromTaxInput({
      rows: [
        {
          type: "income",
          id: "w1",
          kind: "income-ordinary-wages",
          label: "Salary",
          amount: 90_000,
        },
      ],
    });
    const merged = mergeWithholdingJobsWithWageJobs(wageJobs, [
      { incomeRowId: "w1", payFrequency: "weekly", federalWithheldPerPaycheck: 100 },
      { incomeRowId: "stale", payFrequency: "monthly" },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      incomeRowId: "w1",
      payFrequency: "weekly",
      federalWithheldPerPaycheck: 100,
    });
  });
});
