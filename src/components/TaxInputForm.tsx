import { createSignal } from "solid-js";
import { TaxInputFormDeductionSection } from "~/components/taxInputForm/TaxInputFormDeductionSection";
import { TaxInputFormFilingSection } from "~/components/taxInputForm/TaxInputFormFilingSection";
import { TaxInputFormIncomeSection } from "~/components/taxInputForm/TaxInputFormIncomeSection";
import { TaxInputFormPreTaxSection } from "~/components/taxInputForm/TaxInputFormPreTaxSection";
import { createDeductionMemos } from "~/components/taxInputForm/hooks/deductionMemos";
import { createTaxInputForm, type TaxInputFormOuterProps } from "~/components/taxInputForm/hooks/formCore";
import { createIncomeMemos } from "~/components/taxInputForm/hooks/incomeMemos";
import { createLimitMemos } from "~/components/taxInputForm/hooks/limitMemos";
import { wirePretaxCapEffect } from "~/components/taxInputForm/hooks/pretaxCapEffect";
type TaxInputFormProps = TaxInputFormOuterProps & {
  availableYears: number[];
};

export default function TaxInputForm(props: TaxInputFormProps) {
  const { form, values, addSource, removeSourceAt } = createTaxInputForm(props);
  const income = createIncomeMemos(values);
  const limits = createLimitMemos(values);
  const deduction = createDeductionMemos(values, limits.selectedTaxConfig);

  wirePretaxCapEffect(form, values, limits.pretaxLimits);

  const [wagesSectionOpen, setWagesSectionOpen] = createSignal(true);
  const [preTaxBenefitsOpen, setPreTaxBenefitsOpen] = createSignal(true);

  return (
    <form
      class="space-y-8 rounded-xl p-5"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        "box-shadow": "var(--shadow)",
      }}
    >
      <TaxInputFormFilingSection form={form} values={values} availableYears={props.availableYears} />
      <TaxInputFormIncomeSection
        form={form}
        values={values}
        wagesSectionOpen={wagesSectionOpen()}
        setWagesSectionOpen={setWagesSectionOpen}
        wageSourceIndices={income.wageSourceIndices}
        otherSourceIndices={income.otherSourceIndices}
        wagesTotal={income.wagesTotal}
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
        maxElective401={limits.maxElective401}
        maxIraContribution={limits.maxIraContribution}
        maxHsaSpouse1={limits.maxHsaSpouse1}
        maxHsaSpouse2={limits.maxHsaSpouse2}
        pretaxLimits={limits.pretaxLimits}
      />
      <TaxInputFormDeductionSection
        form={form}
        values={values}
        standardDeduction={deduction.standardDeduction}
        itemizedBeatsStandard={deduction.itemizedBeatsStandard}
      />
    </form>
  );
}
