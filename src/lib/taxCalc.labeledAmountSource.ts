import type { IncomeSource } from "~/lib/taxCalc.types";
import { newIncomeRow } from "~/lib/taxForm.factories";
import { getInputItems } from "~/lib/config";
import { getTaxYearConfig } from "~/lib/taxData";

export function sumLabeledAmountSources<T extends { amount: number }>(sources: T[]): number {
  return sources.reduce((sum, s) => sum + s.amount, 0);
}

export function incomeSourceDisplayLabel(source: Pick<IncomeSource, "kind" | "label">): string {
  const taxData = getTaxYearConfig(2024);
  if (taxData) {
    const items = getInputItems(taxData, "single");
    const item = items.find(i => 
      i.inputRowSettings?.subcategories?.some(sub => sub.key === source.kind)
    );
    if (item) return item.label;
  }
  return source.label || source.kind;
}

export function newIncomeSource(overrides?: Partial<Omit<IncomeSource, "id">>): IncomeSource {
  const r = newIncomeRow(overrides);
  return { id: r.id, kind: r.kind, label: r.label, amount: r.amount };
}


