import type { Accessor } from "solid-js";
import { Show } from "solid-js";
import TaxMekko from "~/components/TaxMekko";
import TaxModelGuide from "~/components/TaxModelGuide";
import TaxNarrative from "~/components/TaxNarrative";
import TaxSankey from "~/components/TaxSankey";
import TaxSummary from "~/components/TaxSummary";
import TaxWarnings from "~/components/TaxWarnings";
import type { TaxResult } from "~/lib/taxCalc";
import { TaxYearInvalid } from "./TaxYearInvalid";

type HomeTaxResultsProps = {
  taxResult: Accessor<TaxResult | null>;
  baselineResult: Accessor<TaxResult | null>;
  isPlanningYear: Accessor<boolean>;
};

export function HomeTaxResults(props: HomeTaxResultsProps) {
  return (
    <Show when={props.taxResult()} fallback={<TaxYearInvalid />}>
      {(result) => (
        <>
          <TaxSankey result={result()} />
          <TaxMekko result={result()} />
          <TaxWarnings warnings={result().warnings} />
          <TaxSummary
            result={result()}
            baselineResult={props.baselineResult()}
          />
          <TaxNarrative
            result={result()}
            isPlanningYear={props.isPlanningYear()}
          />
          <TaxModelGuide
            result={result()}
            isPlanningYear={props.isPlanningYear()}
          />
        </>
      )}
    </Show>
  );
}