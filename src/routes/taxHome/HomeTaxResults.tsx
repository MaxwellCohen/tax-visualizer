import type { Accessor } from "solid-js";
import { Show, lazy } from "solid-js";
import TaxSummary from "~/components/tax/TaxSummary";
import type { CalculatedConfigItem } from "~/lib/tax/calc/calculateTaxes";
import type { TaxFormData } from "~/lib/tax/form/types";
import { TaxYearInvalid } from "./TaxYearInvalid";

const TaxMekko = lazy(() => import("~/components/tax/TaxMekko"));
const TaxSankey = lazy(() => import("~/components/tax/TaxSankey"));

type HomeTaxResultsProps = {
  taxInput: Accessor<TaxFormData>;
  calculatedConfig: Accessor<CalculatedConfigItem[] | null>;
};

export function HomeTaxResults(props: HomeTaxResultsProps) {
  return (
    <Show when={props.calculatedConfig() !== null} fallback={<TaxYearInvalid />}>
      
        <div class="space-y-8">
          <TaxSankey calculatedConfig={props.calculatedConfig} />
          <TaxMekko calculatedConfig={props.calculatedConfig} />
          <TaxSummary
            calculatedConfig={props.calculatedConfig}
            taxInput={props.taxInput}
          />
        </div>
      
    </Show>
  );
}