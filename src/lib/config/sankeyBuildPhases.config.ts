/**
 * Single registration point for Sankey build order: gross → taxable → deduction/pretax → brackets → tax/keep.
 * Each phase runs the corresponding `taxCharts.sankeyPhase*` helper, then {@link runSankeyRegistryAppendersForPhase}
 * for registry rows with matching `sankey.phase` (see CHART_REGISTRY).
 */
import type { TaxResult } from "~/lib/taxForm.types";
import { runSankeyRegistryAppendersForPhase } from "~/lib/config/sankeyRegistryRunner";
import type { SankeyPhaseId } from "~/lib/config/sankeyPhaseId";
import { initSankeyScratch, appendSankeyIncomeSourceNodes } from "~/lib/taxCharts.sankeyPhaseGross";
import { appendSankeyTaxableIncomeNodes } from "~/lib/taxCharts.sankeyPhaseTaxable";
import { appendSankeyDeductionAndPretax } from "~/lib/taxCharts.sankeyPhaseDeductionPretax";
import { appendSankeyTaxKeepAndFallback } from "~/lib/taxCharts.sankeyPhaseTaxKeep";
import type { SankeyScratch } from "~/lib/taxCharts.sankeyScratch";

export type { SankeyPhaseId };

export type SankeyPhase = {
  id: SankeyPhaseId;
  description: string;
  append: (result: TaxResult, s: SankeyScratch) => void;
};

export const SANKEY_BUILD_PHASES: readonly SankeyPhase[] = [
  {
    id: "gross",
    description: "Income source nodes",
    append: (result, s) => {
      appendSankeyIncomeSourceNodes(result, s);
      runSankeyRegistryAppendersForPhase("gross", { result, s });
    },
  },
  {
    id: "taxable",
    description: "Taxable income pools",
    append: (result, s) => {
      appendSankeyTaxableIncomeNodes(result, s);
      runSankeyRegistryAppendersForPhase("taxable", { result, s });
    },
  },
  {
    id: "deductionPretax",
    description: "Deduction and pretax flows",
    append: (result, s) => {
      appendSankeyDeductionAndPretax(result, s);
      runSankeyRegistryAppendersForPhase("deductionPretax", { result, s });
    },
  },
  {
    id: "brackets",
    description: "Federal bracket nodes",
    append: (result, s) => {
      runSankeyRegistryAppendersForPhase("brackets", { result, s });
    },
  },
  {
    id: "taxKeep",
    description: "Taxes, credits, take-home",
    append: (result, s) => {
      appendSankeyTaxKeepAndFallback(result, s);
      runSankeyRegistryAppendersForPhase("taxKeep", { result, s });
    },
  },
];

export { initSankeyScratch };
