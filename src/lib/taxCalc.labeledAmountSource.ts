import { toMoneyValue } from "~/lib/taxCalc.money";

/** Sums `amount` for itemized rows, federal credit rows, or any `{ amount: number }` line. */
export function sumLabeledAmountSources(sources: ReadonlyArray<{ amount: number }>): number {
  let t = 0;
  for (const s of sources) {
    t += toMoneyValue(s.amount);
  }
  return t;
}
