import type { Accessor } from "solid-js";
import { createMemo, Show } from "solid-js";
import TaxMekko from "~/components/TaxMekko";
import TaxSankey from "~/components/TaxSankey";
import TaxSummary from "~/components/TaxSummary";
import type { TaxFormData, TaxResult } from "~/lib/taxForm.types";
import { TaxYearInvalid } from "./TaxYearInvalid";
import { getFilingStatusFromRows, getTaxYearFromRows } from "~/lib/taxCalc.inputs";
import { getTaxYearConfig } from "~/lib/taxData";
import { calculateAllConfigValues, type CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";
type HomeTaxResultsProps = {
  taxResult: Accessor<TaxResult | null>;
  isPlanningYear: Accessor<boolean>;
  taxInput: Accessor<TaxFormData>;
};

export function HomeTaxResults(props: HomeTaxResultsProps) {
  const calculatedConfig = createMemo((): CalculatedConfigItem[] | null => {
    const input = props.taxInput();
    const rows = input.rows;
    const taxYear = getTaxYearFromRows(rows);
    const taxData = getTaxYearConfig(taxYear);
    if (!taxData) return null;
    const filingStatus = getFilingStatusFromRows(rows);
    return calculateAllConfigValues(input, taxData, filingStatus);
  });
  return (
    <Show when={props.taxResult()} fallback={<TaxYearInvalid />}>
      {(result) => (
        <>
          <TaxSankey calculatedConfig={calculatedConfig} />
          <TaxMekko calculatedConfig={calculatedConfig} />
          <TaxSummary
            result={result()}
          />
        </>
      )}
    </Show>
  );
}