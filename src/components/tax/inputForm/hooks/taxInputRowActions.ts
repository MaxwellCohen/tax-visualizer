import type { Setter } from "solid-js";
import { newFederalTaxCreditSource } from "~/lib/tax/calc/federalTaxCreditSource";
import { newItemizedDeductionSource } from "~/lib/tax/calc/itemizedDeductionSource";
import { newPretaxBenefitSource } from "~/lib/tax/calc/pretaxBenefitSource";
import type {
  TaxFormCreditRow,
  TaxFormData,
  TaxFormDeductionRow,
  TaxFormIncomeRow,
  TaxFormPretaxRow,
  TaxFormRow,
} from "~/lib/tax/form/types";
import {
  creditRowIndices,
  deductionRowIndices,
  incomeRowIndices,
  pretaxRowIndices,
  settingRowIndex,
} from "~/lib/tax/form/rows";
import { newIncomeRow, newPretaxRow } from "~/lib/tax/form/factories";

function taxFormRowEqual(a: TaxFormRow, b: TaxFormRow): boolean {
  if (a.type !== b.type) return false;
  switch (a.type) {
    case "setting":
      return b.type === "setting" && a.id === b.id && a.value === b.value;
    case "income": {
      const bi = b as TaxFormIncomeRow;
      return a.id === bi.id && a.kind === bi.kind && a.label === bi.label && a.amount === bi.amount;
    }
    case "pretax": {
      const bp = b as TaxFormPretaxRow;
      return a.id === bp.id && a.kind === bp.kind && a.label === bp.label && a.amount === bp.amount;
    }
    case "deduction": {
      const bd = b as TaxFormDeductionRow;
      return a.id === bd.id && a.kind === bd.kind && a.label === bd.label && a.amount === bd.amount;
    }
    case "credit": {
      const bc = b as TaxFormCreditRow;
      return a.id === bc.id && a.kind === bc.kind && a.label === bc.label && a.amount === bc.amount;
    }
    default:
      return false;
  }
}

/** Row-order-sensitive equality (matches prior JSON.stringify contract for `TaxFormData.rows`). */
export function taxFormDataEquals(a: TaxFormData, b: TaxFormData): boolean {
  const ra = a.rows;
  const rb = b.rows;
  if (ra.length !== rb.length) return false;
  for (let i = 0; i < ra.length; i++) {
    if (!taxFormRowEqual(ra[i]!, rb[i]!)) return false;
  }
  return true;
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

export type CommitTaxInputToUrl = (data?: TaxFormData) => void;

export function createTaxInputRowActions(
  setTaxInput: Setter<TaxFormData>,
  commitToUrl?: CommitTaxInputToUrl,
) {
  const writeAndSync = (next: TaxFormData | ((prev: TaxFormData) => TaxFormData)) => {
    const written = setTaxInput(next);
    commitToUrl?.(written);
    return written;
  };

  const addSource = () => {
    writeAndSync((prev) => {
      const idx = insertIndexForNewIncome(prev.rows);
      return { ...prev, rows: spliceRows(prev.rows, idx, newIncomeRow()) };
    });
  };

  const removeSourceAt = (rowIndex: number) => {
    let mutated = false;
    const written = setTaxInput((prev) => {
      if (incomeRowIndices(prev.rows).length <= 1) return prev;
      mutated = true;
      return { ...prev, rows: removeRowAt(prev.rows, rowIndex) };
    });
    if (mutated) commitToUrl?.(written);
  };

  const addPretaxBenefit = () => {
    writeAndSync((prev) => {
      const src = newPretaxBenefitSource();
      const idx = insertIndexForNewPretax(prev.rows);
      return {
        ...prev,
        rows: spliceRows(
          prev.rows,
          idx,
          newPretaxRow({ id: src.id, kind: src.kind, label: src.label, amount: src.amount }),
        ),
      };
    });
  };

  const removePretaxBenefitAt = (rowIndex: number) => {
    let mutated = false;
    const written = setTaxInput((prev) => {
      if (pretaxRowIndices(prev.rows).length <= 1) return prev;
      mutated = true;
      return { ...prev, rows: removeRowAt(prev.rows, rowIndex) };
    });
    if (mutated) commitToUrl?.(written);
  };

  const addItemizedDeduction = () => {
    writeAndSync((prev) => {
      const src = newItemizedDeductionSource();
      const idx = insertIndexForNewDeduction(prev.rows);
      return {
        ...prev,
        rows: spliceRows(prev.rows, idx, {
          type: "deduction",
          id: src.id,
          kind: src.kind,
          label: src.label,
          amount: src.amount,
        }),
      };
    });
  };

  const removeItemizedDeductionAt = (rowIndex: number) => {
    let mutated = false;
    const written = setTaxInput((prev) => {
      if (deductionRowIndices(prev.rows).length <= 1) return prev;
      mutated = true;
      return { ...prev, rows: removeRowAt(prev.rows, rowIndex) };
    });
    if (mutated) commitToUrl?.(written);
  };

  const addFederalTaxCredit = () => {
    writeAndSync((prev) => {
      const src = newFederalTaxCreditSource();
      const idx = insertIndexForNewCredit(prev.rows);
      return {
        ...prev,
        rows: spliceRows(prev.rows, idx, {
          type: "credit",
          id: src.id,
          kind: src.kind,
          label: src.label,
          amount: src.amount,
        }),
      };
    });
  };

  const removeFederalTaxCreditAt = (rowIndex: number) => {
    let mutated = false;
    const written = setTaxInput((prev) => {
      if (creditRowIndices(prev.rows).length <= 1) return prev;
      mutated = true;
      return { ...prev, rows: removeRowAt(prev.rows, rowIndex) };
    });
    if (mutated) commitToUrl?.(written);
  };

  const clearAllPretaxBenefits = () => {
    writeAndSync((prev) => ({ ...prev, rows: prev.rows.filter((r) => r.type !== "pretax") }));
  };

  const clearAllItemizedDeductions = () => {
    writeAndSync((prev) => ({ ...prev, rows: prev.rows.filter((r) => r.type !== "deduction") }));
  };

  const clearAllFederalTaxCredits = () => {
    writeAndSync((prev) => ({ ...prev, rows: prev.rows.filter((r) => r.type !== "credit") }));
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

export type TaxInputRowActions = ReturnType<typeof createTaxInputRowActions>;
