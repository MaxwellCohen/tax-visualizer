import { FEDERAL_NIIT } from "~/lib/taxData.constants";
import { calculateFederalTaxBreakdown } from "~/lib/taxCalc.federalOrdinary";
import { calculateLongTermCapGainsTax } from "~/lib/taxCalc.federalLtcg";
import type { PreparedScenarioAmounts } from "~/lib/taxCalc.scenarioAmounts";
import type { TaxInput } from "~/lib/taxCalc.types";
import type { TaxYearConfig } from "~/lib/taxData.types";

export type FederalNiitLayer = {
  ordinaryTaxableIncome: number;
  longTermTaxableIncome: number;
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
  const deductionAppliedToOrdinary = Math.min(deductionAmount, p.ordinaryAfterIra);
  const ordinaryTaxableIncome = p.ordinaryAfterIra - deductionAppliedToOrdinary;
  const remainingDeduction = Math.max(0, deductionAmount - deductionAppliedToOrdinary);
  const longTermTaxableIncome = Math.max(0, p.longTermCapitalGainsGrossIncome - remainingDeduction);

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

  const deductionToOrdinary = Math.min(deductionAmount, p.ordinaryAfterIra);
  const deductionFromShortTermCapGains = Math.max(0, deductionToOrdinary - p.nonInvestmentAfterIra);
  const shortTermCapGainsTaxableForNiit = Math.max(
    0,
    p.shortTermCapGainsGrossIncome - deductionFromShortTermCapGains,
  );
  const netInvestmentIncomeAmount = shortTermCapGainsTaxableForNiit + longTermTaxableIncome;
  const magiForNiit = p.ordinaryAfterIra + p.longTermCapitalGainsGrossIncome;
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
    federalOrdinary,
    federalLongTermCapGains,
    federalNetInvestmentIncomeTax,
    netInvestmentIncomeAmount,
    federalIncomeTax,
  };
}
