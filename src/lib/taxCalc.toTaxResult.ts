import type { FederalNiitLayer } from "~/lib/taxCalc.federalNiitLayer";
import type { PreparedScenarioAmounts } from "~/lib/taxCalc.scenarioAmounts";
import type { DeductionKind, TaxInput, TaxResult } from "~/lib/taxCalc.types";

export function toTaxResult(params: {
  input: TaxInput;
  p: PreparedScenarioAmounts;
  deductionKind: DeductionKind;
  standardDeduction: number;
  deductionAmount: number;
  fed: FederalNiitLayer;
  socialSecurityTax: number;
  medicareTax: number;
  payrollTax: number;
  takeHomePay: number;
  effectiveTaxRate: number;
  warnings: string[];
  notes: string[];
}): TaxResult {
  const { input, p, deductionKind, standardDeduction, deductionAmount, fed, notes } = params;
  return {
    taxYear: input.taxYear,
    filingStatus: input.filingStatus,
    incomeSources: p.sources,
    totalIncome: p.totalIncome,
    wageIncome: p.wageIncome,
    ordinaryGrossIncome: p.ordinaryGrossIncome,
    shortTermCapGainsGrossIncome: p.shortTermCapGainsGrossIncome,
    longTermCapitalGainsGrossIncome: p.longTermCapitalGainsGrossIncome,
    preTax401k: p.effective401,
    preTaxHsa: p.effectiveHsa,
    preTaxOther: p.effectiveOther,
    preTaxTotal: p.preTaxTotal,
    traditionalIra: p.effectiveIra,
    wagesAfterPretax: p.wagesAfterPretax,
    deductionKind,
    standardDeduction,
    deductionAmount,
    ordinaryTaxableIncome: fed.ordinaryTaxableIncome,
    longTermTaxableIncome: fed.longTermTaxableIncome,
    taxableIncome: Math.max(0, fed.ordinaryTaxableIncome + fed.longTermTaxableIncome),
    federalOrdinaryIncomeTax: fed.federalOrdinary.totalTax,
    federalLongTermCapGainsTax: fed.federalLongTermCapGains.totalTax,
    federalNetInvestmentIncomeTax: fed.federalNetInvestmentIncomeTax,
    netInvestmentIncome: fed.netInvestmentIncomeAmount,
    federalIncomeTax: fed.federalIncomeTax,
    payrollTax: params.payrollTax,
    socialSecurityTax: params.socialSecurityTax,
    medicareTax: params.medicareTax,
    takeHomePay: params.takeHomePay,
    effectiveTaxRate: params.effectiveTaxRate,
    ordinaryFederalSegments: fed.federalOrdinary.segments ?? [],
    longTermCapitalGainsSegments: fed.federalLongTermCapGains.segments ?? [],
    warnings: params.warnings,
    notes,
  };
}
