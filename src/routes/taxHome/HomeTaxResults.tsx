import type { Accessor } from "solid-js";
import { createMemo, Show } from "solid-js";
import TaxMekko from "~/components/tax/TaxMekko";
import TaxSankey from "~/components/tax/TaxSankey";
import TaxSummary from "~/components/tax/TaxSummary";
import type { TaxFormData } from "~/lib/taxForm.types";
import { TaxYearInvalid } from "./TaxYearInvalid";
import { getFilingStatusFromRows, getTaxYearFromRows } from "~/lib/taxCalc.inputs";
import { getTaxYearConfig } from "~/lib/taxData.accessors.impl";
import { calculateAllConfigValues, type CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";
type HomeTaxResultsProps = {
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
    <Show when={calculatedConfig() !== null} fallback={<TaxYearInvalid />}>
      
        <>
          <TaxSankey calculatedConfig={calculatedConfig} />
          <TaxMekko calculatedConfig={calculatedConfig} />
          <TaxSummary
            calculatedConfig={calculatedConfig}
          />
        </>
      
    </Show>
  );
}