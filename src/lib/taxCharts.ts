export { buildMekkoRows } from "~/lib/taxCharts.buildMekko";
export { buildSankeyChartData } from "~/lib/taxCharts.sankeyGraph";
export {
  ordinarySegmentKey,
  ltcgSegmentKey,
  ordinaryBracketNodeId,
  ltcgBracketNodeId,
} from "~/lib/taxCharts.sankeySegmentKeys";
export type {
  DeductionBenefitSinkRole,
  MekkoRow,
  SankeyChartData,
  SankeyChartNode,
} from "~/lib/taxCharts.types";
export {
  allocateFederalCreditsTopMarginalSlices,
  takeHomeAttributableToBracketFlows,
  type FederalSliceAfterCredits,
} from "~/lib/taxCharts.visualizationBundle";
