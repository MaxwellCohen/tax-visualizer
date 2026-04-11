/** Static footnotes attached to every successful `TaxResult`. */
export const TAX_RESULT_NOTES: string[] = [
  "401(k), HSA, and traditional IRA amounts use IRS contribution caps for the selected tax year (age-50+ catch-up omitted). Payroll pre-tax totals are capped at W-2 wages (entries are pro-rated if they exceed wages). Traditional 401(k)/403(b), HSA, and other modeled payroll pre-tax amounts reduce both federal taxable wages and Social Security/Medicare wages here (qualified-plan elective deferrals; Roth 401(k) and rare exceptions are not modeled). Deductible traditional IRA reduces federal ordinary income only (not FICA) and is paid from take-home; MAGI phase-outs for IRA deductibility if covered by a workplace plan are not modeled.",
  "Payroll taxes are estimated from W-2 wages sources only.",
  "Short-term capital gains follow IRS Topic 409: they are taxed as ordinary income (same graduated rates as wages), not the preferential long-term rates. Long-term gains use 0% / 15% / 20% stacked on ordinary taxable income (simplified worksheet; not tax advice).",
  "Deductions are applied to ordinary income first, then to long-term gains (approximation).",
  "When modified AGI exceeds filing-status thresholds, §1411 net investment income tax (3.8%) is estimated on short- and long-term taxable gains (Form 8960 simplified; interest, dividends, and MAGI adjustments omitted).",
];
