import type { TaxResult } from "~/lib/taxForm.types";
import type { SankeyChartData, SankeyChartNode, SankeyChartLink } from "~/lib/taxCharts.types";
import { SANKEY_IDS } from "~/lib/config/page/Page.config";
import { getOrdinaryFederalSegments, getLongTermCapitalGainsSegments } from "~/lib/taxChartMetricRead";
import { incomeRowsFromTaxResult } from "~/lib/taxForm.rows";
import { incomeSourceDisplayLabel } from "~/lib/taxCalc.labeledAmountSource";
import { ordinaryBracketNodeId, ltcgBracketNodeId, ordinarySegmentKey, ltcgSegmentKey } from "~/lib/taxCharts.sankeySegmentKeys";
import { formatLtcgBracketLabel, formatOrdinaryBracketLabel } from "~/lib/taxCharts.sankeyFormat";
import { netInvestmentIncomeTaxPerSegment } from "~/lib/taxCharts.sankeyNiit";
import { allocateFederalCreditsTopMarginalSlices, takeHomeAttributableToBracketFlows } from "~/lib/taxCharts.visualizationBundle";
import { splitTakeHomeAndPayrollByPool } from "~/lib/taxCharts.sankeyHelpers";

function getRegistryNumber(result: TaxResult, metricsKey: string, defaultVal = 0): number {
  const line = result.metricLines?.find(l => l.metricsKey === metricsKey);
  if (!line) return defaultVal;
  const v = line.value;
  return typeof v === "number" && Number.isFinite(v) ? v : defaultVal;
}


function addNode(nodeMap: Map<string, SankeyChartNode>, node: SankeyChartNode): void {
  if (!nodeMap.has(node.id)) {
    nodeMap.set(node.id, node);
  }
}

export function buildSankeyChartData(result: TaxResult, debug = false): SankeyChartData {
  const nodeMap = new Map<string, SankeyChartNode>();
  const links: SankeyChartLink[] = [];
  const takeHomePoolSlices: { sourceId: string; weight: number }[] = [];
  const niitBySegment = netInvestmentIncomeTaxPerSegment(result);

  const incomeIdMap = buildIncomeNodes(result, nodeMap);
  buildDeductionNodes(result, nodeMap, links, incomeIdMap);
  buildBracketNodes(result, nodeMap, links, takeHomePoolSlices, niitBySegment);
  buildTaxKeepNodes(result, nodeMap, links, takeHomePoolSlices);

  const data: SankeyChartData = {
    nodes: [...nodeMap.values()],
    links,
  };

  if (debug) {
    console.log("=== SANKEY NODES ===");
    for (const node of data.nodes) {
      console.log(`  ${node.id}: ${node.label} (${node.kind}) amount=${node.amount}`);
    }
    console.log("=== SANKEY LINKS ===");
    for (const link of data.links) {
      console.log(`  ${link.sourceId} -> ${link.targetId}: ${link.value}`);
    }
  }

  return data;
}

function buildIncomeNodes(result: TaxResult, nodeMap: Map<string, SankeyChartNode>): Map<string, string> {
  const idMap = new Map<string, string>();
  const rows = incomeRowsFromTaxResult(result);
  
  for (const row of rows) {
    if (row.amount <= 0) continue;
    const nodeId = `income-${row.id}`;
    
    nodeMap.set(nodeId, {
      id: nodeId,
      label: incomeSourceDisplayLabel(row),
      kind: "incomeSource",
      amount: row.amount,
      incomeKind: row.kind,
    });
    idMap.set(row.id, nodeId);
  }
  
  return idMap;
}

function buildDeductionNodes(
  result: TaxResult,
  nodeMap: Map<string, SankeyChartNode>,
  links: SankeyChartLink[],
  incomeIdMap: Map<string, string>,
): void {
  const standardDeduction = getRegistryNumber(result, "standardDeduction");
  const itemizedDeductions = getRegistryNumber(result, "itemizedDeductions");
  const deductionAmount = standardDeduction + itemizedDeductions;
  const preTaxTotal = getRegistryNumber(result, "preTaxTotal");
  
  if (deductionAmount <= 0 && preTaxTotal <= 0) return;

  const shieldId = "deduction-shield";
  nodeMap.set(shieldId, {
    id: shieldId,
    label: "Shielded income",
    kind: "deductionShield",
    amount: deductionAmount + preTaxTotal,
  });

  if (preTaxTotal > 0) {
    const pretaxId = "pretax-total";
    nodeMap.set(pretaxId, {
      id: pretaxId,
      label: "Pre-tax",
      kind: "pretaxContribution",
      amount: preTaxTotal,
    });

    const allIncomeRows = incomeRowsFromTaxResult(result)
      .filter(r => r.amount > 0)
      .map(r => ({ id: r.id, weight: r.amount }));

    if (allIncomeRows.length > 0) {
      const total = allIncomeRows.reduce((s, r) => s + r.weight, 0);
      for (const row of allIncomeRows) {
        const sourceId = incomeIdMap.get(row.id);
        if (sourceId) {
          const value = Math.round((row.weight / total) * preTaxTotal);
          if (value > 0) {
            links.push({ sourceId, targetId: pretaxId, value });
            links.push({ sourceId: pretaxId, targetId: shieldId, value });
          }
        }
      }
    }
  }

  if (deductionAmount > 0) {
    const ordinaryIncomeRows = incomeRowsFromTaxResult(result)
      .filter(r => r.amount > 0 && (r.kind.includes("input-income")))
      .map(r => ({ id: r.id, weight: r.amount }));

    if (ordinaryIncomeRows.length > 0) {
      const total = ordinaryIncomeRows.reduce((s, r) => s + r.weight, 0);
      for (const row of ordinaryIncomeRows) {
        const sourceId = incomeIdMap.get(row.id);
        if (sourceId) {
          const value = Math.round((row.weight / total) * deductionAmount);
          if (value > 0) {
            links.push({ sourceId, targetId: shieldId, value });
          }
        }
      }
    }
  }
}



function buildBracketNodes(
  result: TaxResult,
  nodeMap: Map<string, SankeyChartNode>,
  links: SankeyChartLink[],
  takeHomePoolSlices: { sourceId: string; weight: number }[],
  niitBySegment: { ordinary: Map<string, number>; ltcg: Map<string, number> },
): void {
  const ordinarySegments = getOrdinaryFederalSegments(result);
  const ltcgSegments = getLongTermCapitalGainsSegments(result);

  const ordinaryTaxable = getRegistryNumber(result, "ordinaryTaxableIncome");
  const payrollTax = getRegistryNumber(result, "payrollTax");
  const selfEmploymentTax = getRegistryNumber(result, "selfEmploymentTax");
  const totalPayroll = payrollTax + selfEmploymentTax;

  let segments = ordinarySegments;
  if (segments.length === 0 && ordinaryTaxable > 0) {
    segments = [{
      id: "0",
      rangeStart: 0,
      rangeEnd: ordinaryTaxable,
      incomeAmount: ordinaryTaxable,
      taxAmount: 0,
      marginalRate: 0,
    }];
  }

  const oScale = ordinaryTaxable > 0 && totalPayroll > 0 && ordinarySegments.length > 0
    ? Math.max(0, (ordinaryTaxable - Math.min(totalPayroll, ordinaryTaxable)) / ordinaryTaxable)
    : 1;

  const federalByNode = allocateFederalCreditsTopMarginalSlices(result);
  const takeHomeForPools = takeHomeAttributableToBracketFlows(result);

  for (const segment of segments) {
    const nodeId = ordinaryBracketNodeId(segment);
    const niitPart = niitBySegment.ordinary.get(ordinarySegmentKey(segment)) ?? 0;
    const taxWithNiit = segment.taxAmount + niitPart;
    
    addNode(nodeMap, {
      id: nodeId,
      label: formatOrdinaryBracketLabel(segment),
      kind: "ordinaryBracket",
      amount: segment.incomeAmount,
      incomeAmount: segment.incomeAmount,
      taxAmount: taxWithNiit,
      marginalRate: segment.marginalRate,
      rangeStart: segment.rangeStart,
      rangeEnd: segment.rangeEnd,
    });

    const linkFlow = segment.incomeAmount * oScale;
    links.push({
      sourceId: SANKEY_IDS.ordinaryTaxableIncome,
      targetId: nodeId,
      value: linkFlow,
    });


    takeHomePoolSlices.push({ sourceId: nodeId, weight: segment.incomeAmount - taxWithNiit });
  }

  const split = splitTakeHomeAndPayrollByPool(takeHomePoolSlices, takeHomeForPools, totalPayroll);

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const nodeId = ordinaryBracketNodeId(segment);
    
    const splitFed = federalByNode.get(nodeId) ?? { federalToTax: 0, creditPortion: 0 };
    const federalToTax = splitFed.federalToTax * oScale;
    const creditPortion = splitFed.creditPortion * oScale;
    const bracketOutflow = segment.incomeAmount * oScale;

    const poolPart = split.get(nodeId) ?? { keep: 0, payroll: 0 };
    
    const payrollPortion = poolPart.payroll;
    
    const rawOutflows = [
      { terminalId: SANKEY_IDS.taxesFederal, amount: federalToTax },
      { terminalId: SANKEY_IDS.taxesPayroll, amount: payrollPortion },
      { terminalId: SANKEY_IDS.keep, amount: poolPart.keep + creditPortion },
    ];

    const outs = normalizeTerminalOutflowsToInflow(bracketOutflow, rawOutflows);
    for (const o of outs) {
      if (o.amount > 0) {
        links.push({ sourceId: nodeId, targetId: o.terminalId, value: o.amount });
      }
    }
  }

  for (const segment of ltcgSegments) {
    const nodeId = ltcgBracketNodeId(segment);
    const niitPart = niitBySegment.ltcg.get(ltcgSegmentKey(segment)) ?? 0;
    const taxWithNiit = segment.taxAmount + niitPart;
    
    addNode(nodeMap, {
      id: nodeId,
      label: formatLtcgBracketLabel(segment),
      kind: "ltcgBracket",
      amount: segment.incomeAmount,
      incomeAmount: segment.incomeAmount,
      taxAmount: taxWithNiit,
      marginalRate: segment.marginalRate,
      rangeStart: segment.rangeStart,
      rangeEnd: segment.rangeEnd,
      fill: "var(--sankey-node-ltcg)",
      stroke: "var(--sankey-link-ltcg)",
    });

    links.push({
      sourceId: SANKEY_IDS.ltcgIncome,
      targetId: nodeId,
      value: segment.incomeAmount,
    });

    const splitFed = federalByNode.get(nodeId) ?? { federalToTax: 0, creditPortion: 0 };
    const federalToTax = splitFed.federalToTax;

    const rawOutflows = [
      { terminalId: SANKEY_IDS.taxesFederal, amount: federalToTax },
      { terminalId: SANKEY_IDS.keep, amount: Math.max(0, segment.incomeAmount - taxWithNiit) },
    ];

    const outs = normalizeTerminalOutflowsToInflow(segment.incomeAmount, rawOutflows);
    for (const o of outs) {
      if (o.amount > 0) {
        links.push({ sourceId: nodeId, targetId: o.terminalId, value: o.amount });
      }
    }
  }
}

function allocateProportional(
  keys: { key: string; weight: number }[],
  total: number,
): { key: string; value: number }[] {
  const w = keys.reduce((s, x) => s + x.weight, 0);
  if (w <= 0 || total <= 0 || keys.length === 0) return [];
  let acc = 0;
  const out: { key: string; value: number }[] = [];
  keys.forEach((k, i) => {
    const last = i === keys.length - 1;
    const v = last ? Math.max(0, total - acc) : Math.round((k.weight / w) * total);
    acc += v;
    if (v > 0) out.push({ key: k.key, value: v });
  });
  return out;
}

function normalizeTerminalOutflowsToInflow(inflow: number, outs: { terminalId: string; amount: number }[]): { terminalId: string; amount: number }[] {
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
  if (Math.abs(diff) > 1.5 && base.length > 0) {
    const i = base.length - 1;
    base[i] = { ...base[i], amount: Math.max(0, base[i].amount + diff) };
  }

  return base.filter(o => o.amount > 0);
}

function buildTaxKeepNodes(
  result: TaxResult,
  nodeMap: Map<string, SankeyChartNode>,
  links: SankeyChartLink[],
  takeHomePoolSlices: { sourceId: string; weight: number }[],
): void {
  const federalTax = getRegistryNumber(result, "federalIncomeTax");
  const payrollTaxKeep = getRegistryNumber(result, "payrollTax");
  const selfEmploymentTax = getRegistryNumber(result, "selfEmploymentTax");
  const takeHome = getRegistryNumber(result, "takeHomePay");
  const creditsApplied = getRegistryNumber(result, "federalTaxCreditsApplied");

  addNode(nodeMap, {
    id: SANKEY_IDS.taxesFederal,
    label: "Federal tax",
    kind: "taxesFederal",
    amount: federalTax,
  });

  const totalPayroll = payrollTaxKeep + selfEmploymentTax;
  if (totalPayroll > 0) {
    addNode(nodeMap, {
      id: SANKEY_IDS.taxesPayroll,
      label: "Payroll tax",
      kind: "taxesPayroll",
      amount: totalPayroll,
    });
  }

  if (creditsApplied > 0) {
    addNode(nodeMap, {
      id: SANKEY_IDS.federalCredits,
      label: "Federal credits",
      kind: "federalCredits",
      amount: creditsApplied,
    });
  }

  if (takeHome > 0) {
    addNode(nodeMap, {
      id: SANKEY_IDS.keep,
      label: "Take-home",
      kind: "keep",
      amount: takeHome,
    });
  }

  const poolTotal = takeHomePoolSlices.reduce((acc, x) => acc + x.weight, 0);

  const creditsFromBrackets = links
    .filter(l => l.targetId === SANKEY_IDS.federalCredits)
    .reduce((s, l) => s + l.value, 0);

  if (poolTotal > 0 && creditsApplied > 0 && creditsFromBrackets < creditsApplied) {
    links.push({
      sourceId: SANKEY_IDS.federalCredits,
      targetId: SANKEY_IDS.keep,
      value: creditsApplied - creditsFromBrackets,
    });
  }

  const shieldNode = nodeMap.get("deduction-shield");
  const shieldAmount = shieldNode?.amount ?? 0;
  const preTaxTotal = getRegistryNumber(result, "preTaxTotal");
  const standardDeduction = getRegistryNumber(result, "standardDeduction");
  const itemizedDeductions = getRegistryNumber(result, "itemizedDeductions");
  const deductionAmount = standardDeduction + itemizedDeductions;
  const payrollTax = getRegistryNumber(result, "payrollTax");
  const wageIncome = getRegistryNumber(result, "wageIncome");
  
  if (shieldAmount > 0 && takeHome > 0) {
    if (preTaxTotal > 0) {
      links.push({
        sourceId: "deduction-shield",
        targetId: SANKEY_IDS.keep,
        value: preTaxTotal,
      });
    }
    if (deductionAmount > 0) {
      links.push({
        sourceId: "deduction-shield",
        targetId: SANKEY_IDS.keep,
        value: deductionAmount,
      });
    }

    if (payrollTax > 0 && preTaxTotal > 0 && wageIncome > 0) {
      const wagesAfterPretax = Math.max(0, wageIncome - preTaxTotal);
      if (wagesAfterPretax > 0) {
        const wagesInPretax = Math.min(wageIncome, preTaxTotal);
        const wagesInPretaxRatio = wagesInPretax / wageIncome;
        const payrollFromPretax = Math.round(payrollTax * wagesInPretaxRatio);
        
        if (payrollFromPretax > 0) {
          links.push({
            sourceId: "deduction-shield",
            targetId: SANKEY_IDS.taxesPayroll,
            value: payrollFromPretax,
          });
        }
      }
    }
  }

  if (poolTotal > 0) {
  } else {
    const allIncome = incomeRowsFromTaxResult(result)
      .filter(r => r.amount > 0)
      .map(r => ({ key: `income-${r.id}`, weight: r.amount, kind: r.kind }));

    if (takeHome > 0 && allIncome.length > 0) {
      for (const { key, value } of allocateProportional(allIncome, takeHome)) {
        links.push({
          sourceId: key,
          targetId: SANKEY_IDS.keep,
          value,
        });
      }
    }

    if (payrollTaxKeep > 0) {
      const wageRows = allIncome.filter(r => r.kind === "income-ordinary-wages");
      if (wageRows.length > 0) {
        for (const { key, value } of allocateProportional(wageRows, payrollTaxKeep)) {
          links.push({
            sourceId: key,
            targetId: SANKEY_IDS.taxesPayroll,
            value,
          });
        }
      }
    }

    if (selfEmploymentTax > 0) {
      const seRows = allIncome.filter(r => r.kind === "income-ordinary-selfEmployment-selfEmployment");
      if (seRows.length > 0) {
        for (const { key, value } of allocateProportional(seRows, selfEmploymentTax)) {
          links.push({
            sourceId: key,
            targetId: SANKEY_IDS.taxesPayroll,
            value,
          });
        }
      }
    }

    if (creditsApplied > 0 && allIncome.length > 0) {
      for (const { key, value } of allocateProportional(allIncome, creditsApplied)) {
        links.push({
          sourceId: key,
          targetId: SANKEY_IDS.federalCredits,
          value,
        });
      }
      links.push({
        sourceId: SANKEY_IDS.federalCredits,
        targetId: SANKEY_IDS.keep,
        value: creditsApplied,
      });
    }
  }
}
