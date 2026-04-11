import { createMemo } from "solid-js";
import type { Accessor } from "solid-js";
import type { TaxInput } from "~/lib/taxCalc";

export function createIncomeMemos(values: Accessor<TaxInput>) {
  const wageSourceIndices = createMemo(() =>
    values()
      .incomeSources.map((s, i) => (s.kind === "wages" ? i : -1))
      .filter(i => i >= 0),
  );

  const otherSourceIndices = createMemo(() =>
    values()
      .incomeSources.map((s, i) => (s.kind !== "wages" ? i : -1))
      .filter(i => i >= 0),
  );

  const wagesTotal = createMemo(() =>
    values()
      .incomeSources.filter(s => s.kind === "wages")
      .reduce((sum, s) => sum + s.amount, 0),
  );

  return { wageSourceIndices, otherSourceIndices, wagesTotal };
}
