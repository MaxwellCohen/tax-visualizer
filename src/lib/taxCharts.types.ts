import type { IncomeKind } from "~/lib/taxCalc.types";

export type SankeyNodeKind =
  | "grossIncome"
  | "incomeSource"
  | "pretaxContribution"
  | "deferredSink"
  | "standardDeduction"
  | "deduction"
  | "deductionShield"
  | "ordinaryTaxableIncome"
  | "longTermTaxableIncome"
  | "ordinaryBracket"
  | "ltcgBracket"
  | "taxes"
  | "keep";

export type SankeyChartNode = {
  id: string;
  label: string;
  kind: SankeyNodeKind;
  amount?: number;
  incomeKind?: IncomeKind;
  incomeAmount?: number;
  taxAmount?: number;
  marginalRate?: number;
  rangeStart?: number;
  rangeEnd?: number | null;
};

export type SankeyChartLink = {
  sourceId: string;
  targetId: string;
  value: number;
};

export type SankeyChartData = {
  nodes: SankeyChartNode[];
  links: SankeyChartLink[];
};

export type MekkoRowKind = "deduction" | "ordinaryBracket" | "ltcgBracket";

export type MekkoRow = {
  id: string;
  label: string;
  total: number;
  keep: number;
  tax: number;
  kind: MekkoRowKind;
  marginalRate?: number;
};
