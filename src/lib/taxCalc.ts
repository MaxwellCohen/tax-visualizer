import { FEDERAL_NIIT, type FilingStatus, getTaxYearConfig } from "~/lib/taxData";

export type IncomeKind = "wages" | "ordinary" | "shortTermCapGains" | "longTermCapGains";

export type IncomeSource = {
  id: string;
  kind: IncomeKind;
  /** Shown in charts; if empty, a default by kind is used. */
  label: string;
  amount: number;
};

export type TaxInput = {
  taxYear: number;
  filingStatus: FilingStatus;
  incomeSources: IncomeSource[];
  /** Traditional 401(k)/403(b) deferrals; per spouse when filing jointly (each has its own IRS deferral cap). */
  preTax401kSpouse1: number;
  preTax401kSpouse2: number;
  /** Payroll HSA; split by spouse when filing jointly (family HDHP uses a combined contribution cap). */
  preTaxHsaSpouse1: number;
  preTaxHsaSpouse2: number;
  /** Other cafeteria amounts (FSA, transit, etc.); treated like HSA for FICA. */
  preTaxOther: number;
  /**
   * Deductible traditional IRA (non-payroll); reduces federal ordinary income only, not FICA.
   * Per spouse when filing jointly; each capped by `traditionalIraContribution` for the year.
   */
  traditionalIraSpouse1: number;
  traditionalIraSpouse2: number;
  useItemizedDeductions: boolean;
  itemizedDeductions: number;
};

export type DeductionKind = "standard" | "itemized";
export type TaxSegmentKind = "ordinaryFederal" | "longTermCapGains";

export type TaxSegment = {
  id: string;
  kind: TaxSegmentKind;
  incomeAmount: number;
  taxAmount: number;
  marginalRate: number;
  rangeStart: number;
  rangeEnd: number | null;
};

export type TaxResult = {
  taxYear: number;
  filingStatus: FilingStatus;
  incomeSources: IncomeSource[];
  totalIncome: number;
  wageIncome: number;
  ordinaryGrossIncome: number;
  /** Gross short-term capital gains (before deductions); taxed as ordinary income (IRS Topic 409). */
  shortTermCapGainsGrossIncome: number;
  longTermCapitalGainsGrossIncome: number;
  /** Effective amounts after capping to total W-2 wages (pro-rated if over). */
  preTax401k: number;
  preTaxHsa: number;
  preTaxOther: number;
  /** Payroll pre-tax only (401(k), HSA, other); traditional IRA is separate. */
  preTaxTotal: number;
  /** Effective deductible traditional IRA after IRS per-person and compensation caps in this model. */
  traditionalIra: number;
  wagesAfterPretax: number;
  deductionKind: DeductionKind;
  standardDeduction: number;
  deductionAmount: number;
  /** Ordinary + short-term + wages slice after deductions (federal ordinary brackets). */
  ordinaryTaxableIncome: number;
  /** Long-term capital gain amount after deductions (preferential LTCG rates). */
  longTermTaxableIncome: number;
  taxableIncome: number;
  /** Federal tax on ordinary taxable income (progressive brackets). */
  federalOrdinaryIncomeTax: number;
  /** Federal tax on long-term gains (0% / 15% / 20% stacked on ordinary taxable income). */
  federalLongTermCapGainsTax: number;
  /** §1411 net investment income tax (simplified: investment income ×3.8% capped by MAGI over threshold). */
  federalNetInvestmentIncomeTax: number;
  /** Sum of taxable STCG + taxable LTCG used as net investment income for the NIIT estimate. */
  netInvestmentIncome: number;
  federalIncomeTax: number;
  payrollTax: number;
  socialSecurityTax: number;
  medicareTax: number;
  takeHomePay: number;
  effectiveTaxRate: number;
  ordinaryFederalSegments: TaxSegment[];
  longTermCapitalGainsSegments: TaxSegment[];
  warnings: string[];
  notes: string[];
};

const DEFAULT_LABEL_BY_KIND: Record<IncomeKind, string> = {
  wages: "W-2 wages",
  ordinary: "Other income",
  shortTermCapGains: "Short-term capital gains",
  longTermCapGains: "Long-term capital gains",
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

let incomeSourceSeq = 0;

function newIncomeSourceId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  incomeSourceSeq += 1;
  return `inc-${incomeSourceSeq}`;
}

export function newIncomeSource(overrides?: Partial<Omit<IncomeSource, "id">>): IncomeSource {
  return {
    id: newIncomeSourceId(),
    kind: "wages",
    label: "",
    amount: 0,
    ...overrides,
  };
}

export function incomeSourceDisplayLabel(source: IncomeSource): string {
  const trimmed = source.label.trim();
  return trimmed || DEFAULT_LABEL_BY_KIND[source.kind];
}

function toMoneyValue(value: number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

/** Clamps 401(k), HSA, and traditional IRA fields to year limits in `TAX_DATA_BY_YEAR` (shared URLs, imports). */
export function clampTaxInputPretaxToLimits(input: TaxInput): TaxInput {
  const config = getTaxYearConfig(input.taxYear);
  if (!config) return input;

  const lim = config.pretaxLimits;
  const joint = input.filingStatus === "marriedJoint";
  const c401 = lim.electiveDeferral401k;
  const p1 = Math.min(toMoneyValue(input.preTax401kSpouse1), c401);
  const p2 = joint ? Math.min(toMoneyValue(input.preTax401kSpouse2), c401) : 0;

  let h1 = toMoneyValue(input.preTaxHsaSpouse1);
  let h2 = joint ? toMoneyValue(input.preTaxHsaSpouse2) : 0;
  if (joint) {
    h1 = Math.min(h1, lim.hsaFamily);
    h2 = Math.min(h2, Math.max(0, lim.hsaFamily - h1));
  } else {
    h1 = Math.min(h1, lim.hsaFamily);
    h2 = 0;
  }

  const iraCap = lim.traditionalIraContribution;
  const i1 = Math.min(toMoneyValue(input.traditionalIraSpouse1), iraCap);
  const i2 = joint ? Math.min(toMoneyValue(input.traditionalIraSpouse2), iraCap) : 0;

  return {
    ...input,
    preTax401kSpouse1: p1,
    preTax401kSpouse2: joint ? p2 : 0,
    preTaxHsaSpouse1: h1,
    preTaxHsaSpouse2: joint ? h2 : 0,
    traditionalIraSpouse1: i1,
    traditionalIraSpouse2: joint ? i2 : 0,
  };
}

function calculateFederalTaxBreakdown(
  taxableIncome: number,
  taxYear: number,
  filingStatus: FilingStatus,
): { totalTax: number; segments: TaxSegment[] } {
  if (taxableIncome <= 0) {
    return { totalTax: 0, segments: [] };
  }

  const config = getTaxYearConfig(taxYear);
  if (!config) {
    return { totalTax: 0, segments: [] };
  }

  const brackets = config.federalBrackets[filingStatus];
  let remaining = taxableIncome;
  let lowerBound = 0;
  let totalTax = 0;
  const segments: TaxSegment[] = [];

  for (const [index, bracket] of brackets.entries()) {
    if (remaining <= 0) {
      break;
    }

    const upperBound = bracket.upTo ?? Number.POSITIVE_INFINITY;
    const amountInBracket = Math.min(remaining, upperBound - lowerBound);
    if (amountInBracket > 0) {
      const taxAmount = amountInBracket * bracket.rate;
      totalTax += taxAmount;
      segments.push({
        id: `ordinary-${index}`,
        kind: "ordinaryFederal",
        incomeAmount: amountInBracket,
        taxAmount,
        marginalRate: bracket.rate,
        rangeStart: lowerBound,
        rangeEnd: bracket.upTo,
      });
      remaining -= amountInBracket;
    }

    lowerBound = upperBound;
  }

  return { totalTax, segments };
}

/** Preferential LTCG rates stacked on top of ordinary taxable income (simplified; not tax advice). */
function calculateLongTermCapGainsTax(
  ordinaryTaxableIncome: number,
  longTermTaxableIncome: number,
  thresholds: { zeroRateMax: number; fifteenRateMax: number },
): { totalTax: number; segments: TaxSegment[] } {
  if (longTermTaxableIncome <= 0) {
    return { totalTax: 0, segments: [] };
  }

  const { zeroRateMax, fifteenRateMax } = thresholds;
  let remaining = longTermTaxableIncome;
  let totalTax = 0;
  const segments: TaxSegment[] = [];

  const takeSlice = (rate: number, maxDollars: number, rangeStart: number, rangeEnd: number | null) => {
    if (maxDollars <= 0 || remaining <= 0) return;
    const amount = Math.min(remaining, maxDollars);
    if (amount <= 0) return;

    const taxAmount = amount * rate;
    totalTax += taxAmount;
    segments.push({
      id: `ltcg-${Math.round(rate * 100)}`,
      kind: "longTermCapGains",
      incomeAmount: amount,
      taxAmount,
      marginalRate: rate,
      rangeStart,
      rangeEnd,
    });
    remaining -= amount;
  };

  const space0 = Math.max(0, zeroRateMax - ordinaryTaxableIncome);
  takeSlice(0, space0, 0, zeroRateMax);

  const space15 = Math.max(0, fifteenRateMax - Math.max(ordinaryTaxableIncome, zeroRateMax));
  takeSlice(0.15, space15, zeroRateMax, fifteenRateMax);

  takeSlice(0.2, remaining, fifteenRateMax, null);

  return { totalTax, segments };
}

function calculatePayrollTax(wages: number, taxYear: number, filingStatus: FilingStatus) {
  const config = getTaxYearConfig(taxYear);
  if (!config) {
    return { socialSecurityTax: 0, medicareTax: 0, payrollTax: 0 };
  }

  const payroll = config.payroll;
  const socialSecurityTax = Math.min(wages, payroll.socialSecurityWageBase) * payroll.socialSecurityRate;
  const additionalThreshold = payroll.additionalMedicareThreshold[filingStatus];
  const additionalMedicareTax = Math.max(0, wages - additionalThreshold) * payroll.additionalMedicareRate;
  const medicareTax = wages * payroll.medicareRate + additionalMedicareTax;
  const payrollTax = socialSecurityTax + medicareTax;

  return { socialSecurityTax, medicareTax, payrollTax };
}

export function calculateTaxes(input: TaxInput): TaxResult | null {
  const config = getTaxYearConfig(input.taxYear);
  if (!config) {
    return null;
  }

  const sources = input.incomeSources.map(source => ({
    ...source,
    amount: toMoneyValue(source.amount),
  }));

  const totalIncome = sources.reduce((sum, source) => sum + source.amount, 0);
  const wageIncome = sources
    .filter(source => source.kind === "wages")
    .reduce((sum, source) => sum + source.amount, 0);
  const ordinaryGrossIncome = sources
    .filter(source => source.kind === "wages" || source.kind === "ordinary" || source.kind === "shortTermCapGains")
    .reduce((sum, source) => sum + source.amount, 0);
  const shortTermCapGainsGrossIncome = sources
    .filter(source => source.kind === "shortTermCapGains")
    .reduce((sum, source) => sum + source.amount, 0);
  const longTermCapitalGainsGrossIncome = sources
    .filter(source => source.kind === "longTermCapGains")
    .reduce((sum, source) => sum + source.amount, 0);

  const joint = input.filingStatus === "marriedJoint";
  const lim = config.pretaxLimits;
  const cap401 = lim.electiveDeferral401k;
  const uncapped401_1 = toMoneyValue(input.preTax401kSpouse1);
  const uncapped401_2 = joint ? toMoneyValue(input.preTax401kSpouse2) : 0;
  const uncappedHsa_1 = toMoneyValue(input.preTaxHsaSpouse1);
  const uncappedHsa_2 = joint ? toMoneyValue(input.preTaxHsaSpouse2) : 0;

  const raw401_1 = Math.min(uncapped401_1, cap401);
  const raw401_2 = joint ? Math.min(uncapped401_2, cap401) : 0;
  const raw401 = raw401_1 + raw401_2;

  const uncappedHsaTotal = uncappedHsa_1 + (joint ? uncappedHsa_2 : 0);
  const rawHsa = joint
    ? Math.min(uncappedHsaTotal, lim.hsaFamily)
    : Math.min(uncappedHsa_1, lim.hsaFamily);

  const pretaxCapped401 =
    uncapped401_1 > cap401 || (joint && uncapped401_2 > cap401);
  const pretaxCappedHsa = joint
    ? uncappedHsaTotal > lim.hsaFamily
    : uncappedHsa_1 > lim.hsaFamily;

  const rawOther = toMoneyValue(input.preTaxOther);
  const rawPretaxTotal = raw401 + rawHsa + rawOther;
  const pretaxScale = wageIncome <= 0 ? 0 : rawPretaxTotal > wageIncome ? wageIncome / rawPretaxTotal : 1;
  const effective401 = raw401 * pretaxScale;
  const effectiveHsa = rawHsa * pretaxScale;
  const effectiveOther = rawOther * pretaxScale;
  const preTaxTotal = effective401 + effectiveHsa + effectiveOther;
  const wagesAfterPretax = Math.max(0, wageIncome - preTaxTotal);
  const ordinaryGrossForTax = wagesAfterPretax + (ordinaryGrossIncome - wageIncome);

  const capIra = lim.traditionalIraContribution;
  const uncappedIra1 = toMoneyValue(input.traditionalIraSpouse1);
  const uncappedIra2 = joint ? toMoneyValue(input.traditionalIraSpouse2) : 0;
  const rawIra1 = Math.min(uncappedIra1, capIra);
  const rawIra2 = joint ? Math.min(uncappedIra2, capIra) : 0;
  const rawIraSum = rawIra1 + rawIra2;
  const pretaxCappedIra =
    uncappedIra1 > capIra || (joint && uncappedIra2 > capIra);
  const effectiveIra = Math.min(rawIraSum, ordinaryGrossForTax);
  const iraCappedByCompensation = rawIraSum > ordinaryGrossForTax && ordinaryGrossForTax >= 0;

  const nonInvestmentOrdinaryGross =
    wagesAfterPretax + sources.filter(s => s.kind === "ordinary").reduce((s, x) => s + x.amount, 0);
  let iraRem = effectiveIra;
  const iraFromNonInv = Math.min(iraRem, nonInvestmentOrdinaryGross);
  iraRem -= iraFromNonInv;
  const iraFromStcg = Math.min(iraRem, shortTermCapGainsGrossIncome);
  const nonInvestmentAfterIra = nonInvestmentOrdinaryGross - iraFromNonInv;
  const ordinaryAfterIra = nonInvestmentAfterIra + (shortTermCapGainsGrossIncome - iraFromStcg);

  const deductionKind: DeductionKind = input.useItemizedDeductions ? "itemized" : "standard";
  const standardDeduction = config.standardDeduction[input.filingStatus];
  const itemizedDeductions = toMoneyValue(input.itemizedDeductions);
  const deductionAmount = deductionKind === "itemized" ? itemizedDeductions : standardDeduction;

  const deductionAppliedToOrdinary = Math.min(deductionAmount, ordinaryAfterIra);
  const ordinaryTaxableIncome = ordinaryAfterIra - deductionAppliedToOrdinary;
  const remainingDeduction = Math.max(0, deductionAmount - deductionAppliedToOrdinary);
  const longTermTaxableIncome = Math.max(0, longTermCapitalGainsGrossIncome - remainingDeduction);
  const taxableIncome = Math.max(0, ordinaryTaxableIncome + longTermTaxableIncome);

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

  const deductionToOrdinary = Math.min(deductionAmount, ordinaryAfterIra);
  const deductionFromShortTermCapGains = Math.max(0, deductionToOrdinary - nonInvestmentAfterIra);
  const shortTermCapGainsTaxableForNiit = Math.max(0, shortTermCapGainsGrossIncome - deductionFromShortTermCapGains);
  const netInvestmentIncomeAmount = shortTermCapGainsTaxableForNiit + longTermTaxableIncome;
  const magiForNiit = ordinaryAfterIra + longTermCapitalGainsGrossIncome;
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

  const wagesForPayroll = Math.max(0, wageIncome - effectiveHsa - effectiveOther);
  const { socialSecurityTax, medicareTax, payrollTax } = calculatePayrollTax(
    wagesForPayroll,
    input.taxYear,
    input.filingStatus,
  );

  const takeHomePay = Math.max(0, totalIncome - preTaxTotal - federalIncomeTax - payrollTax - effectiveIra);
  const effectiveTaxRate = totalIncome > 0 ? (federalIncomeTax + payrollTax) / totalIncome : 0;
  const warnings: string[] = [];

  if (rawPretaxTotal > 0 && wageIncome <= 0) {
    warnings.push("Pre-tax payroll benefits only apply to W-2 wages in this model, so these entries have no effect without wage income.");
  } else if (rawPretaxTotal > wageIncome && wageIncome > 0) {
    warnings.push("Pre-tax payroll benefits exceed W-2 wages, so the app scaled those entries down proportionally.");
  }

  if (pretaxCapped401 || pretaxCappedHsa) {
    warnings.push(
      pretaxCapped401 && pretaxCappedHsa
        ? `401(k) deferrals and HSA payroll amounts were capped at IRS limits for ${input.taxYear} (${money.format(cap401)} elective deferral per spouse; HSA ${joint ? `combined ${money.format(lim.hsaFamily)}` : `up to ${money.format(lim.hsaFamily)}`}). Age-50+ catch-up is not modeled.`
        : pretaxCapped401
          ? `401(k) deferrals were capped at the ${input.taxYear} IRS elective deferral limit (${money.format(cap401)} per spouse). Age-50+ catch-up is not modeled.`
          : `HSA payroll amounts were capped at the ${input.taxYear} IRS limit (${joint ? `${money.format(lim.hsaFamily)} combined for family HDHP` : `up to ${money.format(lim.hsaFamily)}; self-only HDHP is typically ${money.format(lim.hsaSelfOnly)}`}).`,
    );
  }

  if (pretaxCappedIra) {
    warnings.push(
      `Traditional IRA amounts were capped at the ${input.taxYear} IRS contribution limit (${money.format(capIra)} per spouse under age 50). Age-50+ catch-up is not modeled.`,
    );
  }
  if (iraCappedByCompensation) {
    warnings.push(
      "Traditional IRA deduction was limited to modeled ordinary income (wages after payroll pre-tax, other ordinary income, and short-term gains); excess is not modeled as nondeductible IRA.",
    );
  }

  if (input.useItemizedDeductions && itemizedDeductions < standardDeduction) {
    warnings.push(
      `Your itemized deduction is below the ${money.format(standardDeduction)} standard deduction for this filing status and year, so a real return would usually prefer the standard deduction.`,
    );
  }

  if (longTermCapitalGainsGrossIncome > 0) {
    warnings.push("Long-term capital gains use a simplified 0% / 15% / 20% stacking worksheet here and do not model qualified-dividend or special-gain edge cases.");
  }

  if (federalNetInvestmentIncomeTax > 0) {
    warnings.push(
      "Net investment income tax (NIIT) is estimated from short- and long-term gains only (Form 8960 is simplified; MAGI excludes some real-world adjustments).",
    );
  }

  return {
    taxYear: input.taxYear,
    filingStatus: input.filingStatus,
    incomeSources: sources,
    totalIncome,
    wageIncome,
    ordinaryGrossIncome,
    shortTermCapGainsGrossIncome,
    longTermCapitalGainsGrossIncome,
    preTax401k: effective401,
    preTaxHsa: effectiveHsa,
    preTaxOther: effectiveOther,
    preTaxTotal,
    traditionalIra: effectiveIra,
    wagesAfterPretax,
    deductionKind,
    standardDeduction,
    deductionAmount,
    ordinaryTaxableIncome,
    longTermTaxableIncome,
    taxableIncome,
    federalOrdinaryIncomeTax: federalOrdinary.totalTax,
    federalLongTermCapGainsTax: federalLongTermCapGains.totalTax,
    federalNetInvestmentIncomeTax,
    netInvestmentIncome: netInvestmentIncomeAmount,
    federalIncomeTax,
    payrollTax,
    socialSecurityTax,
    medicareTax,
    takeHomePay,
    effectiveTaxRate,
    ordinaryFederalSegments: federalOrdinary.segments,
    longTermCapitalGainsSegments: federalLongTermCapGains.segments,
    warnings,
    notes: [
      "401(k), HSA, and traditional IRA amounts use IRS contribution caps for the selected tax year (age-50+ catch-up omitted). Payroll pre-tax totals are capped at W-2 wages (entries are pro-rated if they exceed wages). Traditional 401(k)/403(b) reduces federal taxable wages but not Social Security/Medicare wages. HSA and other payroll pre-tax amounts reduce FICA wages here. Deductible traditional IRA reduces federal ordinary income only (not FICA) and is paid from take-home; MAGI phase-outs for IRA deductibility if covered by a workplace plan are not modeled.",
      "Payroll taxes are estimated from W-2 wages sources only.",
      "Short-term capital gains follow IRS Topic 409: they are taxed as ordinary income (same graduated rates as wages), not the preferential long-term rates. Long-term gains use 0% / 15% / 20% stacked on ordinary taxable income (simplified worksheet; not tax advice).",
      "Deductions are applied to ordinary income first, then to long-term gains (approximation).",
      "When modified AGI exceeds filing-status thresholds, §1411 net investment income tax (3.8%) is estimated on short- and long-term taxable gains (Form 8960 simplified; interest, dividends, and MAGI adjustments omitted).",
    ],
  };
}
