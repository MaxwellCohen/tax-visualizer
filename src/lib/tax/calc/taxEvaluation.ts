import type {
  FederalTaxBracket,
  FilingStatus,
  LongTermCapGainsThresholds,
  TaxYearConfig,
} from "~/lib/tax/data/types";
import type { TaxFormRow } from "~/lib/tax/form/types";
import { buildScenarioMetrics, type ScenarioMetrics } from "~/lib/tax/calc/scenarioMetrics";

export type PayrollTaxBreakdown = {
  socialSecurityTax: number;
  medicareTax: number;
  total: number;
};

export type TaxBucket = {
  taxBracket?: FederalTaxBracket;
  type: string;
  tax: number;
  keep: number;
  credits: number;
  payrollTax: number;
  remainingIncome: number;
};

export type TaxEvaluationContext = {
  rows: TaxFormRow[];
  taxData: TaxYearConfig;
  filingStatus: FilingStatus;
  metrics: ScenarioMetrics;
  payrollTaxBreakdown: PayrollTaxBreakdown;
  payrollTax: number;
  selfEmploymentTax: number;
  payrollTaxTotal: number;
  selfEmploymentDeduction: number;
  standardDeduction: number;
  itemizedDeductions: number;
  totalDeductions: number;
  standardDeductionWithoutPayrollTax: number;
  itemizedDeductionsWithoutPayrollTax: number;
  ordinaryIncomeAfterPretax: number;
  /** Ordinary income taxed at ordinary rates after ½ SE and std/itemized. */
  taxableIncomeAfterDeductions: number;
  /** Preferential LTCG included in taxable income after deductions. */
  ltcgTaxableIncome: number;
  /** Federal taxable income (ordinary taxable + LTCG taxable). */
  totalTaxableIncome: number;
  totalCredits: number;
  taxBuckets: TaxBucket[];
  federalTaxCreditsApplied: number;
  federalIncomeTax: number;
  takeHomePay: number;
  effectiveTaxRate: number;
};

function calculatePayrollTaxForWages(wages: number, taxData: TaxYearConfig): PayrollTaxBreakdown {
  const taxableWages = Math.max(0, wages);
  const ssTaxable = Math.min(taxableWages, taxData.payroll.socialSecurityWageBase);
  const socialSecurityTax = ssTaxable * taxData.payroll.socialSecurityRate;
  const medicareTax = taxableWages * taxData.payroll.medicareRate;
  return { socialSecurityTax, medicareTax, total: socialSecurityTax + medicareTax };
}

function calculatePayrollTaxBreakdownFromMetrics(
  metrics: ScenarioMetrics,
  taxData: TaxYearConfig,
  filingStatus: FilingStatus,
): PayrollTaxBreakdown {
  const spouseWages =
    filingStatus === "marriedJoint"
      ? [metrics.income.wagesSpouse1, metrics.income.wagesSpouse2]
      : [metrics.income.wages];
  const fromWages = spouseWages
    .map((wages) => calculatePayrollTaxForWages(wages, taxData))
    .reduce(
      (sum, spouseTax) => ({
        socialSecurityTax: sum.socialSecurityTax + spouseTax.socialSecurityTax,
        medicareTax: sum.medicareTax + spouseTax.medicareTax,
        total: sum.total + spouseTax.total,
      }),
      { socialSecurityTax: 0, medicareTax: 0, total: 0 },
    );
  const netSeForMedicare =
    Math.max(0, metrics.income.selfEmployment) * taxData.payroll.selfEmploymentNetEarningsFactor;
  const totalMedicareCompensation =
    spouseWages.reduce((sum, wages) => sum + Math.max(0, wages), 0) + netSeForMedicare;
  const threshold = taxData.payroll.additionalMedicareThreshold[filingStatus];
  const additionalMedicareTax =
    Math.max(0, totalMedicareCompensation - threshold) * taxData.payroll.additionalMedicareRate;
  return {
    socialSecurityTax: fromWages.socialSecurityTax,
    medicareTax: fromWages.medicareTax + additionalMedicareTax,
    total: fromWages.total + additionalMedicareTax,
  };
}

function calculateSelfEmploymentTaxFromMetrics(
  metrics: ScenarioMetrics,
  taxData: TaxYearConfig,
  filingStatus: FilingStatus,
): number {
  const netEarnings =
    Math.max(0, metrics.income.selfEmployment) * taxData.payroll.selfEmploymentNetEarningsFactor;
  const base = taxData.payroll.socialSecurityWageBase;
  const wagesForSeSsCap =
    filingStatus === "marriedJoint" ? metrics.income.wagesSpouse1 : metrics.income.wages;
  const ssRoom = Math.max(0, base - Math.min(Math.max(0, wagesForSeSsCap), base));
  const ssTaxable = Math.min(netEarnings, ssRoom);
  const ssTax = ssTaxable * taxData.payroll.selfEmploymentSocialSecurityRate;
  const medicareTax = netEarnings * taxData.payroll.selfEmploymentMedicareRate;
  return ssTax + medicareTax;
}

function calculateLtcgTaxTotal(
  taxableLtcg: number,
  thresholds: LongTermCapGainsThresholds,
  filingStatus: FilingStatus,
  baseIncome: number,
): number {
  let totalTax = 0;
  let remaining = taxableLtcg;
  let lowerBound = baseIncome;

  const bracketSet = thresholds.find((threshold) => threshold.filingStatus === filingStatus);
  if (!bracketSet) {
    throw new Error(`Missing long-term capital gains brackets for filing status: ${filingStatus}`);
  }

  for (const bracket of bracketSet.brackets) {
    if (remaining <= 0) break;
    const upperBound = bracket.upTo ?? Number.POSITIVE_INFINITY;
    const amountInBracket = Math.max(0, Math.min(remaining, Math.max(0, upperBound - lowerBound)));
    if (amountInBracket > 0) {
      totalTax += amountInBracket * bracket.rate;
      remaining -= amountInBracket;
    }
    lowerBound = upperBound;
  }
  return totalTax;
}

function calculateTaxBucketsFromEvaluation(args: {
  taxData: TaxYearConfig;
  filingStatus: FilingStatus;
  payrollTaxTotal: number;
  taxFreeAmount: number;
  ordinaryTaxable: number;
  ltcgTaxable: number;
  totalCredits: number;
}): TaxBucket[] {
  const {
    taxData,
    filingStatus,
    payrollTaxTotal,
    taxFreeAmount,
    ordinaryTaxable,
    ltcgTaxable,
    totalCredits,
  } = args;
  const result: TaxBucket[] = [];
  const brackets = taxData.federalBrackets[filingStatus];
  let remainingIncome = ordinaryTaxable;
  let remainingPayrollTax = Math.max(payrollTaxTotal - taxFreeAmount, 0);
  let remainingCredits = totalCredits;
  result.push({
    type: "tax-free",
    taxBracket: undefined,
    tax: 0,
    keep: taxFreeAmount,
    credits: 0,
    payrollTax: 0,
    remainingIncome,
  });

  let previousBracketCeiling = 0;
  for (const bracket of brackets) {
    const cumulativeTop = bracket.upTo ?? Number.POSITIVE_INFINITY;
    const sliceCap = Math.max(0, cumulativeTop - previousBracketCeiling);
    const taxableBracketIncome = Math.min(remainingIncome, sliceCap);
    remainingIncome = Math.max(0, remainingIncome - taxableBracketIncome);
    previousBracketCeiling = bracket.upTo ?? previousBracketCeiling;
    const tax = taxableBracketIncome * bracket.rate;
    const keep = Math.max(taxableBracketIncome - tax - remainingPayrollTax, 0);
    remainingPayrollTax = Math.max(0, remainingPayrollTax - (taxableBracketIncome - tax));
    result.push({
      type: "ordinary",
      taxBracket: bracket,
      tax,
      keep,
      credits: 0,
      payrollTax: remainingPayrollTax,
      remainingIncome,
    });
  }

  const ltcgTax = calculateLtcgTaxTotal(
    ltcgTaxable,
    taxData.longTermCapGains,
    filingStatus,
    ordinaryTaxable,
  );
  result.push({
    type: "ltcg",
    tax: ltcgTax,
    keep: Math.max(0, ltcgTaxable - ltcgTax),
    credits: 0,
    payrollTax: 0,
    remainingIncome: 0,
  });

  for (let i = result.length - 1; i >= 0; i--) {
    const bucket = result[i];
    const credits = Math.min(remainingCredits, bucket.tax);
    bucket.credits = Math.max(0, credits);
    bucket.tax = Math.max(0, bucket.tax - credits);
    remainingCredits -= credits;
  }

  return result;
}

export function evaluateTaxScenario(
  rows: TaxFormRow[],
  taxData: TaxYearConfig,
  filingStatus: FilingStatus,
  metrics = buildScenarioMetrics(rows),
): TaxEvaluationContext {
  const payrollTaxBreakdown = calculatePayrollTaxBreakdownFromMetrics(metrics, taxData, filingStatus);
  const payrollTax = payrollTaxBreakdown.total;
  const selfEmploymentTax = calculateSelfEmploymentTaxFromMetrics(metrics, taxData, filingStatus);
  const payrollTaxTotal = payrollTax + selfEmploymentTax;
  const selfEmploymentDeduction = selfEmploymentTax / 2;
  const statutoryStandardDeduction = taxData.standardDeduction[filingStatus];
  const itemizedDeductions = metrics.deductions.totalItemized;
  const chosenDeduction = metrics.useItemizedDeductions
    ? itemizedDeductions
    : statutoryStandardDeduction;
  const ordinaryIncomeAfterPretax = Math.max(0, metrics.income.ordinary - metrics.pretax.all);
  const longTermCapGains = Math.max(0, metrics.income.longTermCapGains);
  // IRS-style: reduce combined ordinary + LTCG by deductible ½ SE, then std/itemized.
  const afterHalfSe = Math.max(
    0,
    ordinaryIncomeAfterPretax + longTermCapGains - selfEmploymentDeduction,
  );
  const deductionApplied = Math.min(chosenDeduction, afterHalfSe);
  const totalTaxableIncome = afterHalfSe - deductionApplied;
  const taxableIncomeAfterDeductions = Math.max(0, totalTaxableIncome - longTermCapGains);
  const ltcgTaxableIncome = totalTaxableIncome - taxableIncomeAfterDeductions;
  const taxFreeAmount = ordinaryIncomeAfterPretax + longTermCapGains - totalTaxableIncome;
  const standardDeduction = metrics.useItemizedDeductions ? 0 : statutoryStandardDeduction;
  const totalDeductions = chosenDeduction;
  // Sankey "0% tax" slice: deduction shield net of wage FICA (educational).
  const standardDeductionWithoutPayrollTax = metrics.useItemizedDeductions
    ? 0
    : Math.max(0, statutoryStandardDeduction - payrollTax);
  const itemizedDeductionsWithoutPayrollTax = metrics.useItemizedDeductions
    ? Math.max(0, itemizedDeductions - payrollTax)
    : 0;
  const totalCredits =
    metrics.qualifyingChildren * (taxData.federalTaxCreditDefaults.childTaxCredit ?? 0) +
    metrics.otherDependents * (taxData.federalTaxCreditDefaults.creditForOtherDependents ?? 0) +
    metrics.credits.education +
    metrics.credits.retirementSavingsContributions +
    metrics.credits.other;
  const taxBuckets = calculateTaxBucketsFromEvaluation({
    taxData,
    filingStatus,
    payrollTaxTotal,
    taxFreeAmount,
    ordinaryTaxable: taxableIncomeAfterDeductions,
    ltcgTaxable: ltcgTaxableIncome,
    totalCredits,
  });
  const federalTaxCreditsApplied = taxBuckets.reduce((sum, bucket) => sum + bucket.credits, 0);
  const federalIncomeTax = taxBuckets.reduce((sum, bucket) => sum + bucket.tax, 0);
  const takeHomePay = metrics.income.total - metrics.pretax.all - federalIncomeTax - payrollTaxTotal;
  const effectiveTaxRate = metrics.income.total > 0 ? federalIncomeTax / metrics.income.total : 0;

  return {
    rows,
    taxData,
    filingStatus,
    metrics,
    payrollTaxBreakdown,
    payrollTax,
    selfEmploymentTax,
    payrollTaxTotal,
    selfEmploymentDeduction,
    standardDeduction,
    itemizedDeductions,
    totalDeductions,
    standardDeductionWithoutPayrollTax,
    itemizedDeductionsWithoutPayrollTax,
    ordinaryIncomeAfterPretax,
    taxableIncomeAfterDeductions,
    ltcgTaxableIncome,
    totalTaxableIncome,
    totalCredits,
    taxBuckets,
    federalTaxCreditsApplied,
    federalIncomeTax,
    takeHomePay,
    effectiveTaxRate,
  };
}

export function findOrdinaryTaxBucketByRate(
  context: TaxEvaluationContext,
  rate: number,
): TaxBucket | undefined {
  return context.taxBuckets.find((bucket) => bucket.type === "ordinary" && bucket.taxBracket?.rate === rate);
}

export function sumTaxBucketsByType(
  context: TaxEvaluationContext,
  type: string,
  select: (bucket: TaxBucket) => number,
): number {
  return context.taxBuckets.reduce((sum, bucket) => bucket.type === type ? sum + select(bucket) : sum, 0);
}
