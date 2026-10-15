import { Show, createMemo, untrack, type Accessor, type Setter } from "solid-js";
import { buildValidationContext } from "~/lib/config/taxPage/taxPage.config";
import {
  getFilingStatusFromRows,
  getTaxYearFromRows,
} from "~/lib/tax/calc/inputs";
import { CollapsibleBlock } from "~/components/ui/CollapsibleBlock";
import { CreditsSection } from "~/components/tax/inputForm/sections/CreditsSection";
import { DeductionSection } from "~/components/tax/inputForm/sections/DeductionSection";
import { SettingsSection } from "~/components/tax/inputForm/sections/SettingsSection";
import { IncomeSection } from "~/components/tax/inputForm/sections/IncomeSection";
import { PreTaxSection } from "~/components/tax/inputForm/sections/PreTaxSection";
import { TaxInputCommitToUrlProvider } from "~/components/tax/inputForm/context/TaxInputCommitUrlContext";
import { TaxInputFormProvider } from "~/components/tax/inputForm/context/TaxInputFormContext";
import { createTaxInputRowActions, type CommitTaxInputToUrl } from "~/components/tax/inputForm/hooks/taxInputRowActions";
import { createDeductionMemos } from "~/components/tax/inputForm/hooks/deductionMemos";
import { createLimitMemos } from "~/components/tax/inputForm/hooks/limitMemos";
import type { TaxFormData } from "~/lib/tax/form/types";

type TaxInputFormProps = {
  taxInput: Accessor<TaxFormData>;
  setTaxInput: Setter<TaxFormData>;
  availableYears: number[];
  /** Called when focus leaves a field inside the form (focusout); use to sync URL without per-keystroke updates. */
  onCommitToUrl?: CommitTaxInputToUrl;
  /** When false, the main form collapsible starts closed (e.g. withholding page with wage jobs). */
  defaultOpen?: boolean;
  clampNotice?: Accessor<string | null>;
};

export default function TaxInputForm(props: TaxInputFormProps) {
  const limits = createLimitMemos(() => props.taxInput());
  const deduction = createDeductionMemos(() => props.taxInput(), limits.selectedTaxConfig);
  const rowActions = createTaxInputRowActions(props.setTaxInput, props.onCommitToUrl);

  const validationCtx = createMemo(() => {
    const rows = props.taxInput().rows;
    const ty = getTaxYearFromRows(rows);
    const fs = getFilingStatusFromRows(rows) ?? "single";
    return buildValidationContext(ty, fs);
  });

  const taxData = () => limits.selectedTaxConfig();
  const filingStatus = () => {
    const inputs = limits.selectedTaxConfig();
    if (!inputs) return "single" as const;
    const v = props.taxInput();
    const calcInputs = v.rows.find(
      (r) => r.type === "setting" && r.id === "filingStatus",
    );
    return calcInputs?.value ?? "single";
  };

  const formContext = {
    taxInput: untrack(() => props.taxInput),
    setTaxInput: untrack(() => props.setTaxInput),
    taxData,
    filingStatus,
    validationCtx,
    preTaxBenefitsTotal: limits.preTaxBenefitsTotal,
    isMarriedJoint: limits.isMarriedJoint,
    standardDeduction: deduction.standardDeduction,
    itemizedBeatsStandard: deduction.itemizedBeatsStandard,
    rowActions,
  };

  return (
    <TaxInputCommitToUrlProvider onCommitToUrl={props.onCommitToUrl}>
      <TaxInputFormProvider value={formContext}>
        <form class="rounded-xl p-5 background-surface border-border shadow-shadow">
          <Show when={props.clampNotice?.()}>
            {(message) => (
              <p
                class="mb-4 rounded-lg border border-warning-border bg-warning-bg px-3 py-2 text-xs leading-relaxed text-warning-text"
                role="status"
                aria-live="polite"
              >
                {message()}
              </p>
            )}
          </Show>
          <CollapsibleBlock
            title="Filing details & income"
            bodyClass="mt-4 space-y-4"
            defaultOpen={props.defaultOpen ?? true}
          >
            <SettingsSection
              taxInput={props.taxInput}
              setTaxInput={props.setTaxInput}
              availableYears={props.availableYears}
            />
            <IncomeSection />
            <PreTaxSection />
            <DeductionSection />
            <CreditsSection />
          </CollapsibleBlock>
        </form>
      </TaxInputFormProvider>
    </TaxInputCommitToUrlProvider>
  );
}
