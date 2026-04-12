import type { IncomeKind, IncomeSource } from "~/lib/taxCalc.types";
import { incomeKindDefaultLabel } from "~/lib/taxData.incomeKinds.config";

let incomeSourceSeq = 0;

function newIncomeSourceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  incomeSourceSeq += 1;
  return `inc-${incomeSourceSeq}`;
}

export function newIncomeSource(overrides?: Partial<Omit<IncomeSource, "id">>): IncomeSource {
  return {
    id: newIncomeSourceId(),
    kind: "wages",
    label: "",
    amount: 0,
    ...overrides,
  };
}

export function incomeSourceDisplayLabel(source: IncomeSource): string {
  const trimmed = source.label.trim();
  return trimmed || incomeKindDefaultLabel(source.kind);
}
