import { SANKEY_IDS } from "~/lib/taxCharts.sankey.constants";
import type { SankeyChartLink } from "~/lib/taxCharts.types";

/** One ribbon from an intermediate node to a terminal (sink) node. */
export type TerminalOutflow = { terminalId: string; amount: number };

const ROUND_TOL = 1.5;

/**
 * Adjust outflows so their sum equals `inflow` (within rounding). Prefers nudging the take-home
 * ribbon; if absent, nudges the last positive outflow.
 */
export function normalizeTerminalOutflowsToInflow(inflow: number, outs: TerminalOutflow[]): TerminalOutflow[] {
  const base = outs.map(o => ({ ...o, amount: Math.max(0, o.amount) }));
  let sum = base.reduce((s, x) => s + x.amount, 0);
  let diff = inflow - sum;
  if (Math.abs(diff) < 0.5) {
    return base.filter(o => o.amount > 0);
  }

  const keepIdx = base.findIndex(o => o.terminalId === SANKEY_IDS.keep);
  if (keepIdx >= 0) {
    base[keepIdx] = {
      ...base[keepIdx],
      amount: Math.max(0, base[keepIdx].amount + diff),
    };
  } else if (base.length > 0) {
    const i = base.length - 1;
    base[i] = { ...base[i], amount: Math.max(0, base[i].amount + diff) };
  } else {
    base.push({ terminalId: SANKEY_IDS.keep, amount: Math.max(0, inflow) });
  }

  sum = base.reduce((s, x) => s + x.amount, 0);
  diff = inflow - sum;
  if (Math.abs(diff) > ROUND_TOL && base.length > 0) {
    const i = base.length - 1;
    base[i] = { ...base[i], amount: Math.max(0, base[i].amount + diff) };
  }

  return base.filter(o => o.amount > 0);
}

export function appendLinksFromTerminalOutflows(
  links: SankeyChartLink[],
  sourceNodeId: string,
  outs: TerminalOutflow[],
): void {
  for (const o of outs) {
    if (o.amount > 0) {
      links.push({ sourceId: sourceNodeId, targetId: o.terminalId, value: o.amount });
    }
  }
}
