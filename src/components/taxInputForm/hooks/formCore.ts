import { createForm } from "@tanstack/solid-form";
import type { TaxInput } from "~/lib/taxCalc";
import { newIncomeSource } from "~/lib/taxCalc";

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

  return { form, values, addSource, removeSourceAt };
}
