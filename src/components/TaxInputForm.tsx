import { createEffect, createMemo, untrack } from "solid-js";
import { evaluate } from "@tanstack/solid-form";
import { buildValidationContext } from "~/lib/config";
import {
  getFilingStatusFromRows,
  getTaxYearFromRows,
} from "~/lib/taxCalc.inputs";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import { TaxInputFormCreditsSection } from "~/components/taxInputForm/TaxInputFormCreditsSection";
import { TaxInputFormDeductionSection } from "~/components/taxInputForm/TaxInputFormDeductionSection";
import { TaxInputFormFilingSection } from "~/components/taxInputForm/TaxInputFormFilingSection";
import { TaxInputFormIncomeSection } from "~/components/taxInputForm/TaxInputFormIncomeSection";
import { TaxInputFormPreTaxSection } from "~/components/taxInputForm/TaxInputFormPreTaxSection";
import { TaxInputCommitToUrlProvider } from "~/components/taxInputForm/taxInputFormCommitUrlContext";
import {
  createTaxInputForm,
  type TaxInputFormOuterProps,
} from "~/components/taxInputForm/hooks/formCore";
import { wireTaxYearLimitsEffect } from "~/components/taxInputForm/hooks/taxYearLimitsEffect";

type TaxInputFormProps = TaxInputFormOuterProps & {
  availableYears: number[];
};

export default function TaxInputForm(props: TaxInputFormProps) {
  /** One TanStack FormApi per mount — recreating `createForm` each render re-applies `defaultValues` and blows away row `kind` / controlled selects. */
  let taxFormBundle: ReturnType<typeof createTaxInputForm> | undefined;
  if (!taxFormBundle) {
    taxFormBundle = createTaxInputForm(props);
  }
  const {
    form,
    values,
    limits,
    deduction,
    addSource,
    removeSourceAt,
    addPretaxBenefit,
    removePretaxBenefitAt,
    clearAllPretaxBenefits,
    addItemizedDeduction,
    removeItemizedDeductionAt,
    clearAllItemizedDeductions,
    addFederalTaxCredit,
    removeFederalTaxCreditAt,
    clearAllFederalTaxCredits,
  } = taxFormBundle;

  /** URL / localStorage hydration replaces `props.value` after first paint — reset the form without recreating the API. */
  createEffect(() => {
    const incoming = props.value;
    untrack(() => {
      const current = values();
      if (!evaluate(incoming(), current)) {
        form.reset(incoming());
      }
    });
  });

  wireTaxYearLimitsEffect(form, values);

  const validationCtx = createMemo(() => {
    const rows = values().rows;
    const ty = getTaxYearFromRows(rows);
    const fs = getFilingStatusFromRows(rows) ?? "single";
    return buildValidationContext(ty, fs);
  });

  const taxData = () => limits.selectedTaxConfig();
  const filingStatus = () => {
    const inputs = limits.selectedTaxConfig();
    if (!inputs) return "single";
    const v = values();
    const calcInputs = v.rows.find(
      (r) => r.type === "setting" && r.id === "filingStatus",
    );
    return calcInputs?.value ?? "single";
  };

  return (
    <TaxInputCommitToUrlProvider onCommitToUrl={props.onCommitToUrl}>
      <form class="rounded-xl p-5 background-surface border-border shadow-shadow">
        <CollapsibleBlock
          title="Filing details & income"
          bodyClass="mt-4 space-y-4"
        >
          <TaxInputFormFilingSection
            form={form}
            values={values}
            availableYears={props.availableYears}
          />
          <TaxInputFormIncomeSection
            form={form}
            values={values}
            addSource={addSource}
            removeSourceAt={removeSourceAt}
            taxData={taxData}
            filingStatus={filingStatus}
            validationCtx={validationCtx}
          />
          <TaxInputFormPreTaxSection
            form={form}
            values={values}
            preTaxBenefitsTotal={limits.preTaxBenefitsTotal}
            isMarriedJoint={limits.isMarriedJoint}
            addPretaxBenefit={addPretaxBenefit}
            removePretaxBenefitAt={removePretaxBenefitAt}
            clearAll={clearAllPretaxBenefits}
            taxData={taxData}
            filingStatus={filingStatus}
            validationCtx={validationCtx}
          />
          <TaxInputFormDeductionSection
            form={form}
            values={values}
            standardDeduction={deduction.standardDeduction}
            itemizedBeatsStandard={deduction.itemizedBeatsStandard}
            addItemizedDeduction={addItemizedDeduction}
            removeItemizedDeductionAt={removeItemizedDeductionAt}
            clearAll={clearAllItemizedDeductions}
            taxData={taxData}
            validationCtx={validationCtx}
          />
          <TaxInputFormCreditsSection
            form={form}
            values={values}
            addFederalTaxCredit={addFederalTaxCredit}
            removeFederalTaxCreditAt={removeFederalTaxCreditAt}
            clearAll={clearAllFederalTaxCredits}
            taxData={taxData}
            filingStatus={filingStatus}
            validationCtx={validationCtx}
          />
        </CollapsibleBlock>
      </form>
    </TaxInputCommitToUrlProvider>
  );
}
