import { capAmountsTo402gPool, finiteAmount } from "~/lib/tax/calc/pretaxBenefitSource";
import type { TaxFormRow } from "~/lib/tax/form/types";

function kindOf(row: TaxFormRow): string {
  return "kind" in row && typeof row.kind === "string" ? row.kind.toLowerCase() : "";
}

export function isSpouse2Kind(kind: string): boolean {
  return kind.toLowerCase().includes("spouse2");
}

export function isPayrollPretaxKind(kind: string): boolean {
  const k = kind.toLowerCase();
  return k.includes("input-pretax") && !k.includes("traditionalira");
}

export function isTraditionalIraKind(kind: string): boolean {
  return kind.toLowerCase().includes("traditionalira");
}

export function isHsaPretaxKind(kind: string): boolean {
  return kind.toLowerCase().includes("input-pretax-hsa");
}

/** Payroll cafeteria amounts that reduce the FICA wage base (not 401(k)/IRA). */
export function isSection125PretaxKind(kind: string): boolean {
  const k = kind.toLowerCase();
  return (
    k.includes("input-pretax-hsa") ||
    k.includes("healthfsa") ||
    k.includes("dependentcarefsa") ||
    k.includes("commuter")
  );
}

function pretaxIndexGroups(rows: TaxFormRow[]) {
  const payroll1: number[] = [];
  const payroll2: number[] = [];
  const ira1: number[] = [];
  const ira2: number[] = [];
  rows.forEach((row, i) => {
    if (row.type !== "pretax") return;
    const kind = kindOf(row);
    if (isTraditionalIraKind(kind)) {
      (isSpouse2Kind(kind) ? ira2 : ira1).push(i);
    } else if (isPayrollPretaxKind(kind)) {
      (isSpouse2Kind(kind) ? payroll2 : payroll1).push(i);
    }
  });
  return { payroll1, payroll2, ira1, ira2 };
}

function applyPool(rows: TaxFormRow[], indices: number[], limit: number): void {
  if (indices.length === 0) return;
  const amounts = indices.map((i) => finiteAmount((rows[i] as { amount: number }).amount));
  const capped = capAmountsTo402gPool(amounts, Math.max(0, limit));
  indices.forEach((rowIdx, j) => {
    (rows[rowIdx] as { amount: number }).amount = capped[j]!;
  });
}

export function wagesSpouse1FromRows(rows: TaxFormRow[]): number {
  return rows.reduce((sum, row) => {
    if (row.type !== "income") return sum;
    const kind = kindOf(row);
    if (!kind.includes("income-ordinary-wages") || isSpouse2Kind(kind)) return sum;
    return sum + finiteAmount(row.amount);
  }, 0);
}

export function wagesSpouse2FromRows(rows: TaxFormRow[]): number {
  return rows.reduce((sum, row) => {
    if (row.type !== "income") return sum;
    const kind = kindOf(row);
    if (!kind.includes("income-ordinary-wages") || !isSpouse2Kind(kind)) return sum;
    return sum + finiteAmount(row.amount);
  }, 0);
}

export function selfEmploymentSpouse1FromRows(rows: TaxFormRow[]): number {
  return rows.reduce((sum, row) => {
    if (row.type !== "income") return sum;
    const kind = kindOf(row);
    if (!kind.includes("income-ordinary-selfemployment") || isSpouse2Kind(kind)) return sum;
    return sum + finiteAmount(row.amount);
  }, 0);
}

export function selfEmploymentSpouse2FromRows(rows: TaxFormRow[]): number {
  return rows.reduce((sum, row) => {
    if (row.type !== "income") return sum;
    const kind = kindOf(row);
    if (!kind.includes("income-ordinary-selfemployment") || !isSpouse2Kind(kind)) return sum;
    return sum + finiteAmount(row.amount);
  }, 0);
}

function section125ForSpouse(rows: TaxFormRow[], spouse2: boolean): number {
  return rows.reduce((sum, row) => {
    if (row.type !== "pretax") return sum;
    const kind = kindOf(row);
    if (!isSection125PretaxKind(kind)) return sum;
    if (isSpouse2Kind(kind) !== spouse2) return sum;
    return sum + finiteAmount(row.amount);
  }, 0);
}

export function ficaWagesSpouse1FromRows(rows: TaxFormRow[]): number {
  return Math.max(0, wagesSpouse1FromRows(rows) - section125ForSpouse(rows, false));
}

export function ficaWagesSpouse2FromRows(rows: TaxFormRow[]): number {
  return Math.max(0, wagesSpouse2FromRows(rows) - section125ForSpouse(rows, true));
}

/**
 * Cap payroll pretax at that spouse's W-2 wages and deductible IRA at earned income
 * (W-2 + net self-employment) so the form and tax math use the same amounts.
 */
export function applyPretaxCompensationCaps(rows: TaxFormRow[]): TaxFormRow[] {
  const out = rows.map((row) =>
    row.type === "pretax" ? { ...row, amount: finiteAmount(row.amount) } : row,
  );
  const groups = pretaxIndexGroups(out);
  const wages1 = wagesSpouse1FromRows(out);
  const wages2 = wagesSpouse2FromRows(out);
  const earned1 = wages1 + selfEmploymentSpouse1FromRows(out);
  const earned2 = wages2 + selfEmploymentSpouse2FromRows(out);
  applyPool(out, groups.payroll1, wages1);
  applyPool(out, groups.payroll2, wages2);
  applyPool(out, groups.ira1, earned1);
  applyPool(out, groups.ira2, earned2);
  return out;
}

export function applyHsaHouseholdCap(rows: TaxFormRow[], householdLimit: number): TaxFormRow[] {
  const out = rows.map((row) => (row.type === "pretax" ? { ...row } : row));
  const indices: number[] = [];
  out.forEach((row, i) => {
    if (row.type === "pretax" && isHsaPretaxKind(kindOf(row))) indices.push(i);
  });
  applyPool(out, indices, householdLimit);
  return out;
}
