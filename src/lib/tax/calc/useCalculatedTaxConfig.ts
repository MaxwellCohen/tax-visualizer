import { createMemo, type Accessor } from "solid-js";
import { getFilingStatusFromRows, getTaxYearFromRows } from "~/lib/tax/calc/inputs";
import { calculateAllConfigValues, type CalculatedConfigItem } from "~/lib/tax/calc/calculateTaxes";
import { getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import type { TaxFormData } from "~/lib/tax/form/types";

export function useCalculatedTaxConfig(
  taxInput: Accessor<TaxFormData>,
): Accessor<CalculatedConfigItem[] | null> {
  return createMemo((): CalculatedConfigItem[] | null => {
    const input = taxInput();
    const rows = input.rows;
    const taxYear = getTaxYearFromRows(rows);
    const taxData = getTaxYearConfig(taxYear);
    if (!taxData) return null;
    const filingStatus = getFilingStatusFromRows(rows);
    return calculateAllConfigValues(input, taxData, filingStatus);
  });
}
