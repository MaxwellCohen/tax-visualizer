export { buildMekkoRows } from "~/lib/taxCharts.buildMekko";
export { buildSankeyChartData } from "~/lib/taxCharts.sankeyGraph";
export {
  normalizeTerminalOutflowsToInflow,
  appendLinksFromTerminalOutflows,
  type TerminalOutflow,
} from "~/lib/taxCharts.sankeySliceModel";
export {
  ordinarySegmentKey,
  ltcgSegmentKey,
  ordinaryBracketNodeId,
  ltcgBracketNodeId,
} from "~/lib/taxCharts.sankeySegmentKeys";
export {
  INCOME_KIND_CHART_ORDER_BY_KIND,
  INCOME_KIND_SANKEY_ORDER,
  SANKEY_LINK_STROKE_DEFAULT,
  SANKEY_NODE_FILL_DEFAULT,
  
  SANKEY_NODE_STYLE_BY_KIND,
  SANKEY_VISUAL_COLUMN_BY_KIND,
  SANKEY_VISUAL_SEMANTIC_MAX,
  type SankeyNodeLayoutEntry,
} from "~/lib/config/chartMetricsRegistry";
export type {
  DeductionBenefitSinkRole,
  MekkoRow,
  SankeyChartData,
  SankeyChartNode,
} from "~/lib/taxCharts.types";
export {
  allocateFederalCreditsTopMarginalSlices,
  bracketSliceRetainedWeight,
  deductionShieldAccountingOutflow,
  
  takeHomeAttributableToBracketFlows,
  type FederalSliceAfterCredits,
} from "~/lib/taxCharts.visualizationBundle";
