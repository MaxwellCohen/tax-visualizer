/**
 * Round `x` to a readable step (1, 2, 5, 10 × 10^n). Used for income axis ticks.
 */
function niceStep(x: number, round: boolean): number {
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


/**
 * Axis domain equals `dataMax` exactly (e.g. gross total income) — no “nice” padding above the max.
 */
export function incomeYAxisToDataMax(dataMax: number, plotH: number): { yMax: number; yTicks: number[] } {
  const yMax = Math.max(dataMax, 1);
  const targetIntervals = Math.max(3, Math.min(8, Math.round(plotH / 52)));
  const step = niceStep(yMax / targetIntervals, true);

  const yTicks: number[] = [0];
  let t = step;
  while (t < yMax - 1) {
    yTicks.push(Math.round(t));
    t += step;
  }
  const roundedMax = Math.round(yMax);
  if (yTicks[yTicks.length - 1] !== roundedMax) {
    const prev = yTicks[yTicks.length - 1];
    if (roundedMax - prev < step * 0.2 && yTicks.length > 1) {
      yTicks.pop();
    }
    yTicks.push(roundedMax);
  }
  return { yMax, yTicks };
}

export function incomeY(plotTop: number, plotH: number, yMax: number, income: number): number {
  return plotTop + plotH - (income / yMax) * plotH;
}
