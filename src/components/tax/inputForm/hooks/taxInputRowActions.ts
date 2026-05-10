import type { Setter } from "solid-js";
import { newFederalTaxCreditSource } from "~/lib/tax/calc/federalTaxCreditSource";
import { newItemizedDeductionSource } from "~/lib/tax/calc/itemizedDeductionSource";
import { newPretaxBenefitSource } from "~/lib/tax/calc/pretaxBenefitSource";
import type { TaxFormData, TaxFormRow } from "~/lib/tax/form/types";
import {
  creditRowIndices,
  deductionRowIndices,
  incomeRowIndices,
  pretaxRowIndices,
  settingRowIndex,
} from "~/lib/tax/form/rows";
import { newIncomeRow, newPretaxRow } from "~/lib/tax/form/factories";

export function taxFormDataEquals(a: TaxFormData, b: TaxFormData): boolean {
  return JSON.stringify(a.rows) === JSON.stringify(b.rows);
}

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

export function createTaxInputRowActions(
  setTaxInput: Setter<TaxFormData>,
  commitToUrl?: () => void,
) {
  const syncUrl = () => {
    commitToUrl?.();
  };

  const addSource = () => {
    setTaxInput((prev) => {
      const idx = insertIndexForNewIncome(prev.rows);
      const newRows = spliceRows(prev.rows, idx, newIncomeRow());
      return { ...prev, rows: newRows };
    });
    syncUrl();
  };

  const removeSourceAt = (rowIndex: number) => {
    let mutated = false;
    setTaxInput((prev) => {
      if (incomeRowIndices(prev.rows).length <= 1) return prev;
      mutated = true;
      return { ...prev, rows: removeRowAt(prev.rows, rowIndex) };
    });
    if (mutated) syncUrl();
  };

  const addPretaxBenefit = () => {
    setTaxInput((prev) => {
      const src = newPretaxBenefitSource();
      const idx = insertIndexForNewPretax(prev.rows);
      const newRows = spliceRows(
        prev.rows,
        idx,
        newPretaxRow({ id: src.id, kind: src.kind, label: src.label, amount: src.amount }),
      );
      return { ...prev, rows: newRows };
    });
    syncUrl();
  };

  const removePretaxBenefitAt = (rowIndex: number) => {
    let mutated = false;
    setTaxInput((prev) => {
      if (pretaxRowIndices(prev.rows).length <= 1) return prev;
      mutated = true;
      return { ...prev, rows: removeRowAt(prev.rows, rowIndex) };
    });
    if (mutated) syncUrl();
  };

  const addItemizedDeduction = () => {
    setTaxInput((prev) => {
      const src = newItemizedDeductionSource();
      const idx = insertIndexForNewDeduction(prev.rows);
      const newRows = spliceRows(prev.rows, idx, {
        type: "deduction",
        id: src.id,
        kind: src.kind,
        label: src.label,
        amount: src.amount,
      });
      return { ...prev, rows: newRows };
    });
    syncUrl();
  };

  const removeItemizedDeductionAt = (rowIndex: number) => {
    let mutated = false;
    setTaxInput((prev) => {
      if (deductionRowIndices(prev.rows).length <= 1) return prev;
      mutated = true;
      return { ...prev, rows: removeRowAt(prev.rows, rowIndex) };
    });
    if (mutated) syncUrl();
  };

  const addFederalTaxCredit = () => {
    setTaxInput((prev) => {
      const src = newFederalTaxCreditSource();
      const idx = insertIndexForNewCredit(prev.rows);
      const newRows = spliceRows(prev.rows, idx, {
        type: "credit",
        id: src.id,
        kind: src.kind,
        label: src.label,
        amount: src.amount,
      });
      return { ...prev, rows: newRows };
    });
    syncUrl();
  };

  const removeFederalTaxCreditAt = (rowIndex: number) => {
    let mutated = false;
    setTaxInput((prev) => {
      if (creditRowIndices(prev.rows).length <= 1) return prev;
      mutated = true;
      return { ...prev, rows: removeRowAt(prev.rows, rowIndex) };
    });
    if (mutated) syncUrl();
  };

  const clearAllPretaxBenefits = () => {
    setTaxInput((prev) => ({ ...prev, rows: prev.rows.filter((r) => r.type !== "pretax") }));
    syncUrl();
  };

  const clearAllItemizedDeductions = () => {
    setTaxInput((prev) => ({ ...prev, rows: prev.rows.filter((r) => r.type !== "deduction") }));
    syncUrl();
  };

  const clearAllFederalTaxCredits = () => {
    setTaxInput((prev) => ({ ...prev, rows: prev.rows.filter((r) => r.type !== "credit") }));
    syncUrl();
  };

  return {
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
