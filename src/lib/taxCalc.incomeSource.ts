import type { IncomeKind, IncomeSource } from "~/lib/taxCalc.types";

const DEFAULT_LABEL_BY_KIND: Record<IncomeKind, string> = {
  wages: "W-2 wages",
  ordinary: "Other income",
  shortTermCapGains: "Short-term capital gains",
  longTermCapGains: "Long-term capital gains",
};

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
  return trimmed || DEFAULT_LABEL_BY_KIND[source.kind];
}
