import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import { TaxInputFormCreditsSection } from "~/components/taxInputForm/TaxInputFormCreditsSection";
import { TaxInputFormDeductionSection } from "~/components/taxInputForm/TaxInputFormDeductionSection";
import { TaxInputFormFilingSection } from "~/components/taxInputForm/TaxInputFormFilingSection";
import { TaxInputFormIncomeSection } from "~/components/taxInputForm/TaxInputFormIncomeSection";
import { TaxInputFormPreTaxSection } from "~/components/taxInputForm/TaxInputFormPreTaxSection";
import { createTaxInputForm, type TaxInputFormOuterProps } from "~/components/taxInputForm/hooks/formCore";
import { wireTaxYearLimitsEffect } from "~/components/taxInputForm/hooks/taxYearLimitsEffect";
type TaxInputFormProps = TaxInputFormOuterProps & {
  availableYears: number[];
};

export default function TaxInputForm(props: TaxInputFormProps) {
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
  } = createTaxInputForm(props);

  wireTaxYearLimitsEffect(form, values);

  return (
    <form
      class="rounded-xl p-5 background-surface border-border shadow-shadow"
    >
      <CollapsibleBlock title="Filing details & income" bodyClass="mt-4 space-y-4">
        <TaxInputFormFilingSection form={form} values={values} availableYears={props.availableYears} />
        <TaxInputFormIncomeSection
          form={form}
          values={values}
          addSource={addSource}
          removeSourceAt={removeSourceAt}
        />
        <TaxInputFormPreTaxSection
          form={form}
          values={values}
          preTaxBenefitsTotal={limits.preTaxBenefitsTotal}
          isMarriedJoint={limits.isMarriedJoint}
          addPretaxBenefit={addPretaxBenefit}
          removePretaxBenefitAt={removePretaxBenefitAt}
          clearAll={clearAllPretaxBenefits}
          pretaxLimits={limits.pretaxLimits}
        />
        <TaxInputFormDeductionSection
          form={form}
          values={values}
          standardDeduction={deduction.standardDeduction}
          itemizedBeatsStandard={deduction.itemizedBeatsStandard}
          addItemizedDeduction={addItemizedDeduction}
          removeItemizedDeductionAt={removeItemizedDeductionAt}
          clearAll={clearAllItemizedDeductions}
          itemizedCaps={limits.itemizedCaps}
        />
        <TaxInputFormCreditsSection
          form={form}
          values={values}
          addFederalTaxCredit={addFederalTaxCredit}
          removeFederalTaxCreditAt={removeFederalTaxCreditAt}
          clearAll={clearAllFederalTaxCredits}
          federalTaxCreditCaps={limits.federalTaxCreditCaps}
        />
      </CollapsibleBlock>
    </form>
  );
}
