import type { SankeyChartLink, SankeyChartNode } from "~/lib/taxCharts.types";
import type { SankeyPretaxRow } from "~/lib/taxCharts.sankeyPretaxRows";

type NiitBySegmentMaps = {
  ordinary: Map<string, number>;
  ltcg: Map<string, number>;
};

export type SankeyScratch = {
  nodeMap: Map<string, SankeyChartNode>;
  links: SankeyChartLink[];
  takeHomePoolSlices: { sourceId: string; weight: number }[];
  niitBySegment: NiitBySegmentMaps;
  pretaxRows: SankeyPretaxRow[];
  preTaxTotal: number;
  /** When set, FICA is shown as a sibling of ordinary brackets under ordinary taxable (not from each bracket). */
  payrollTaxViaOrdinaryStrip: boolean;
  /** Scale on OTI→ordinary-bracket link widths to conserve mass with the payroll strip (retained weights use full segments). */
  ordinaryBracketLinkScale: number;
  /** Dollars shown on OTI → payroll strip → payroll tax terminal (when strip is used). */
  payrollStripFlowValue: number;
};
