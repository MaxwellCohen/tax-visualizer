import type { IncomeSource, TaxInput } from "~/lib/taxCalc.types";
import { toMoneyValue } from "~/lib/taxCalc.money";

export type IncomeTotals = {
  sources: IncomeSource[];
  totalIncome: number;
  wageIncome: number;
  ordinaryGrossIncome: number;
  shortTermCapGainsGrossIncome: number;
  longTermCapitalGainsGrossIncome: number;
};

export function normalizeSourcesAndIncomeTotals(input: TaxInput): IncomeTotals {
  const sources = input.incomeSources.map(source => ({
    ...source,
    amount: toMoneyValue(source.amount),
  }));

  const totalIncome = sources.reduce((sum, source) => sum + source.amount, 0);
  const wageIncome = sources
    .filter(source => source.kind === "wages")
    .reduce((sum, source) => sum + source.amount, 0);
  const ordinaryGrossIncome = sources
    .filter(source => source.kind === "wages" || source.kind === "ordinary" || source.kind === "shortTermCapGains")
    .reduce((sum, source) => sum + source.amount, 0);
  const shortTermCapGainsGrossIncome = sources
    .filter(source => source.kind === "shortTermCapGains")
    .reduce((sum, source) => sum + source.amount, 0);
  const longTermCapitalGainsGrossIncome = sources
    .filter(source => source.kind === "longTermCapGains")
    .reduce((sum, source) => sum + source.amount, 0);

  return {
    sources,
    totalIncome,
    wageIncome,
    ordinaryGrossIncome,
    shortTermCapGainsGrossIncome,
    longTermCapitalGainsGrossIncome,
  };
}
