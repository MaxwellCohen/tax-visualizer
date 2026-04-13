/**
 * Round `x` to a readable step (1, 2, 5, 10 × 10^n). Used for income axis ticks.
 */
export function niceStep(x: number, round: boolean): number {
  if (x <= 0 || !Number.isFinite(x)) return 1;
  const exp = Math.floor(Math.log10(x));
  const f = x / 10 ** exp;
  let nf: number;
  if (round) {
    if (f < 1.5) nf = 1;
    else if (f < 3) nf = 2;
    else if (f < 7) nf = 5;
    else nf = 10;
  } else {
    if (f <= 1) nf = 1;
    else if (f <= 2) nf = 2;
    else if (f <= 5) nf = 5;
    else nf = 10;
  }
  return nf * 10 ** exp;
}

/** Y-axis domain and ticks derived together: step scales with income, tick count scales with plot height. */
export function incomeYAxis(visualTotal: number, plotH: number): { yMax: number; yTicks: number[] } {
  const dataMax = Math.max(visualTotal, 1);
  const targetIntervals = Math.max(3, Math.min(8, Math.round(plotH / 52)));
  let step = niceStep(dataMax / targetIntervals, true);
  let yMax = Math.max(step, Math.ceil(dataMax / step) * step);
  let intervals = Math.round(yMax / step);
  while (intervals > targetIntervals + 1) {
    step = niceStep(step * 2, true);
    yMax = Math.max(step, Math.ceil(dataMax / step) * step);
    intervals = Math.round(yMax / step);
  }
  const yTicks: number[] = [];
  for (let i = 0; i <= intervals; i++) {
    yTicks.push(Math.round(step * i));
  }
  return { yMax, yTicks };
}

export function incomeY(plotTop: number, plotH: number, yMax: number, income: number): number {
  return plotTop + plotH - (income / yMax) * plotH;
}
