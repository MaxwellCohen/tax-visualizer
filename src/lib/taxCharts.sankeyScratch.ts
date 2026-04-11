import type { SankeyChartLink, SankeyChartNode } from "~/lib/taxCharts.types";
import type { SankeyPretaxRow } from "~/lib/taxCharts.sankeyPretaxRows";

export type NiitBySegmentMaps = {
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
};
