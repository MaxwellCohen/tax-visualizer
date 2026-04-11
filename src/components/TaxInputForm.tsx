import { createSignal } from "solid-js";
import { CollapsibleBlock } from "~/components/CollapsibleBlock";
import { TaxInputFormDeductionSection } from "~/components/taxInputForm/TaxInputFormDeductionSection";
import { TaxInputFormFilingSection } from "~/components/taxInputForm/TaxInputFormFilingSection";
import { TaxInputFormIncomeSection } from "~/components/taxInputForm/TaxInputFormIncomeSection";
import { TaxInputFormPreTaxSection } from "~/components/taxInputForm/TaxInputFormPreTaxSection";
import { createDeductionMemos } from "~/components/taxInputForm/hooks/deductionMemos";
import { createTaxInputForm, type TaxInputFormOuterProps } from "~/components/taxInputForm/hooks/formCore";
import { createLimitMemos } from "~/components/taxInputForm/hooks/limitMemos";
import { wirePretaxCapEffect } from "~/components/taxInputForm/hooks/pretaxCapEffect";
type TaxInputFormProps = TaxInputFormOuterProps & {
  availableYears: number[];
};

export default function TaxInputForm(props: TaxInputFormProps) {
  const { form, values, addSource, removeSourceAt, addPretaxBenefit, removePretaxBenefitAt } =
    createTaxInputForm(props);
  const limits = createLimitMemos(values);
  const deduction = createDeductionMemos(values, limits.selectedTaxConfig);

  wirePretaxCapEffect(form, values, limits.pretaxLimits);

  const [preTaxBenefitsOpen, setPreTaxBenefitsOpen] = createSignal(true);
  const [incomeSourcesOpen, setIncomeSourcesOpen] = createSignal(true);

  return (
    <form
      class="rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        "box-shadow": "var(--shadow)",
      }}
    >
      <CollapsibleBlock title="Filing details & income" bodyClass="mt-4 space-y-4">
        <TaxInputFormFilingSection form={form} values={values} availableYears={props.availableYears} />
        <TaxInputFormIncomeSection
          form={form}
          values={values}
          incomeSourcesOpen={incomeSourcesOpen()}
          setIncomeSourcesOpen={setIncomeSourcesOpen}
          addSource={addSource}
          removeSourceAt={removeSourceAt}
        />
        <TaxInputFormPreTaxSection
          form={form}
          values={values}
          preTaxBenefitsOpen={preTaxBenefitsOpen()}
          setPreTaxBenefitsOpen={setPreTaxBenefitsOpen}
          preTaxBenefitsTotal={limits.preTaxBenefitsTotal}
          isMarriedJoint={limits.isMarriedJoint}
          addPretaxBenefit={addPretaxBenefit}
          removePretaxBenefitAt={removePretaxBenefitAt}
          pretaxLimits={limits.pretaxLimits}
        />
        <TaxInputFormDeductionSection
          form={form}
          values={values}
          standardDeduction={deduction.standardDeduction}
          itemizedBeatsStandard={deduction.itemizedBeatsStandard}
        />
      </CollapsibleBlock>
    </form>
  );
}
