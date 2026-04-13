import type { TaxResult } from "~/lib/taxForm.types";
import { chartMetricNumeric } from "~/lib/taxChartMetricRead";

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
      amount: chartMetricNumeric(result, "preTax401k"),
      middleId: "pretax-401k",
      middleLabel: "401(k)",
      sinkId: "deferred-401k",
      sinkLabel: "401(k) deferred",
    },
    {
      amount: chartMetricNumeric(result, "preTaxHsa"),
      middleId: "pretax-hsa",
      middleLabel: "HSA",
      sinkId: "deferred-hsa",
      sinkLabel: "HSA deferred",
    },
    {
      amount: chartMetricNumeric(result, "preTaxOther"),
      middleId: "pretax-other",
      middleLabel: "Other pre-tax",
      sinkId: "deferred-other",
      sinkLabel: "Other deferred",
    },
    {
      amount: chartMetricNumeric(result, "traditionalIra"),
      middleId: "pretax-ira",
      middleLabel: "Trad. IRA",
      sinkId: "deferred-ira",
      sinkLabel: "Trad. IRA (deductible)",
    },
  ];
}
