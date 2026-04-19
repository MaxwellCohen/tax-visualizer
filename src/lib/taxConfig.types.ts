import type {
  FederalTaxCreditSource,
  IncomeSource,
  ItemizedDeductionSource,
  PretaxBenefitSource,
} from "~/lib/taxCalc.types";
import type { FilingStatus } from "~/lib/taxData.types";


export type TaxCalculationInputs = {
  taxYear: number;
  filingStatus: FilingStatus;
  incomeSources: IncomeSource[];
  pretaxBenefitSources: PretaxBenefitSource[];
  useItemizedDeductions: boolean;
  itemizedDeductions: ItemizedDeductionSource[];
  federalTaxCredits: FederalTaxCreditSource[];
};



