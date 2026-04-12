import type { TaxChartMetrics } from "~/lib/taxForm.types";

export type SankeyPretaxRow = {
  amount: number;
  middleId: string;
  middleLabel: string;
  sinkId: string;
  sinkLabel: string;
};

export function sankeyPretaxRowsFromMetrics(m: TaxChartMetrics): SankeyPretaxRow[] {
  return [
    {
      amount: m.preTax401k,
      middleId: "pretax-401k",
      middleLabel: "401(k)",
      sinkId: "deferred-401k",
      sinkLabel: "401(k) deferred",
    },
    {
      amount: m.preTaxHsa,
      middleId: "pretax-hsa",
      middleLabel: "HSA",
      sinkId: "deferred-hsa",
      sinkLabel: "HSA deferred",
    },
    {
      amount: m.preTaxOther,
      middleId: "pretax-other",
      middleLabel: "Other pre-tax",
      sinkId: "deferred-other",
      sinkLabel: "Other deferred",
    },
    {
      amount: m.traditionalIra,
      middleId: "pretax-ira",
      middleLabel: "Trad. IRA",
      sinkId: "deferred-ira",
      sinkLabel: "Trad. IRA (deductible)",
    },
  ];
}
