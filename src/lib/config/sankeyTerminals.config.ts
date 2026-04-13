import { SANKEY_IDS } from "~/lib/taxCharts.sankey.constants";
import type { SankeyChartNode } from "~/lib/taxCharts.types";

/** Primary Sankey terminal (sink) nodes — labels and kinds for federal / payroll / credits / take-home. */
export type SankeyTerminalConfig = {
  id: string;
  label: string;
  kind: SankeyChartNode["kind"];
};

export const SANKEY_PRIMARY_TERMINALS: SankeyTerminalConfig[] = [
  { id: SANKEY_IDS.taxesFederal, label: "Federal tax", kind: "taxesFederal" },
  { id: SANKEY_IDS.taxesPayroll, label: "Payroll tax", kind: "taxesPayroll" },
  { id: SANKEY_IDS.federalCredits, label: "Federal credits", kind: "federalCredits" },
  { id: SANKEY_IDS.keep, label: "Take-home", kind: "keep" },
];

