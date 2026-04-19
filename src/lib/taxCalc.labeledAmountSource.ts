import type { IncomeSource } from "~/lib/taxCalc.types";
import { newIncomeRow } from "~/lib/taxForm.factories";

export function sumLabeledAmountSources<T extends { amount: number }>(sources: T[]): number {
  return sources.reduce((sum, s) => sum + s.amount, 0);
}


export function newIncomeSource(overrides?: Partial<Omit<IncomeSource, "id">>): IncomeSource {
  const r = newIncomeRow(overrides);
  return { id: r.id, kind: r.kind, label: r.label, amount: r.amount };
}


