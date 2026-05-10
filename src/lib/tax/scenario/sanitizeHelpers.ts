import type { FilingStatus } from "~/lib/tax/data/types";
import type { TaxFormData } from "~/lib/tax/form/types";
import {
  newCreditRow,
  newDeductionRow,
  newIncomeRow,
  newPretaxRow,
  taxFormDataFromParts,
} from "~/lib/tax/form/factories";

const DEFAULT_FILING_STATUS: FilingStatus = "single";



export function fallbackScenario(fallbackYear: number): TaxFormData {
  return taxFormDataFromParts({
    taxYear: fallbackYear,
    filingStatus: DEFAULT_FILING_STATUS,
    incomeRows: [newIncomeRow({ amount: 90_000 })],
    pretaxRows: [newPretaxRow()],
    useItemizedDeductions: false,
    deductionRows: [newDeductionRow()],
    creditRows: [newCreditRow()],
  });
}


