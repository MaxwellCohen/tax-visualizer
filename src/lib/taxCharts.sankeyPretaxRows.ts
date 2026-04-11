import type { TaxResult } from "~/lib/taxCalc";

export type SankeyPretaxRow = {
  amount: number;
  middleId: string;
  middleLabel: string;
  sinkId: string;
  sinkLabel: string;
};

export function sankeyPretaxRowsFromResult(result: TaxResult): SankeyPretaxRow[] {
  return [
    {
      amount: result.preTax401k,
      middleId: "pretax-401k",
      middleLabel: "401(k)",
      sinkId: "deferred-401k",
      sinkLabel: "401(k) deferred",
    },
    {
      amount: result.preTaxHsa,
      middleId: "pretax-hsa",
      middleLabel: "HSA",
      sinkId: "deferred-hsa",
      sinkLabel: "HSA deferred",
    },
    {
      amount: result.preTaxOther,
      middleId: "pretax-other",
      middleLabel: "Other pre-tax",
      sinkId: "deferred-other",
      sinkLabel: "Other deferred",
    },
    {
      amount: result.traditionalIra,
      middleId: "pretax-ira",
      middleLabel: "Trad. IRA",
      sinkId: "deferred-ira",
      sinkLabel: "Trad. IRA (deductible)",
    },
  ];
}
