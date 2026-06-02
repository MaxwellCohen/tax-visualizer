import type { FilingStatus } from "~/lib/tax/data/types";
import type { TaxFormData, TaxFormIncomeRow } from "~/lib/tax/form/types";
import { DEFAULT_PAY_FREQUENCY } from "./payFrequency";
import type { WithholdingJobInput } from "./types";

export type SpouseKey = "spouse1" | "spouse2";

export type WageJob = {
  incomeRowId: string;
  kind: string;
  label: string;
  amount: number;
  spouseKey: SpouseKey;
};

const WAGE_KIND_FRAGMENT = "income-ordinary-wages";

export function isWageIncomeKind(kind: string): boolean {
  return kind.toLowerCase().includes(WAGE_KIND_FRAGMENT);
}

export function spouseKeyFromWageKind(kind: string): SpouseKey {
  return kind.toLowerCase().includes("spouse2") ? "spouse2" : "spouse1";
}

export function deriveWageJobsFromTaxInput(taxInput: TaxFormData): WageJob[] {
  return taxInput.rows
    .filter((r): r is TaxFormIncomeRow => r.type === "income" && isWageIncomeKind(r.kind))
    .map(row => ({
      incomeRowId: row.id,
      kind: row.kind,
      label: row.label.trim() || defaultWageLabel(row.kind),
      amount: Number.isFinite(row.amount) ? row.amount : 0,
      spouseKey: spouseKeyFromWageKind(row.kind),
    }));
}

function defaultWageLabel(kind: string): string {
  const key = spouseKeyFromWageKind(kind);
  return key === "spouse2" ? "W-2 wages (spouse 2)" : "W-2 wages";
}

export function spouseGroupLabel(
  spouseKey: SpouseKey,
  filingStatus: FilingStatus,
): string {
  if (filingStatus !== "marriedJoint") {
    return "W-2 jobs";
  }
  return spouseKey === "spouse2" ? "Spouse 2" : "Spouse 1";
}

export function visibleSpouseGroups(
  jobs: WageJob[],
  filingStatus: FilingStatus,
): SpouseKey[] {
  const keys = new Set(jobs.map(j => j.spouseKey));
  if (filingStatus !== "marriedJoint") {
    return keys.has("spouse1") || keys.has("spouse2") ? (["spouse1"] as SpouseKey[]) : [];
  }
  const order: SpouseKey[] = [];
  if (keys.has("spouse1")) order.push("spouse1");
  if (keys.has("spouse2")) order.push("spouse2");
  return order;
}

/** Align withholding job inputs with current W-2 rows (add defaults, drop stale ids). */
export function mergeWithholdingJobsWithWageJobs(
  wageJobs: WageJob[],
  inputs: WithholdingJobInput[],
): WithholdingJobInput[] {
  const byId = new Map(inputs.map(j => [j.incomeRowId, j]));
  return wageJobs.map(job => {
    const existing = byId.get(job.incomeRowId);
    return {
      incomeRowId: job.incomeRowId,
      payFrequency: existing?.payFrequency ?? DEFAULT_PAY_FREQUENCY,
      federalWithheldPerPaycheck: existing?.federalWithheldPerPaycheck,
    };
  });
}
