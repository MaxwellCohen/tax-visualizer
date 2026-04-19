import type { PretaxBenefitKind, PretaxBenefitSource } from "~/lib/taxCalc.types";
import type { TaxFormCreditRow, TaxFormData, TaxFormDeductionRow, TaxFormIncomeRow, TaxFormPretaxRow } from "~/lib/taxForm.types";
import type { FilingStatus } from "~/lib/taxData.types";
import {
  incomeSourcesToRows,
  pretaxSourcesToRows,
  taxFormDataFromParts,
} from "~/lib/taxForm.factories";

type BaseInputOverrides = Partial<{
  taxYear: number;
  filingStatus: FilingStatus;
  incomeRows: TaxFormIncomeRow[];
  pretaxRows: TaxFormPretaxRow[];
  useItemizedDeductions: boolean;
  deductionRows: TaxFormDeductionRow[];
  creditRows: TaxFormCreditRow[];
}>;

export function baseInput(overrides?: BaseInputOverrides): TaxFormData {
  return taxFormDataFromParts({
    taxYear: overrides?.taxYear ?? 2025,
    filingStatus: overrides?.filingStatus ?? "single",
    incomeRows:
      overrides?.incomeRows ??
      incomeSourcesToRows([{ id: "1", kind: "income-ordinary-wages", label: "Wages", amount: 100_000 }]),
    pretaxRows: overrides?.pretaxRows ?? [],
    useItemizedDeductions: overrides?.useItemizedDeductions ?? false,
    deductionRows: overrides?.deductionRows ?? [],
    creditRows: overrides?.creditRows ?? [],
  });
}

export function withPretaxTotals(partial: Partial<Record<string, number>>): TaxFormPretaxRow[] {
  const sources: PretaxBenefitSource[] = Object.entries(partial).map(([kind, amount], i) => ({
    id: String(i + 1),
    kind: kind as PretaxBenefitKind,
    label: kind,
    amount: amount ?? 0,
  }));
  return pretaxSourcesToRows(sources);
}


