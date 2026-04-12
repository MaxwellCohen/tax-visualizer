import { createForm } from "@tanstack/solid-form";
import type { TaxInput } from "~/lib/taxCalc";
import {
  newFederalTaxCreditSource,
  newIncomeSource,
  newItemizedDeductionSource,
  newPretaxBenefitSource,
} from "~/lib/taxCalc";

export type TaxInputFormOuterProps = {
  value: TaxInput;
  onChange: (nextValue: TaxInput) => void;
};

export function createTaxInputForm(props: TaxInputFormOuterProps) {
  const form = createForm(() => ({
    defaultValues: props.value,
    listeners: {
      onChange: ({ formApi }) => {
        props.onChange(formApi.state.values);
      },
    },
  }));

  const values = form.useStore(s => s.values);

  const addSource = () => {
    form.pushFieldValue("incomeSources", newIncomeSource({ kind: "ordinary" }));
  };

  const removeSourceAt = (index: number) => {
    if (values().incomeSources.length <= 1) return;
    void form.removeFieldValue("incomeSources", index);
  };

  const addPretaxBenefit = () => {
    form.pushFieldValue("pretaxBenefitSources", newPretaxBenefitSource({ kind: "preTax401kSpouse1" }));
  };

  const removePretaxBenefitAt = (index: number) => {
    if (values().pretaxBenefitSources.length <= 1) return;
    void form.removeFieldValue("pretaxBenefitSources", index);
  };

  const addItemizedDeduction = () => {
    form.pushFieldValue("itemizedDeductions", newItemizedDeductionSource());
  };

  const removeItemizedDeductionAt = (index: number) => {
    if (values().itemizedDeductions.length <= 1) return;
    void form.removeFieldValue("itemizedDeductions", index);
  };

  const addFederalTaxCredit = () => {
    form.pushFieldValue("federalTaxCredits", newFederalTaxCreditSource());
  };

  const removeFederalTaxCreditAt = (index: number) => {
    if (values().federalTaxCredits.length <= 1) return;
    void form.removeFieldValue("federalTaxCredits", index);
  };

  const clearAllPretaxBenefits = () => {
    form.setFieldValue("pretaxBenefitSources", []);
  };

  const clearAllItemizedDeductions = () => {
    form.setFieldValue("itemizedDeductions", []);
  };

  const clearAllFederalTaxCredits = () => {
    form.setFieldValue("federalTaxCredits", []);
  };

  return {
    form,
    values,
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
  };
}
