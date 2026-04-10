import {
  incomeSourceDisplayLabel,
  type IncomeKind,
  type TaxResult,
  type TaxSegment,
} from "~/lib/taxCalc";

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

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Lower value = higher in Sankey / earlier in sorted income source lists. */
export const INCOME_KIND_CHART_ORDER: Record<IncomeKind, number> = {
  longTermCapGains: 0,
  shortTermCapGains: 1,
  wages: 2,
  ordinary: 3,
};

const SANKEY_IDS = {
  grossIncome: "gross-income",
  ordinaryTaxableIncome: "ordinary-taxable-income",
  longTermTaxableIncome: "long-term-taxable-income",
  taxes: "taxes",
  keep: "keep",
} as const;

function formatOrdinaryBracketLabel(segment: TaxSegment): string {
  const rateLabel = `${Math.round(segment.marginalRate * 100)}%`;
  const rangeLabel =
    segment.rangeEnd == null
      ? `${money.format(segment.rangeStart)}+`
      : `${money.format(segment.rangeStart)}-${money.format(segment.rangeEnd)}`;
  return `${rateLabel} (${rangeLabel})`;
}

function formatLtcgBracketLabel(segment: TaxSegment): string {
  return `LTCG ${Math.round(segment.marginalRate * 100)}%`;
}

/** Split NIIT across bracket slices so Sankey/Mekko tax flows match total federal tax. */
function netInvestmentIncomeTaxPerSegment(result: TaxResult): {
  ordinary: Map<string, number>;
  ltcg: Map<string, number>;
} {
  const ordinary = new Map<string, number>();
  const ltcg = new Map<string, number>();
  const niit = result.federalNetInvestmentIncomeTax;
  const nii = result.netInvestmentIncome;
  if (niit <= 0 || nii <= 0) {
    return { ordinary, ltcg };
  }

  const stNii = Math.max(0, nii - result.longTermTaxableIncome);
  const ltNii = nii - stNii;
  const ordinaryPool = niit * (stNii / nii);
  const ltcgPool = niit * (ltNii / nii);

  const allocatePool = (
    pool: number,
    segments: TaxSegment[],
    totalIncome: number,
    into: Map<string, number>,
  ) => {
    if (pool <= 0 || totalIncome <= 0 || segments.length === 0) return;
    let allocated = 0;
    segments.forEach((seg, i) => {
      const last = i === segments.length - 1;
      const part = last ? Math.max(0, pool - allocated) : Math.round((pool * seg.incomeAmount) / totalIncome);
      allocated += part;
      into.set(seg.id, part);
    });
  };

  allocatePool(ordinaryPool, result.ordinaryFederalSegments, result.ordinaryTaxableIncome, ordinary);
  allocatePool(ltcgPool, result.longTermCapitalGainsSegments, result.longTermTaxableIncome, ltcg);
  return { ordinary, ltcg };
}

function addNode(nodeMap: Map<string, SankeyChartNode>, node: SankeyChartNode): void {
  if (!nodeMap.has(node.id)) {
    nodeMap.set(node.id, node);
  }
}

function sortedIncomeSources(result: TaxResult) {
  return [...result.incomeSources].sort((a, b) => {
    const kindDiff = INCOME_KIND_CHART_ORDER[a.kind] - INCOME_KIND_CHART_ORDER[b.kind];
    if (kindDiff !== 0) return kindDiff;
    return incomeSourceDisplayLabel(a).localeCompare(incomeSourceDisplayLabel(b));
  });
}

/** Split take-home and payroll across bracket/shield slices by retained weight (replaces a pass-through "after federal" node). */
function splitTakeHomeAndPayrollByPool(
  slices: { sourceId: string; weight: number }[],
  takeHomePay: number,
  payrollTax: number,
): Map<string, { keep: number; payroll: number }> {
  const out = new Map<string, { keep: number; payroll: number }>();
  const pool = slices.reduce((s, x) => s + x.weight, 0);
  if (pool <= 0 || slices.length === 0) return out;

  let accKeep = 0;
  let accPayroll = 0;
  slices.forEach((slice, i) => {
    const last = i === slices.length - 1;
    const keep = last ? Math.max(0, takeHomePay - accKeep) : Math.round((slice.weight / pool) * takeHomePay);
    const payroll = last ? Math.max(0, payrollTax - accPayroll) : Math.round((slice.weight / pool) * payrollTax);
    accKeep += keep;
    accPayroll += payroll;
    out.set(slice.sourceId, { keep, payroll });
  });
  return out;
}

export function buildSankeyChartData(result: TaxResult): SankeyChartData {
  const nodeMap = new Map<string, SankeyChartNode>();
  const links: SankeyChartLink[] = [];
  const niitBySegment = netInvestmentIncomeTaxPerSegment(result);

  addNode(nodeMap, {
    id: SANKEY_IDS.grossIncome,
    label: "Gross income",
    kind: "grossIncome",
    amount: result.totalIncome,
  });

  for (const source of sortedIncomeSources(result)) {
    if (source.amount <= 0) continue;
    const nodeId = `income-${source.id}`;
    addNode(nodeMap, {
      id: nodeId,
      label: incomeSourceDisplayLabel(source),
      kind: "incomeSource",
      amount: source.amount,
      incomeKind: source.kind,
    });
    links.push({ sourceId: nodeId, targetId: SANKEY_IDS.grossIncome, value: source.amount });
  }

  const pretaxRows = [
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

  const preTaxTotal = pretaxRows.reduce((s, row) => s + Math.max(0, row.amount), 0);

  // Gross outflow link order is cosmetic; vertical order comes from `SANKEY_SIBLING_RANK` in TaxSankey.tsx.
  if (result.longTermTaxableIncome > 0) {
    addNode(nodeMap, {
      id: SANKEY_IDS.longTermTaxableIncome,
      label: "Long-term taxable",
      kind: "longTermTaxableIncome",
      amount: result.longTermTaxableIncome,
    });
    links.push({
      sourceId: SANKEY_IDS.grossIncome,
      targetId: SANKEY_IDS.longTermTaxableIncome,
      value: result.longTermTaxableIncome,
    });
  }

  if (result.ordinaryTaxableIncome > 0) {
    const ordinaryTaxableLabel =
      result.shortTermCapGainsGrossIncome > 0
        ? "Ordinary taxable (incl. short-term gains)"
        : "Ordinary taxable";
    addNode(nodeMap, {
      id: SANKEY_IDS.ordinaryTaxableIncome,
      label: ordinaryTaxableLabel,
      kind: "ordinaryTaxableIncome",
      amount: result.ordinaryTaxableIncome,
    });
    links.push({
      sourceId: SANKEY_IDS.grossIncome,
      targetId: SANKEY_IDS.ordinaryTaxableIncome,
      value: result.ordinaryTaxableIncome,
    });
  }

  const takeHomePoolSlices: { sourceId: string; weight: number }[] = [];

  if (result.deductionAmount > 0) {
    addNode(nodeMap, {
      id: "deduction-shield",
      label: "Shielded income",
      kind: "deductionShield",
      amount: result.deductionAmount + preTaxTotal,
      incomeAmount: result.deductionAmount + preTaxTotal,
    });

    if (result.deductionKind === "itemized") {
      addNode(nodeMap, {
        id: "standard-deduction",
        label: "Standard deduction",
        kind: "standardDeduction",
        amount: result.standardDeduction,
      });
      addNode(nodeMap, {
        id: "deduction",
        label: "Itemized deduction",
        kind: "deduction",
        amount: result.deductionAmount,
      });
      links.push({
        sourceId: SANKEY_IDS.grossIncome,
        targetId: "standard-deduction",
        value: result.deductionAmount,
      });
      links.push({
        sourceId: "standard-deduction",
        targetId: "deduction",
        value: result.deductionAmount,
      });
      links.push({ sourceId: "deduction", targetId: "deduction-shield", value: result.deductionAmount });
    } else {
      addNode(nodeMap, {
        id: "deduction",
        label: "Standard deduction",
        kind: "deduction",
        amount: result.deductionAmount,
      });
      links.push({ sourceId: SANKEY_IDS.grossIncome, targetId: "deduction", value: result.deductionAmount });
      links.push({ sourceId: "deduction", targetId: "deduction-shield", value: result.deductionAmount });
    }

    takeHomePoolSlices.push({ sourceId: "deduction-shield", weight: result.deductionAmount });
  }

  for (const row of pretaxRows) {
    if (row.amount <= 0) continue;
    addNode(nodeMap, {
      id: row.middleId,
      label: row.middleLabel,
      kind: "pretaxContribution",
      amount: row.amount,
    });
    addNode(nodeMap, {
      id: row.sinkId,
      label: row.sinkLabel,
      kind: "deferredSink",
      amount: row.amount,
    });
    links.push({ sourceId: SANKEY_IDS.grossIncome, targetId: row.middleId, value: row.amount });
    if (result.deductionAmount > 0) {
      links.push({ sourceId: row.middleId, targetId: "deduction-shield", value: row.amount });
      links.push({ sourceId: "deduction-shield", targetId: row.sinkId, value: row.amount });
    } else {
      links.push({ sourceId: row.middleId, targetId: row.sinkId, value: row.amount });
    }
  }

  for (const segment of result.ordinaryFederalSegments) {
    const nodeId = `ordinary-bracket-${segment.id}`;
    const niitPart = niitBySegment.ordinary.get(segment.id) ?? 0;
    const taxWithNiit = segment.taxAmount + niitPart;
    addNode(nodeMap, {
      id: nodeId,
      label: formatOrdinaryBracketLabel(segment),
      kind: "ordinaryBracket",
      amount: segment.incomeAmount,
      incomeAmount: segment.incomeAmount,
      taxAmount: taxWithNiit,
      marginalRate: segment.marginalRate,
      rangeStart: segment.rangeStart,
      rangeEnd: segment.rangeEnd,
    });
    links.push({
      sourceId: SANKEY_IDS.ordinaryTaxableIncome,
      targetId: nodeId,
      value: segment.incomeAmount,
    });
    const retainedAmount = Math.max(0, segment.incomeAmount - taxWithNiit);
    if (retainedAmount > 0) {
      takeHomePoolSlices.push({ sourceId: nodeId, weight: retainedAmount });
    }
  }

  for (const segment of result.longTermCapitalGainsSegments) {
    const nodeId = `ltcg-bracket-${segment.id}`;
    const niitPart = niitBySegment.ltcg.get(segment.id) ?? 0;
    const taxWithNiit = segment.taxAmount + niitPart;
    addNode(nodeMap, {
      id: nodeId,
      label: formatLtcgBracketLabel(segment),
      kind: "ltcgBracket",
      amount: segment.incomeAmount,
      incomeAmount: segment.incomeAmount,
      taxAmount: taxWithNiit,
      marginalRate: segment.marginalRate,
      rangeStart: segment.rangeStart,
      rangeEnd: segment.rangeEnd,
    });
    links.push({
      sourceId: SANKEY_IDS.longTermTaxableIncome,
      targetId: nodeId,
      value: segment.incomeAmount,
    });
    const retainedAmount = Math.max(0, segment.incomeAmount - taxWithNiit);
    if (retainedAmount > 0) {
      takeHomePoolSlices.push({ sourceId: nodeId, weight: retainedAmount });
    }
  }

  addNode(nodeMap, {
    id: SANKEY_IDS.taxes,
    label: "Taxes & payroll",
    kind: "taxes",
    amount: result.federalIncomeTax + result.payrollTax,
  });
  addNode(nodeMap, {
    id: SANKEY_IDS.keep,
    label: "Take-home",
    kind: "keep",
    amount: result.takeHomePay,
  });

  const poolTotal = takeHomePoolSlices.reduce((s, x) => s + x.weight, 0);
  const split =
    poolTotal > 0
      ? splitTakeHomeAndPayrollByPool(takeHomePoolSlices, result.takeHomePay, result.payrollTax)
      : new Map<string, { keep: number; payroll: number }>();

  for (const segment of result.ordinaryFederalSegments) {
    const nodeId = `ordinary-bracket-${segment.id}`;
    const part = split.get(nodeId) ?? { keep: 0, payroll: 0 };
    const niitPart = niitBySegment.ordinary.get(segment.id) ?? 0;
    const taxTotal = segment.taxAmount + niitPart + part.payroll;
    if (taxTotal > 0) {
      links.push({ sourceId: nodeId, targetId: SANKEY_IDS.taxes, value: taxTotal });
    }
    if (part.keep > 0) {
      links.push({ sourceId: nodeId, targetId: SANKEY_IDS.keep, value: part.keep });
    }
  }

  for (const segment of result.longTermCapitalGainsSegments) {
    const nodeId = `ltcg-bracket-${segment.id}`;
    const part = split.get(nodeId) ?? { keep: 0, payroll: 0 };
    const niitPart = niitBySegment.ltcg.get(segment.id) ?? 0;
    const taxTotal = segment.taxAmount + niitPart + part.payroll;
    if (taxTotal > 0) {
      links.push({ sourceId: nodeId, targetId: SANKEY_IDS.taxes, value: taxTotal });
    }
    if (part.keep > 0) {
      links.push({ sourceId: nodeId, targetId: SANKEY_IDS.keep, value: part.keep });
    }
  }

  if (result.deductionAmount > 0) {
    const part = split.get("deduction-shield") ?? { keep: 0, payroll: 0 };
    if (part.payroll > 0) {
      links.push({ sourceId: "deduction-shield", targetId: SANKEY_IDS.taxes, value: part.payroll });
    }
    if (part.keep > 0) {
      links.push({ sourceId: "deduction-shield", targetId: SANKEY_IDS.keep, value: part.keep });
    }
  }

  if (poolTotal <= 0 && (result.takeHomePay > 0 || result.payrollTax > 0)) {
    if (result.payrollTax > 0) {
      links.push({ sourceId: SANKEY_IDS.grossIncome, targetId: SANKEY_IDS.taxes, value: result.payrollTax });
    }
    if (result.takeHomePay > 0) {
      links.push({ sourceId: SANKEY_IDS.grossIncome, targetId: SANKEY_IDS.keep, value: result.takeHomePay });
    }
  }

  return {
    nodes: [...nodeMap.values()],
    links,
  };
}

export function buildMekkoRows(result: TaxResult): MekkoRow[] {
  const rows: MekkoRow[] = [];
  const niitBySegment = netInvestmentIncomeTaxPerSegment(result);

  if (result.deductionAmount > 0) {
    rows.push({
      id: "deduction",
      label: result.deductionKind === "itemized" ? "Itemized" : "Std Ded",
      total: result.deductionAmount,
      keep: result.deductionAmount,
      tax: 0,
      kind: "deduction",
    });
  }

  for (const segment of result.ordinaryFederalSegments) {
    if (segment.incomeAmount <= 0) continue;
    const niitPart = niitBySegment.ordinary.get(segment.id) ?? 0;
    const tax = segment.taxAmount + niitPart;
    rows.push({
      id: `ordinary-${segment.id}`,
      label: `Ord. ${Math.round(segment.marginalRate * 100)}%`,
      total: segment.incomeAmount,
      tax,
      keep: Math.max(0, segment.incomeAmount - tax),
      kind: "ordinaryBracket",
      marginalRate: segment.marginalRate,
    });
  }

  for (const segment of result.longTermCapitalGainsSegments) {
    if (segment.incomeAmount <= 0) continue;
    const niitPart = niitBySegment.ltcg.get(segment.id) ?? 0;
    const tax = segment.taxAmount + niitPart;
    rows.push({
      id: `ltcg-${segment.id}`,
      label: formatLtcgBracketLabel(segment),
      total: segment.incomeAmount,
      tax,
      keep: Math.max(0, segment.incomeAmount - tax),
      kind: "ltcgBracket",
      marginalRate: segment.marginalRate,
    });
  }

  return rows;
}
