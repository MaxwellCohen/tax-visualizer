


/**
 * Split take-home and payroll tax across all pool slices by weight.
 * Each slice gets a portion of both take-home and payroll based on its
 * relative weight in the pool (income - tax for that bracket).
 */
export function splitTakeHomeAndPayrollByPool(
  slices: { sourceId: string; weight: number }[],
  takeHomePay: number,
  payrollTax: number,
): Map<string, { keep: number; payroll: number }> {
  const out = new Map<string, { keep: number; payroll: number }>();
  const pool = slices.reduce((s, x) => s + x.weight, 0);
  if (pool <= 0 || slices.length === 0) return out;

  let accKeep = 0;
  let accPayroll = 0;
  slices.forEach((slice, i) => {
    const last = i === slices.length - 1;
    const keep = last ? Math.max(0, takeHomePay - accKeep) : Math.round((slice.weight / pool) * takeHomePay);
    accKeep += keep;
    
    const payroll = last ? Math.max(0, payrollTax - accPayroll) : Math.round((slice.weight / pool) * payrollTax);
    accPayroll += payroll;
    
    out.set(slice.sourceId, { keep, payroll });
  });

  return out;
}
