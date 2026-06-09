import type { TaxCalculationInputs } from "~/lib/tax/config.types";
import type { FilingStatus } from "~/lib/tax/data/types";
import type { TaxFormRow } from "~/lib/tax/form/types";
import {
  buildScenarioMetrics,
  getFilingStatusFromRows as getFilingStatusFromScenarioRows,
  getTaxYearFromRows as getTaxYearFromScenarioRows,
  scenarioMetricsToTaxCalculationInputs,
} from "~/lib/tax/calc/scenarioMetrics";

export function getTaxYearFromRows(rows: TaxFormRow[]): number {
  return getTaxYearFromScenarioRows(rows);
}

export function getFilingStatusFromRows(rows: TaxFormRow[]): FilingStatus {
  return getFilingStatusFromScenarioRows(rows);
}

export function rowsToTaxCalculationInputs(rows: TaxFormRow[]): TaxCalculationInputs {
  return scenarioMetricsToTaxCalculationInputs(buildScenarioMetrics(rows));
}
