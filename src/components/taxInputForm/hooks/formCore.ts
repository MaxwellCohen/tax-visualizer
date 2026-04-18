import { createForm } from "@tanstack/solid-form";
import { createDeductionMemos } from "~/components/taxInputForm/hooks/deductionMemos";
import { createLimitMemos } from "~/components/taxInputForm/hooks/limitMemos";
import { newFederalTaxCreditSource } from "~/lib/taxCalc.federalTaxCreditSource";
import { newItemizedDeductionSource } from "~/lib/taxCalc.itemizedDeductionSource";
import { newPretaxBenefitSource } from "~/lib/taxCalc.pretaxBenefitSource";
import type { TaxFormData, TaxFormRow } from "~/lib/taxForm.types";
import {
  creditRowIndices,
  deductionRowIndices,
  incomeRowIndices,
  pretaxRowIndices,
  settingRowIndex,
} from "~/lib/taxForm.rows";
import { newIncomeRow, newPretaxRow } from "~/lib/taxForm.factories";

export type TaxInputFormOuterProps = {
  value: TaxFormData;
  onChange: (nextValue: TaxFormData) => void;
  /** Called when focus leaves a field inside the form (focusout); use to sync URL without per-keystroke updates. */
  onCommitToUrl?: () => void;
};

function insertIndexForNewIncome(rows: TaxFormRow[]): number {
  const inc = incomeRowIndices(rows);
  if (inc.length > 0) return inc[inc.length - 1] + 1;
  const afterFiling = settingRowIndex(rows, "filingStatus");
  return afterFiling >= 0 ? afterFiling + 1 : 0;
}

function insertIndexForNewPretax(rows: TaxFormRow[]): number {
  const p = pretaxRowIndices(rows);
  if (p.length > 0) return p[p.length - 1] + 1;
  return insertIndexForNewIncome(rows);
}

function insertIndexForNewDeduction(rows: TaxFormRow[]): number {
  const d = deductionRowIndices(rows);
  if (d.length > 0) return d[d.length - 1] + 1;
  const ui = settingRowIndex(rows, "useItemizedDeductions");
  return ui >= 0 ? ui + 1 : rows.length;
}

function insertIndexForNewCredit(rows: TaxFormRow[]): number {
  const c = creditRowIndices(rows);
  if (c.length > 0) return c[c.length - 1] + 1;
  return insertIndexForNewDeduction(rows);
}

function spliceRows(rows: TaxFormRow[], index: number, row: TaxFormRow): TaxFormRow[] {
  const next = [...rows];
  next.splice(index, 0, row);
  return next;
}

function removeRowAt(rows: TaxFormRow[], index: number): TaxFormRow[] {
  return rows.filter((_, i) => i !== index);
}

export function createTaxInputForm(props: TaxInputFormOuterProps) {
  const form = createForm(() => ({
    defaultValues: props.value,
    listeners: {
      onChange: ({ formApi }) => {
        props.onChange(formApi.state.values);
      },
    },
  }));

  const values = form.useStore((s) => s.values);

  const limits = createLimitMemos(values);
  const deduction = createDeductionMemos(values, limits.selectedTaxConfig);

  const addSource = () => {
    const v = values();
    const idx = insertIndexForNewIncome(v.rows);
    const newRows = spliceRows(v.rows, idx, newIncomeRow({ kind: "ordinary" }));
    form.setFieldValue("rows", newRows);
    props.onChange({ ...v, rows: newRows });
  };

  const removeSourceAt = (rowIndex: number) => {
    const v = values();
    if (incomeRowIndices(v.rows).length <= 1) return;
    const newRows = removeRowAt(v.rows, rowIndex);
    form.setFieldValue("rows", newRows);
    props.onChange({ ...v, rows: newRows });
  };

  const addPretaxBenefit = () => {
    const v = values();
    const src = newPretaxBenefitSource({ kind: "preTax401kSpouse1" });
    const idx = insertIndexForNewPretax(v.rows);
    const newRows = spliceRows(v.rows, idx, newPretaxRow({ id: src.id, kind: src.kind, label: src.label, amount: src.amount }));
    form.setFieldValue("rows", newRows);
    props.onChange({ ...v, rows: newRows });
  };

  const removePretaxBenefitAt = (rowIndex: number) => {
    const v = values();
    if (pretaxRowIndices(v.rows).length <= 1) return;
    const newRows = removeRowAt(v.rows, rowIndex);
    form.setFieldValue("rows", newRows);
    props.onChange({ ...v, rows: newRows });
  };

  const addItemizedDeduction = () => {
    const v = values();
    const src = newItemizedDeductionSource();
    const idx = insertIndexForNewDeduction(v.rows);
    const newRows = spliceRows(v.rows, idx, { type: "deduction", id: src.id, kind: src.kind, label: src.label, amount: src.amount });
    form.setFieldValue("rows", newRows);
    props.onChange({ ...v, rows: newRows });
  };

  const removeItemizedDeductionAt = (rowIndex: number) => {
    const v = values();
    if (deductionRowIndices(v.rows).length <= 1) return;
    const newRows = removeRowAt(v.rows, rowIndex);
    form.setFieldValue("rows", newRows);
    props.onChange({ ...v, rows: newRows });
  };

  const addFederalTaxCredit = () => {
    const v = values();
    const src = newFederalTaxCreditSource();
    const idx = insertIndexForNewCredit(v.rows);
    const newRows = spliceRows(v.rows, idx, { type: "credit", id: src.id, kind: src.kind, label: src.label, amount: src.amount });
    form.setFieldValue("rows", newRows);
    props.onChange({ ...v, rows: newRows });
  };

  const removeFederalTaxCreditAt = (rowIndex: number) => {
    const v = values();
    if (creditRowIndices(v.rows).length <= 1) return;
    const newRows = removeRowAt(v.rows, rowIndex);
    form.setFieldValue("rows", newRows);
    props.onChange({ ...v, rows: newRows });
  };

  const clearAllPretaxBenefits = () => {
    const v = values();
    const newRows = v.rows.filter((r) => r.type !== "pretax");
    form.setFieldValue("rows", newRows);
    props.onChange({ ...v, rows: newRows });
  };

  const clearAllItemizedDeductions = () => {
    const v = values();
    const newRows = v.rows.filter((r) => r.type !== "deduction");
    form.setFieldValue("rows", newRows);
    props.onChange({ ...v, rows: newRows });
  };

  const clearAllFederalTaxCredits = () => {
    const v = values();
    const newRows = v.rows.filter((r) => r.type !== "credit");
    form.setFieldValue("rows", newRows);
    props.onChange({ ...v, rows: newRows });
  };

  return {
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
  };
}
