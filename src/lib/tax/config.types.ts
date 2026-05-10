import type {
  FederalTaxCreditSource,
  IncomeSource,
  ItemizedDeductionSource,
  PretaxBenefitSource,
} from "~/lib/tax/calc/types";
import type { FilingStatus } from "~/lib/tax/data/types";


export type TaxCalculationInputs = {
  taxYear: number;
  filingStatus: FilingStatus;
  qualifyingChildren: number;
  otherDependents: number;
  incomeSources: IncomeSource[];
  pretaxBenefitSources: PretaxBenefitSource[];
  useItemizedDeductions: boolean;
  itemizedDeductions: ItemizedDeductionSource[];
  federalTaxCredits: FederalTaxCreditSource[];
};



