
type SankeyNodeKind =
  | "incomeSource"
  | "pretaxContribution"
  | "deferredSink"
  | "standardDeduction"
  | "deduction"
  | "deductionShield"
  | "deductionBenefitSink"
  | "ordinaryTaxableIncome"
  | "payrollOrdinaryStrip"
  | "longTermTaxableIncome"
  | "ltcgIncome"
  | "ltcgDeductionShield"
  | "ordinaryBracket"
  | "ltcgBracket"
  | "taxesFederal"
  | "taxesPayroll"
  | "federalCredits"
  | "keep";

export type { SankeyNodeKind };

/** How to present the terminal after `deduction-shield` for the deduction slice only (pretax still uses deferred sinks). */
export type DeductionBenefitSinkRole = "takeHome" | "accounting";

export type SankeyChartNode = {
  id: string;
  label: string;
  kind: SankeyNodeKind;
  /** Set on `deductionBenefitSink`: standard deduction is framed as take-home; itemized as non-cash accounting. */
  deductionBenefitSinkRole?: DeductionBenefitSinkRole;
  amount?: number;
  incomeKind?: string;
  incomeAmount?: number;
  taxAmount?: number;
  marginalRate?: number;
  rangeStart?: number;
  rangeEnd?: number | null;
  fill?: string;
  stroke?: string;
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

type MekkoRowKind = "deduction" | "pretax" | "ordinaryBracket" | "ltcgBracket";

export type MekkoRow = {
  id: string;
  label: string;
  total: number;
  keep: number;
  tax: number;
  kind: MekkoRowKind;
  marginalRate?: number;
};
