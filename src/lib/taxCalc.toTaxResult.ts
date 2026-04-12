import type { FederalNiitLayer } from "~/lib/taxCalc.federalNiitLayer";
import type { PreparedScenarioAmounts } from "~/lib/taxCalc.scenarioAmounts";
import type { DeductionKind, TaxInput, TaxResult, TaxResultEntry } from "~/lib/taxCalc.types";

function pushEntry(arr: TaxResultEntry[], kind: string, value: number, label?: string, category?: string): void {
  if (value !== undefined && value !== null && !isNaN(value)) {
    arr.push({ kind, value, label, category });
  }
}

export function toTaxResult(params: {
  input: TaxInput;
  p: PreparedScenarioAmounts;
  deductionKind: DeductionKind;
  standardDeduction: number;
  deductionAmount: number;
  fed: FederalNiitLayer;
  federalIncomeTaxBeforeCredits: number;
  federalTaxCreditsEntered: number;
  federalTaxCreditsApplied: number;
  federalIncomeTaxAfterCredits: number;
  socialSecurityTax: number;
  medicareTax: number;
  payrollTax: number;
  selfEmploymentTax: number;
  takeHomePay: number;
  effectiveTaxRate: number;
  warnings: string[];
  notes: string[];
}): TaxResult {
  const { input, p, fed } = params;
  const entries: TaxResultEntry[] = [];

  pushEntry(entries, "totalIncome", p.totalIncome, "Total Income", "income");
  pushEntry(entries, "wageIncome", p.wageIncome, "W-2 Wages", "income");
  pushEntry(entries, "selfEmploymentIncome", p.selfEmploymentIncome / 0.9235, "1099 Self-Employment", "income");
  pushEntry(entries, "ordinaryGrossIncome", p.ordinaryGrossIncome, "Ordinary Income", "income");
  pushEntry(entries, "shortTermCapGainsGrossIncome", p.shortTermCapGainsGrossIncome, "Short-Term Cap Gains", "income");
  pushEntry(entries, "longTermCapitalGainsGrossIncome", p.longTermCapitalGainsGrossIncome, "Long-Term Cap Gains", "income");

  pushEntry(entries, "preTax401k", p.effective401, "401(k) Deferrals", "pretax");
  pushEntry(entries, "preTaxHsa", p.effectiveHsa, "HSA (payroll)", "pretax");
  pushEntry(entries, "preTaxOther", p.effectiveOther, "Other Pre-tax", "pretax");
  pushEntry(entries, "preTaxTotal", p.preTaxTotal, "Payroll pre-tax", "pretax");
  pushEntry(entries, "traditionalIra", p.effectiveIra, "Traditional IRA", "pretax");
  pushEntry(entries, "wagesAfterPretax", p.wagesAfterPretax, "Wages After Pre-tax", "pretax");

  pushEntry(entries, "standardDeduction", params.standardDeduction, "Standard Deduction", "deduction");
  pushEntry(entries, "deductionAmount", params.deductionAmount, "Deduction Used", "deduction");
  pushEntry(entries, "deductionAllocatedToOrdinary", fed.deductionAllocatedToOrdinary, "Deduction → Ordinary", "deduction");
  pushEntry(entries, "deductionAllocatedToLongTermGross", fed.deductionAllocatedToLongTermGross, "Deduction → LTCG", "deduction");

  pushEntry(entries, "ordinaryTaxableIncome", fed.ordinaryTaxableIncome, "Ordinary Taxable", "income");
  pushEntry(entries, "longTermTaxableIncome", fed.longTermTaxableIncome, "LTCG Taxable", "income");
  pushEntry(entries, "taxableIncome", Math.max(0, fed.ordinaryTaxableIncome + fed.longTermTaxableIncome), "Taxable Income", "income");

  pushEntry(entries, "federalOrdinaryIncomeTax", fed.federalOrdinary.totalTax, "Federal Ord. Tax", "tax");
  pushEntry(entries, "federalLongTermCapGainsTax", fed.federalLongTermCapGains.totalTax, "Federal LTCG Tax", "tax");
  pushEntry(entries, "federalNetInvestmentIncomeTax", fed.federalNetInvestmentIncomeTax, "Net Investment Income Tax", "tax");
  pushEntry(entries, "netInvestmentIncome", fed.netInvestmentIncomeAmount, "Net Investment Income", "income");

  pushEntry(entries, "federalIncomeTaxBeforeCredits", params.federalIncomeTaxBeforeCredits, "Fed Tax Before Credits", "tax");
  pushEntry(entries, "federalTaxCredits", params.federalTaxCreditsEntered, "Fed Credits Entered", "credits");
  pushEntry(entries, "federalTaxCreditsApplied", params.federalTaxCreditsApplied, "Fed Credits Applied", "credits");
  pushEntry(entries, "federalIncomeTax", params.federalIncomeTaxAfterCredits, "Federal Income Tax", "tax");

  pushEntry(entries, "payrollTax", params.payrollTax, "Payroll Taxes", "tax");
  pushEntry(entries, "selfEmploymentTax", params.selfEmploymentTax, "Self-Employment Tax", "tax");
  pushEntry(entries, "socialSecurityTax", params.socialSecurityTax, "Social Security Tax", "tax");
  pushEntry(entries, "medicareTax", params.medicareTax, "Medicare Tax", "tax");

  pushEntry(entries, "takeHomePay", params.takeHomePay, "Take-Home Pay", "takehome");
  pushEntry(entries, "effectiveTaxRate", params.effectiveTaxRate * 100, "Effective Tax Rate", "rate");

  const entryMap = new Map(entries.map(e => [e.kind, e.value]));

  return {
    entries,
    taxYear: input.taxYear,
    filingStatus: input.filingStatus,
    incomeSources: p.sources,
    ordinaryFederalSegments: fed.federalOrdinary.segments ?? [],
    longTermCapitalGainsSegments: fed.federalLongTermCapGains.segments ?? [],
    warnings: params.warnings,
    notes: params.notes,
    get(kind: string): number | undefined {
      return entryMap.get(kind);
    },
    totalIncome: p.totalIncome,
    wageIncome: p.wageIncome,
    selfEmploymentIncome: p.selfEmploymentIncome / 0.9235,
    ordinaryGrossIncome: p.ordinaryGrossIncome,
    shortTermCapGainsGrossIncome: p.shortTermCapGainsGrossIncome,
    longTermCapitalGainsGrossIncome: p.longTermCapitalGainsGrossIncome,
    preTax401k: p.effective401,
    preTaxHsa: p.effectiveHsa,
    preTaxOther: p.effectiveOther,
    preTaxTotal: p.preTaxTotal,
    traditionalIra: p.effectiveIra,
    wagesAfterPretax: p.wagesAfterPretax,
    deductionKind: params.deductionKind,
    standardDeduction: params.standardDeduction,
    deductionAmount: params.deductionAmount,
    deductionAllocatedToOrdinary: fed.deductionAllocatedToOrdinary,
    deductionAllocatedToLongTermGross: fed.deductionAllocatedToLongTermGross,
    ordinaryTaxableIncome: fed.ordinaryTaxableIncome,
    longTermTaxableIncome: fed.longTermTaxableIncome,
    taxableIncome: Math.max(0, fed.ordinaryTaxableIncome + fed.longTermTaxableIncome),
    federalOrdinaryIncomeTax: fed.federalOrdinary.totalTax,
    federalLongTermCapGainsTax: fed.federalLongTermCapGains.totalTax,
    federalNetInvestmentIncomeTax: fed.federalNetInvestmentIncomeTax,
    netInvestmentIncome: fed.netInvestmentIncomeAmount,
    federalIncomeTaxBeforeCredits: params.federalIncomeTaxBeforeCredits,
    federalTaxCredits: params.federalTaxCreditsEntered,
    federalTaxCreditsApplied: params.federalTaxCreditsApplied,
    federalIncomeTax: params.federalIncomeTaxAfterCredits,
    payrollTax: params.payrollTax,
    selfEmploymentTax: params.selfEmploymentTax,
    socialSecurityTax: params.socialSecurityTax,
    medicareTax: params.medicareTax,
    takeHomePay: params.takeHomePay,
    effectiveTaxRate: params.effectiveTaxRate,
  };
}
