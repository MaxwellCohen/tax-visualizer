import { getFilingStatusFromRows, getTaxYearFromRows } from "~/lib/tax/calc/inputs";
import { capAmountsTo402gPool, finiteAmount } from "~/lib/tax/calc/pretaxBenefitSource";
import type { TaxFormData, TaxFormRow } from "~/lib/tax/form/types";
import { getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import { buildValidationContext, findInputItemForKind } from "~/lib/config/taxPage/taxPage.config";

function sanitizeNumericRows(rows: TaxFormRow[]): TaxFormRow[] {
  return rows.map((row) => {
    if (row.type === "income" || row.type === "pretax" || row.type === "deduction" || row.type === "credit") {
      return { ...row, amount: finiteAmount(row.amount) };
    }
    return row;
  });
}

function clampRowsWithConfigValidation(
  rows: TaxFormRow[],
  taxData: TaxYearConfig,
  taxYear: number,
  filingStatus: FilingStatus,
): TaxFormRow[] {
  const ctx = buildValidationContext(taxYear, filingStatus);
  if (!ctx) return rows;

  return rows.map((row) => {
    if (row.type !== "income" && row.type !== "pretax" && row.type !== "deduction" && row.type !== "credit") {
      return row;
    }
    const validate = findInputItemForKind(taxData, filingStatus, row.kind)?.input?.validate;
    if (!validate) return row;

    const result = validate(row.amount, ctx);
    return !result.valid && typeof result.clampedValue === "number" && Number.isFinite(result.clampedValue)
      ? { ...row, amount: result.clampedValue }
      : row;
  });
}

export function clampTaxFormData(data: TaxFormData): TaxFormData {
  const taxYear = getTaxYearFromRows(data.rows);
  const filingStatus = getFilingStatusFromRows(data.rows);
  const config = getTaxYearConfig(taxYear);
  const finiteRows = sanitizeNumericRows(data.rows);
  if (!config) {
    return { rows: finiteRows };
  }

  const joint = filingStatus === "marriedJoint";
  const electiveCap = config.pretaxLimits.electiveDeferral401k;
  const pooledRows = applyElectiveDeferral402gClampToRows(finiteRows, electiveCap, joint);
  return { rows: clampRowsWithConfigValidation(pooledRows, config, taxYear, filingStatus) };
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
