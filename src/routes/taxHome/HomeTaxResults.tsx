import type { Accessor } from "solid-js";
import { Show } from "solid-js";
import TaxMekko from "~/components/tax/TaxMekko";
import TaxSankey from "~/components/tax/TaxSankey";
import TaxSummary from "~/components/tax/TaxSummary";
import type { CalculatedConfigItem } from "~/lib/tax/calc/calculateTaxes";
import type { TaxFormData } from "~/lib/tax/form/types";
import { TaxYearInvalid } from "./TaxYearInvalid";

type HomeTaxResultsProps = {
  taxInput: Accessor<TaxFormData>;
  calculatedConfig: Accessor<CalculatedConfigItem[] | null>;
};

export function HomeTaxResults(props: HomeTaxResultsProps) {
  return (
    <Show when={props.calculatedConfig() !== null} fallback={<TaxYearInvalid />}>
      
        <>
          <TaxSankey calculatedConfig={props.calculatedConfig} />
          <TaxMekko calculatedConfig={props.calculatedConfig} />
          <TaxSummary
            calculatedConfig={props.calculatedConfig}
            taxInput={props.taxInput}
          />
        </>
      
    </Show>
  );
}