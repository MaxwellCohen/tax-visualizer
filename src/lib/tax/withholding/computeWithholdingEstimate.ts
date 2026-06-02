import { PAY_PERIODS_PER_YEAR } from "./payFrequency";
import type { WageJob } from "./wageJobs";
import type { WithholdingEstimate, WithholdingInputs, WithholdingJobEstimate } from "./types";

function allocateLiability(
  annualFederalLiability: number,
  jobWages: number,
  totalWages: number,
  jobCount: number,
): number {
  if (annualFederalLiability <= 0) return 0;
  if (totalWages > 0) {
    return annualFederalLiability * (jobWages / totalWages);
  }
  return jobCount > 0 ? annualFederalLiability / jobCount : 0;
}

function estimateForJob(
  job: WageJob,
  input: WithholdingInputs["jobs"][number] | undefined,
  suggestedAnnual: number,
): WithholdingJobEstimate {
  const payFrequency = input?.payFrequency ?? "biweekly";
  const payPeriodsPerYear = PAY_PERIODS_PER_YEAR[payFrequency];
  const suggestedPerPaycheck =
    payPeriodsPerYear > 0 ? suggestedAnnual / payPeriodsPerYear : 0;

  const perPaycheck = input?.federalWithheldPerPaycheck;
  if (perPaycheck === undefined || !Number.isFinite(perPaycheck)) {
    return {
      incomeRowId: job.incomeRowId,
      label: job.label,
      spouseKey: job.spouseKey,
      wages: job.amount,
      payFrequency,
      payPeriodsPerYear,
      suggestedAnnual,
      suggestedPerPaycheck,
      annualWithheld: null,
    };
  }

  return {
    incomeRowId: job.incomeRowId,
    label: job.label,
    spouseKey: job.spouseKey,
    wages: job.amount,
    payFrequency,
    payPeriodsPerYear,
    suggestedAnnual,
    suggestedPerPaycheck,
    annualWithheld: perPaycheck * payPeriodsPerYear,
  };
}

export function computeWithholdingEstimate(
  annualFederalLiability: number,
  wageJobs: WageJob[],
  inputs: WithholdingInputs,
): WithholdingEstimate {
  const inputById = new Map(inputs.jobs.map(j => [j.incomeRowId, j]));
  const totalWages = wageJobs.reduce((sum, j) => sum + j.amount, 0);

  const jobs = wageJobs.map(job => {
    const suggestedAnnual = allocateLiability(
      annualFederalLiability,
      job.amount,
      totalWages,
      wageJobs.length,
    );
    return estimateForJob(job, inputById.get(job.incomeRowId), suggestedAnnual);
  });

  const withWithheld = jobs.filter(j => j.annualWithheld !== null);
  const annualWithheld =
    withWithheld.length > 0
      ? withWithheld.reduce((sum, j) => sum + (j.annualWithheld ?? 0), 0)
      : null;

  return {
    annualFederalLiability,
    totalWages,
    jobs,
    annualWithheld,
    estimatedBalance:
      annualWithheld !== null ? annualWithheld - annualFederalLiability : null,
  };
}
