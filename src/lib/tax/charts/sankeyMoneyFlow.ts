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

function deductionPayrollSplit(args: {
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

/** Payroll and state income tax drawn from one kept slice, plus what is left for take-home. */
export type KeepSliceShares = {
  payroll: number;
  state: number;
  net: number;
};

export type TakeHomeAllocation = {
  /** Keyed by ordinary bracket rate. */
  ordinary: Map<number, KeepSliceShares>;
  ltcg: KeepSliceShares;
  /** Standard / itemized deduction left after payroll that came out of it. */
  deduction: KeepSliceShares;
  halfSe: KeepSliceShares;
};

function takeFrom(available: number, left: { amount: number }): number {
  const take = Math.min(left.amount, Math.max(0, available));
  left.amount -= take;
  return take;
}

const allocationCache = new WeakMap<TaxEvaluationContext, TakeHomeAllocation>();

/**
 * Splits kept dollars so every Sankey ribbon partitions the same money. Payroll beyond the
 * deduction slice comes out of bracket keep (high rate first), then LTCG keep. State income tax
 * then comes out of what is left: bracket keep, LTCG keep, the kept deduction, and ½ SE.
 */
export function takeHomeAllocation(context: TaxEvaluationContext): TakeHomeAllocation {
  const cached = allocationCache.get(context);
  if (cached) return cached;
  const split = deductionPayrollSplitFromContext(context);
  const payrollLeft = { amount: split.payrollFromKeep };
  const stateLeft = { amount: Math.max(0, context.stateIncomeTax) };
  const slice = (keep: number): KeepSliceShares => {
    const payroll = takeFrom(keep, payrollLeft);
    const state = takeFrom(keep - payroll, stateLeft);
    return { payroll, state, net: Math.max(0, keep - payroll - state) };
  };
  const ordinary = new Map<number, KeepSliceShares>();
  for (const bucket of ordinaryBucketsHighToLow(context.taxBuckets)) {
    if (bucket.taxBracket) ordinary.set(bucket.taxBracket.rate, slice(bucket.keep));
  }
  const ltcgKeep = context.taxBuckets.reduce(
    (sum, bucket) => (bucket.type === "ltcg" ? sum + Math.max(0, bucket.keep) : sum),
    0,
  );
  const ltcg = slice(ltcgKeep);
  // Payroll is already settled against the deduction in `split`; only state tax remains.
  const deductionState = takeFrom(split.deductionToTakeHome, stateLeft);
  const halfSeState = takeFrom(split.halfSe, stateLeft);
  const allocation: TakeHomeAllocation = {
    ordinary,
    ltcg,
    deduction: { payroll: 0, state: deductionState, net: split.deductionToTakeHome - deductionState },
    halfSe: { payroll: 0, state: halfSeState, net: split.halfSe - halfSeState },
  };
  allocationCache.set(context, allocation);
  return allocation;
}

const EMPTY_SHARES: KeepSliceShares = { payroll: 0, state: 0, net: 0 };

export function sharesForOrdinaryRate(context: TaxEvaluationContext, rate: number): KeepSliceShares {
  return takeHomeAllocation(context).ordinary.get(rate) ?? EMPTY_SHARES;
}
