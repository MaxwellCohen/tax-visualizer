import type { SankeySettings } from "~/lib/config/taxPage/types";
import type { CalculatedConfigItem } from "~/lib/tax/calc/calculateTaxes";

const LTCG_SANKEY_INCOME_ROW = 50;
const CREDITS_SANKEY_PADDING = 2;

function getCreditsSankeyRow(numberOfBrackets: number): number {
  const belowOrdinaryBrackets = 5 + numberOfBrackets * 4 + CREDITS_SANKEY_PADDING;
  return Math.max(belowOrdinaryBrackets, LTCG_SANKEY_INCOME_ROW + CREDITS_SANKEY_PADDING);
}

function bracketCountFromConfig(cc: CalculatedConfigItem[]): number {
  return cc.filter((item) => /^bracket-\d+-node$/.test(item.id)).length;
}

function addTopology(topology: Map<string, SankeySettings>, id: string, settings: SankeySettings): void {
  topology.set(id, settings);
}

function addOrdinaryBracketTopology(topology: Map<string, SankeySettings>, numberOfBrackets: number): void {
  const creditsRow = getCreditsSankeyRow(numberOfBrackets);
  for (let i = 0; i < numberOfBrackets; i++) {
    const bracketId = `bracket-${i}`;
    const bracketRow = 5 + i * 4;
    addTopology(topology, `${bracketId}-node`, {
      node: { row: bracketRow, col: 3 },
    });
    addTopology(topology, `${bracketId}-income`, {
      links: [{ source: "ordinaryTaxableIncome", target: `${bracketId}-node`, row: bracketRow, col: 2 }],
    });
    addTopology(topology, `${bracketId}-keep`, {
      links: [{ source: `${bracketId}-node`, target: "takeHomePay", row: bracketRow + 1, col: 3 }],
    });
    addTopology(topology, `${bracketId}-credits`, {
      links: [{ source: `${bracketId}-node`, target: "takeHomePay", row: bracketRow + 2, col: 3 }],
    });
    addTopology(topology, `${bracketId}-tax`, {
      links: [{ source: `${bracketId}-node`, target: "federalIncomeTax", row: bracketRow + 3, col: 3 }],
    });
  }
  addTopology(topology, "ltcg-credits", {
    links: [{ source: "ltcg-income", target: "takeHomePay", row: LTCG_SANKEY_INCOME_ROW + 1, col: 3 }],
  });
  addTopology(topology, "input-credit-childTax", { node: { row: creditsRow, col: 3 } });
  addTopology(topology, "input-credit-education", { node: { row: creditsRow, col: 3 } });
  addTopology(topology, "retirementSavingsContributions", { node: { row: creditsRow, col: 3 } });
  addTopology(topology, "input-credit-other", { node: { row: creditsRow, col: 3 } });
}

function addStaticTopology(topology: Map<string, SankeySettings>): void {
  addTopology(topology, "input-pretax-401K", {
    node: { row: 1, col: 2 },
    links: [{ source: "wages", target: "pretaxDeductions", row: 1, col: 1 }],
  });
  addTopology(topology, "input-pretax-hsa", {
    node: { row: 3, col: 3 },
    links: [{ source: "wages", target: "pretaxDeductions", row: 1, col: 1 }],
  });
  addTopology(topology, "input-pretax-otherPretax", {
    node: { row: 4, col: 2 },
    links: [{ source: "wages", target: "pretaxDeductions", row: 1, col: 1 }],
  });
  addTopology(topology, "input-pretax-traditionalIra", {
    node: { row: 5, col: 2 },
    links: [{ source: "wages", target: "pretaxDeductions", row: 1, col: 1 }],
  });
  addTopology(topology, "wages", {
    node: { row: 1, col: 1 },
    links: [{ source: "wages", target: "ordinaryTaxableIncome", row: 1, col: 1 }],
  });
  addTopology(topology, "longTermCapGains", {
    node: { row: 2, col: 1 },
    links: [{ source: "longTermCapGains", target: "longTermTaxableIncome", row: 1, col: 1 }],
  });
  addTopology(topology, "pretaxDeductions", {
    node: { row: 1, col: 2 },
    links: [
      { source: "pretaxDeductions", target: "pretaxIncome", row: 1, col: 2 },
      { source: "pretaxIncome", target: "pretaxTakehome", row: 1, col: 3 },
    ],
  });
  addTopology(topology, "longTermCapitalGainsGrossIncome", { node: { row: 1, col: 2 } });
  addTopology(topology, "standard", {
    links: [{ source: "ordinaryTaxableIncome", target: "standardDeduction", row: 1, col: 2 }],
  });
  addTopology(topology, "Itemized Deductions", {
    links: [{ source: "ordinaryTaxableIncome", target: "itemizedDeductions", row: 1, col: 2 }],
  });
  addTopology(topology, "standardDeduction", {
    node: { row: 3, col: 3 },
    links: [{ source: "standardDeduction", target: "takeHomePay", row: 3, col: 3 }],
  });
  addTopology(topology, "itemizedDeductions", {
    node: { row: 3, col: 3 },
    links: [{ source: "itemizedDeductions", target: "takeHomePay", row: 3, col: 3 }],
  });
  addTopology(topology, "ordinaryTaxableIncome", { node: { row: 2, col: 2 } });
  addTopology(topology, "longTermTaxableIncome", { node: { row: 3, col: 2 } });
  addTopology(topology, "socialSecurityTax", { node: { row: 4, col: 1 } });
  addTopology(topology, "medicareTax", { node: { row: 4, col: 1 } });
  addTopology(topology, "payrollTax", {
    node: { row: 2, col: 3 },
    links: [{ source: "payrollTax", target: "federalPayrollTaxes", row: 2, col: 3 }],
  });
  addTopology(topology, "sankeyOrdinaryToPayrollTax", {
    links: [{ source: "ordinaryTaxableIncome", target: "payrollTax", row: 0, col: 2 }],
  });
  addTopology(topology, "selfEmploymentTax", {
    links: [{ source: "payrollTax", target: "federalPayrollTaxes", row: 4, col: 1 }],
  });
  addTopology(topology, "pretaxIncome", {
    node: { row: 1, col: 3 },
    links: [{ source: "pretaxIncome", target: "pretaxTakehome", row: 1, col: 3 }],
  });
  addTopology(topology, "pretaxTakehome", {
    node: { row: 1, col: 4 },
    links: [{ source: "pretaxTakehome", target: "takeHomePay", row: 1, col: 4 }],
  });
  addTopology(topology, "preTax401k", { node: { row: 1, col: 3 } });
  addTopology(topology, "preTaxHsa", { node: { row: 1, col: 3 } });
  addTopology(topology, "preTaxOther", { node: { row: 1, col: 3 } });
  addTopology(topology, "traditionalIra", { node: { row: 1, col: 3 } });
  addTopology(topology, "wagesAfterPretax", { node: { row: 1, col: 3 } });
  addTopology(topology, "federalPayrollTaxes", { node: { row: 2, col: 4 } });
  addTopology(topology, "takeHomePay", { node: { row: 3, col: 4 } });
  addTopology(topology, "federalIncomeTax", { node: { row: 4, col: 4 } });
  addTopology(topology, "ltcg-income", {
    node: { row: LTCG_SANKEY_INCOME_ROW, col: 3 },
    links: [{ source: "longTermTaxableIncome", target: "ltcg-income", row: LTCG_SANKEY_INCOME_ROW, col: 2 }],
  });
  addTopology(topology, "ltcg-tax", {
    links: [{ source: "ltcg-income", target: "federalIncomeTax", row: LTCG_SANKEY_INCOME_ROW + 2, col: 3 }],
  });
  addTopology(topology, "ltcg-keep", {
    links: [{ source: "ltcg-income", target: "takeHomePay", row: 49, col: 3 }],
  });
}

export function buildSankeyTopology(cc: CalculatedConfigItem[]): Map<string, SankeySettings> {
  const topology = new Map<string, SankeySettings>();
  addStaticTopology(topology);
  addOrdinaryBracketTopology(topology, bracketCountFromConfig(cc));
  return topology;
}

export function sankeyTopologyForItem(
  topology: Map<string, SankeySettings>,
  item: Pick<CalculatedConfigItem, "id">,
): SankeySettings | undefined {
  return topology.get(item.id);
}
