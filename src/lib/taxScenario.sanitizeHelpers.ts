import type { FilingStatus } from "~/lib/taxData";
import type { TaxFormData } from "~/lib/taxForm.types";
import {
  newCreditRow,
  newDeductionRow,
  newIncomeRow,
  newPretaxRow,
  taxFormDataFromParts,
} from "~/lib/taxForm.factories";

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


