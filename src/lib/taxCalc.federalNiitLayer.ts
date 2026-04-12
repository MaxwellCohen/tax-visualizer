import { FEDERAL_NIIT } from "~/lib/taxData.constants";
import { calculateFederalTaxBreakdown } from "~/lib/taxCalc.federalOrdinary";
import { calculateLongTermCapGainsTax } from "~/lib/taxCalc.federalLtcg";
import type { PreparedScenarioAmounts } from "~/lib/taxCalc.scenarioAmounts";
import type { TaxInput } from "~/lib/taxCalc.types";
import type { TaxYearConfig } from "~/lib/taxData.types";

export type FederalNiitLayer = {
  ordinaryTaxableIncome: number;
  longTermTaxableIncome: number;
  /** Portion of the deduction that offsets ordinary (+ short-term gain) income after IRA adjustments. */
  deductionAllocatedToOrdinary: number;
  /** Portion of the deduction that offsets long-term gain gross (for Sankey: not drawn from LTCG income rows). */
  deductionAllocatedToLongTermGross: number;
  federalOrdinary: ReturnType<typeof calculateFederalTaxBreakdown>;
  federalLongTermCapGains: ReturnType<typeof calculateLongTermCapGainsTax>;
  federalNetInvestmentIncomeTax: number;
  netInvestmentIncomeAmount: number;
  federalIncomeTax: number;
};

export function computeFederalNiitLayer(
  input: TaxInput,
  config: TaxYearConfig,
  p: PreparedScenarioAmounts,
  deductionAmount: number,
): FederalNiitLayer {
  const deductionAllocatedToOrdinary = Math.min(deductionAmount, p.ordinaryAfterIra);
  const ordinaryTaxableIncome = p.ordinaryAfterIra - deductionAllocatedToOrdinary;
  const remainingDeduction = Math.max(0, deductionAmount - deductionAllocatedToOrdinary);
  const longTermTaxableIncome = Math.max(0, p.longTermCapitalGainsGrossIncome - remainingDeduction);
  const deductionAllocatedToLongTermGross =
    p.longTermCapitalGainsGrossIncome - longTermTaxableIncome;

  const federalOrdinary = calculateFederalTaxBreakdown(
    ordinaryTaxableIncome,
    input.taxYear,
    input.filingStatus,
  );
  const federalLongTermCapGains = calculateLongTermCapGainsTax(
    ordinaryTaxableIncome,
    longTermTaxableIncome,
    config.longTermCapGains[input.filingStatus],
  );

  const deductionToOrdinary = deductionAllocatedToOrdinary;
  const deductionFromShortTermCapGains = Math.max(0, deductionToOrdinary - p.nonInvestmentAfterIra);
  const shortTermCapGainsTaxableForNiit = Math.max(
    0,
    p.shortTermCapGainsGrossIncome - deductionFromShortTermCapGains,
  );
  const netInvestmentIncomeAmount = shortTermCapGainsTaxableForNiit + longTermTaxableIncome;
  const magiForNiit = p.ordinaryAfterIra + p.longTermCapitalGainsGrossIncome + (p.selfEmploymentIncome * 0.9235);
  const magiOverNiitThreshold = Math.max(
    0,
    magiForNiit - FEDERAL_NIIT.magiThreshold[input.filingStatus],
  );
  const federalNetInvestmentIncomeTax =
    netInvestmentIncomeAmount > 0 && magiOverNiitThreshold > 0
      ? FEDERAL_NIIT.rate * Math.min(netInvestmentIncomeAmount, magiOverNiitThreshold)
      : 0;

  const federalIncomeTax =
    federalOrdinary.totalTax + federalLongTermCapGains.totalTax + federalNetInvestmentIncomeTax;

  return {
    ordinaryTaxableIncome,
    longTermTaxableIncome,
    deductionAllocatedToOrdinary,
    deductionAllocatedToLongTermGross,
    federalOrdinary,
    federalLongTermCapGains,
    federalNetInvestmentIncomeTax,
    netInvestmentIncomeAmount,
    federalIncomeTax,
  };
}
