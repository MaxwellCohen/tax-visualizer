import type { FederalTaxCreditSource, IncomeSource, ItemizedDeductionSource } from "~/lib/taxCalc.types";
import { newCreditRow, newDeductionRow, newIncomeRow } from "~/lib/taxForm.factories";

export function sumLabeledAmountSources<T extends { amount: number }>(sources: T[]): number {
  return sources.reduce((sum, s) => sum + s.amount, 0);
}

export function incomeSourceDisplayLabel(source: Pick<IncomeSource, "kind" | "label">): string {
  const labels: Record<string, string> = {
    wages: "W-2 wages",
    selfEmployment: "1099 self-employment",
    ordinary: "Ordinary income",
    shortTermCapGains: "Short-term capital gains",
    longTermCapGains: "Long-term capital gains",
  };
  return labels[source.kind] || source.label || source.kind;
}

export function newIncomeSource(overrides?: Partial<Omit<IncomeSource, "id">>): IncomeSource {
  const r = newIncomeRow(overrides);
  return { id: r.id, kind: r.kind, label: r.label, amount: r.amount };
}


