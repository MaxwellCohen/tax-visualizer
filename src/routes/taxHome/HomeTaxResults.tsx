import type { Accessor } from "solid-js";
import { Show } from "solid-js";
import TaxMekko from "~/components/tax/TaxMekko";
import TaxSankey from "~/components/tax/TaxSankey";
import TaxSummary from "~/components/tax/TaxSummary";
import type { TaxFormData } from "~/lib/tax/form/types";
import { TaxYearInvalid } from "./TaxYearInvalid";
import { useCalculatedTaxConfig } from "~/lib/tax/calc/useCalculatedTaxConfig";

type HomeTaxResultsProps = {
  taxInput: Accessor<TaxFormData>;
};

export function HomeTaxResults(props: HomeTaxResultsProps) {
  const calculatedConfig = useCalculatedTaxConfig(props.taxInput);
  return (
    <Show when={calculatedConfig() !== null} fallback={<TaxYearInvalid />}>
      
        <>
          <TaxSankey calculatedConfig={calculatedConfig} />
          <TaxMekko calculatedConfig={calculatedConfig} />
          <TaxSummary
            calculatedConfig={calculatedConfig}
            taxInput={props.taxInput}
          />
        </>
      
    </Show>
  );
}