import type { TaxResult } from "~/lib/taxForm.types";



export type MetricValueGetter = (result: TaxResult) => number | undefined;

export type MetricConfig = {
  id: string;
  label: string;
  getValue: MetricValueGetter;
  format: "currency" | "percent" | "number";
  highlight?: boolean;
  showWhen?: (result: TaxResult) => boolean;
  hideWhenZero?: boolean;
  // displayOrder: number;
  category: string;
};



export type MetricDisplay = {
  id: string;
  label: string;
  value: string;
  highlight?: boolean;
  category: MetricConfig["category"];
  format: "currency" | "percent" | "number";
};












