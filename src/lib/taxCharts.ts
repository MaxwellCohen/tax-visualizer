export { buildMekkoRows } from "~/lib/taxCharts.buildMekko";
export { buildSankeyChartData } from "~/lib/taxCharts.buildSankey";
export { INCOME_KIND_CHART_ORDER_BY_KIND, INCOME_KIND_SANKEY_ORDER, INCOME_KIND_CHART_ORDER } from "~/lib/config/sankeyOrder.config";
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
  federalIncomeTaxCreditApplyRatio,
  takeHomeAttributableToBracketFlows,
  type FederalSliceAfterCredits,
} from "~/lib/taxCharts.visualizationBundle";
