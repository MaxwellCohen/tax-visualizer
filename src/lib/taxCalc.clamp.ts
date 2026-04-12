import { getFilingStatusFromRows, getTaxYearFromRows } from "~/lib/taxCalc.inputs";
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

  const rows: TaxFormRow[] = data.rows.map((row) => {
    if (row.type === "income" || row.type === "deduction" || row.type === "credit") {
      return { ...row, amount: finiteAmount(row.amount) };
    }
    if (row.type !== "pretax") {
      return row;
    }
    let amount = finiteAmount(row.amount);
    const kind = row.kind as string;
    if (kind === "401k" || kind === "preTax401kSpouse1" || kind === "preTax401kSpouse2") {
      amount = Math.min(amount, config.pretaxLimits.electiveDeferral401k);
    } else if (kind === "hsa" || kind === "preTaxHsaSpouse1" || kind === "preTaxHsaSpouse2") {
      const limit = joint ? config.pretaxLimits.hsaFamily : config.pretaxLimits.hsaSelfOnly;
      amount = Math.min(amount, limit);
    }
    return { ...row, amount };
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
