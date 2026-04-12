/**
 * Single registration point for Sankey build order: gross → taxable → deduction/pretax → brackets → tax/keep.
 * Each phase runs the corresponding `taxCharts.sankeyPhase*` helper, then {@link runSankeyRegistryAppendersForPhase}
 * for registry rows with matching `sankey.phase` (see CHART_REGISTRY).
 */
import type { TaxChartMetrics } from "~/lib/taxForm.types";
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
  append: (m: TaxChartMetrics, result: TaxResult, s: SankeyScratch) => void;
};

export const SANKEY_BUILD_PHASES: readonly SankeyPhase[] = [
  {
    id: "gross",
    description: "Income source nodes",
    append: (m, result, s) => {
      appendSankeyIncomeSourceNodes(result, s);
      runSankeyRegistryAppendersForPhase("gross", { m, result, s });
    },
  },
  {
    id: "taxable",
    description: "Taxable income pools",
    append: (m, result, s) => {
      appendSankeyTaxableIncomeNodes(m, result, s);
      runSankeyRegistryAppendersForPhase("taxable", { m, result, s });
    },
  },
  {
    id: "deductionPretax",
    description: "Deduction and pretax flows",
    append: (m, result, s) => {
      appendSankeyDeductionAndPretax(m, result, s);
      runSankeyRegistryAppendersForPhase("deductionPretax", { m, result, s });
    },
  },
  {
    id: "brackets",
    description: "Federal bracket nodes",
    append: (m, result, s) => {
      runSankeyRegistryAppendersForPhase("brackets", { m, result, s });
    },
  },
  {
    id: "taxKeep",
    description: "Taxes, credits, take-home",
    append: (m, result, s) => {
      appendSankeyTaxKeepAndFallback(m, result, s);
      runSankeyRegistryAppendersForPhase("taxKeep", { m, result, s });
    },
  },
];

export { initSankeyScratch };
