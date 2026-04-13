import { getFilingStatusFromRows, getTaxYearFromRows } from "~/lib/taxCalc.inputs";
import { capAmountsTo402gPool } from "~/lib/taxCalc.pretaxBenefitSource";
import type { TaxFormData, TaxFormRow } from "~/lib/taxForm.types";
import { getTaxYearConfig } from "~/lib/taxData";

/** Form boundary: coerce non-finite amounts so the tax engine only sees real numbers or zero. */
function finiteAmount(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

function sanitizeNumericRows(rows: TaxFormRow[]): TaxFormRow[] {
  return rows.map((row) => {
    if (row.type === "income" || row.type === "pretax" || row.type === "deduction" || row.type === "credit") {
      return { ...row, amount: finiteAmount(row.amount) };
    }
    return row;
  });
}

export function clampTaxFormData(data: TaxFormData): TaxFormData {
  const taxYear = getTaxYearFromRows(data.rows);
  const filingStatus = getFilingStatusFromRows(data.rows);
  const config = getTaxYearConfig(taxYear);
  if (!config) {
    return { rows: sanitizeNumericRows(data.rows) };
  }

  const joint = filingStatus === "marriedJoint";
  const electiveCap = config.pretaxLimits.electiveDeferral401k;

  const rowsAfterFinite: TaxFormRow[] = data.rows.map((row) => {
    if (row.type === "income" || row.type === "deduction" || row.type === "credit") {
      return { ...row, amount: finiteAmount(row.amount) };
    }
    if (row.type === "pretax") {
      return { ...row, amount: finiteAmount(row.amount) };
    }
    return row;
  });

  const rows = applyElectiveDeferral402gClampToRows(rowsAfterFinite, electiveCap, joint).map((row) => {
    if (row.type !== "pretax") {
      return row;
    }
    const kind = (row.kind as string).toLowerCase();
    if (kind.includes("hsa")) {
      const limit = joint ? config.pretaxLimits.hsaFamily : config.pretaxLimits.hsaSelfOnly;
      return { ...row, amount: Math.min(row.amount, limit) };
    }
    return row;
  });

  const rows2 = rows.map((row) => {
    if (row.type !== "deduction") {
      return row;
    }
    if (row.kind === "salt") {
      const saltMax = config.itemizedCaps.saltMax[filingStatus];
      return { ...row, amount: Math.min(row.amount, saltMax) };
    }
    return row;
  });

  const rows3 = rows2.map((row) => {
    if (row.type !== "credit") {
      return row;
    }
    const cap = config.federalTaxCreditCaps[row.kind] ?? Infinity;
    return { ...row, amount: Math.min(row.amount, cap) };
  });

  return { rows: rows3 };
}

/** §402(g): combined cap for all 401(k)+403(b) lines per spouse (not per row). */
function applyElectiveDeferral402gClampToRows(
  rows: TaxFormRow[],
  electiveLimit: number,
  joint: boolean,
): TaxFormRow[] {
  const out = rows.map((r) => ({ ...r })) as TaxFormRow[];
  const idxS1: number[] = [];
  const idxS2: number[] = [];
  out.forEach((row, i) => {
    if (row.type !== "pretax") return;
    const k = (row.kind as string).toLowerCase();
    if (!k.includes("401k") && !k.includes("403b")) return;
    if (k.includes("spouse2")) {
      if (joint) idxS2.push(i);
    } else {
      idxS1.push(i);
    }
  });
  const applyPool = (indices: number[]) => {
    if (indices.length === 0) return;
    const amounts = indices.map((i) => (out[i] as { amount: number }).amount);
    const capped = capAmountsTo402gPool(amounts, electiveLimit);
    indices.forEach((rowIdx, j) => {
      (out[rowIdx] as { amount: number }).amount = capped[j]!;
    });
  };
  applyPool(idxS1);
  applyPool(idxS2);
  return out;
}
