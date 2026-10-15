import type { TaxBucket, TaxEvaluationContext } from "~/lib/tax/calc/taxEvaluation";

export type DeductionPayrollSplit = {
  /** Deductible half of SE tax. Still cash, so it must leave ordinary income on its own ribbon. */
  halfSe: number;
  /** Deduction dollars taken from ordinary income (not from LTCG). */
  deductionFromOrdinary: number;
  /** Payroll and SE tax drawn from that deduction slice. The rest of payroll comes out of bracket keep. */
  payrollFromDeduction: number;
  /** Deduction slice that reaches take-home. */
  deductionToTakeHome: number;
  payrollFromKeep: number;
};

export function deductionPayrollSplit(args: {
  ordinaryIncomeAfterPretax: number;
  longTermCapGains: number;
  selfEmploymentDeduction: number;
  chosenDeduction: number;
  payrollTaxTotal: number;
}): DeductionPayrollSplit {
  const halfSe = Math.max(0, args.selfEmploymentDeduction);
  const ordinary = Math.max(0, args.ordinaryIncomeAfterPretax);
  const ltcg = Math.max(0, args.longTermCapGains);
  const ordinaryAfterHalfSe = Math.max(0, ordinary - halfSe);
  const afterHalfSe = Math.max(0, ordinary + ltcg - halfSe);
  const deductionApplied = Math.min(Math.max(0, args.chosenDeduction), afterHalfSe);
  const deductionFromOrdinary = Math.min(deductionApplied, ordinaryAfterHalfSe);
  const payrollFromDeduction = Math.min(Math.max(0, args.payrollTaxTotal), deductionFromOrdinary);
  return {
    halfSe,
    deductionFromOrdinary,
    payrollFromDeduction,
    deductionToTakeHome: deductionFromOrdinary - payrollFromDeduction,
    payrollFromKeep: Math.max(0, args.payrollTaxTotal) - payrollFromDeduction,
  };
}

export function deductionPayrollSplitFromContext(context: TaxEvaluationContext): DeductionPayrollSplit {
  return deductionPayrollSplit({
    ordinaryIncomeAfterPretax: context.ordinaryIncomeAfterPretax,
    longTermCapGains: context.metrics.income.longTermCapGains,
    selfEmploymentDeduction: context.selfEmploymentDeduction,
    chosenDeduction: context.totalDeductions,
    payrollTaxTotal: context.payrollTaxTotal,
  });
}

function ordinaryBucketsHighToLow(buckets: TaxBucket[]): TaxBucket[] {
  return buckets.filter((bucket) => bucket.type === "ordinary").reverse();
}

/** Payroll that has to leave this ordinary bracket's keep so the bracket still adds up. */
export function payrollShareForOrdinaryRate(context: TaxEvaluationContext, rate: number): number {
  let left = deductionPayrollSplitFromContext(context).payrollFromKeep;
  for (const bucket of ordinaryBucketsHighToLow(context.taxBuckets)) {
    const take = Math.min(left, Math.max(0, bucket.keep));
    if (bucket.taxBracket?.rate === rate) return take;
    left -= take;
  }
  return 0;
}

/** Payroll left after ordinary brackets, taken from LTCG keep. */
export function payrollShareForLtcg(context: TaxEvaluationContext): number {
  let left = deductionPayrollSplitFromContext(context).payrollFromKeep;
  for (const bucket of ordinaryBucketsHighToLow(context.taxBuckets)) {
    left -= Math.min(left, Math.max(0, bucket.keep));
  }
  const ltcgKeep = context.taxBuckets.reduce(
    (sum, bucket) => (bucket.type === "ltcg" ? sum + Math.max(0, bucket.keep) : sum),
    0,
  );
  return Math.min(left, ltcgKeep);
}
