export type PayFrequency = "weekly" | "biweekly" | "semi-monthly" | "monthly";

export type WithholdingJobInput = {
  incomeRowId: string;
  payFrequency: PayFrequency;
  /** When omitted, this job does not contribute to refund/owe totals. */
  federalWithheldPerPaycheck?: number;
};

export type WithholdingInputs = {
  jobs: WithholdingJobInput[];
};

export type WithholdingJobEstimate = {
  incomeRowId: string;
  label: string;
  spouseKey: "spouse1" | "spouse2";
  wages: number;
  payFrequency: PayFrequency;
  payPeriodsPerYear: number;
  suggestedAnnual: number;
  suggestedPerPaycheck: number;
  annualWithheld: number | null;
};

export type WithholdingEstimate = {
  annualFederalLiability: number;
  totalWages: number;
  jobs: WithholdingJobEstimate[];
  annualWithheld: number | null;
  /** Positive ≈ refund, negative ≈ owe; null when no job has withholding entered. */
  estimatedBalance: number | null;
};
