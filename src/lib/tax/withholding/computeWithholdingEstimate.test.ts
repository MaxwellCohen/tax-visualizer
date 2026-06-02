import { describe, expect, it } from "vitest";
import { computeWithholdingEstimate } from "./computeWithholdingEstimate";
import type { WageJob } from "./wageJobs";

const jobs: WageJob[] = [
  {
    incomeRowId: "s1-job1",
    kind: "income-ordinary-wages-spouse1",
    label: "Employer A",
    amount: 100_000,
    spouseKey: "spouse1",
  },
  {
    incomeRowId: "s2-job1",
    kind: "income-ordinary-wages-spouse2",
    label: "Employer B",
    amount: 50_000,
    spouseKey: "spouse2",
  },
];

describe("computeWithholdingEstimate", () => {
  it("allocates suggested withholding by wage share per job", () => {
    const result = computeWithholdingEstimate(15_000, jobs, {
      jobs: [
        { incomeRowId: "s1-job1", payFrequency: "biweekly" },
        { incomeRowId: "s2-job1", payFrequency: "monthly" },
      ],
    });
    expect(result.jobs[0]!.suggestedAnnual).toBe(10_000);
    expect(result.jobs[0]!.suggestedPerPaycheck).toBeCloseTo(10_000 / 26);
    expect(result.jobs[1]!.suggestedAnnual).toBe(5_000);
    expect(result.jobs[1]!.suggestedPerPaycheck).toBeCloseTo(5_000 / 12);
    expect(result.annualWithheld).toBeNull();
  });

  it("sums withholding across jobs for refund/owe", () => {
    const result = computeWithholdingEstimate(10_000, jobs, {
      jobs: [
        {
          incomeRowId: "s1-job1",
          payFrequency: "monthly",
          federalWithheldPerPaycheck: 600,
        },
        {
          incomeRowId: "s2-job1",
          payFrequency: "monthly",
          federalWithheldPerPaycheck: 200,
        },
      ],
    });
    expect(result.annualWithheld).toBe(9_600);
    expect(result.estimatedBalance).toBe(-400);
  });

  it("handles zero wages with equal split across jobs", () => {
    const zeroWageJobs: WageJob[] = [
      {
        incomeRowId: "a",
        kind: "income-ordinary-wages-spouse1",
        label: "Job A",
        amount: 0,
        spouseKey: "spouse1",
      },
      {
        incomeRowId: "b",
        kind: "income-ordinary-wages-spouse2",
        label: "Job B",
        amount: 0,
        spouseKey: "spouse2",
      },
    ];
    const result = computeWithholdingEstimate(10_000, zeroWageJobs, {
      jobs: [
        { incomeRowId: "a", payFrequency: "biweekly" },
        { incomeRowId: "b", payFrequency: "biweekly" },
      ],
    });
    expect(result.jobs[0]!.suggestedAnnual).toBe(5_000);
    expect(result.jobs[1]!.suggestedAnnual).toBe(5_000);
  });

  it("returns empty jobs when no W-2 rows", () => {
    const result = computeWithholdingEstimate(5_000, [], { jobs: [] });
    expect(result.jobs).toEqual([]);
    expect(result.annualWithheld).toBeNull();
  });
});
