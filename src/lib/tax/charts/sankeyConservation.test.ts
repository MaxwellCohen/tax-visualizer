import { describe, expect, it } from "vitest";
import { calculateAllConfigValues } from "~/lib/tax/calc/calculateTaxes";
import { newIncomeSource } from "~/lib/tax/calc/labeledAmountSource";
import { getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import { incomeSourcesToRows, taxFormDataFromParts } from "~/lib/tax/form/factories";
import type { FilingStatus } from "~/lib/tax/data/types";
import type { TaxFormData } from "~/lib/tax/form/types";
import { buildSankeyLayoutFromCalculatedConfig } from "~/lib/tax/charts/buildSankeyLayout";
import type { ChartLink, ChartNode } from "~/components/tax/sankey/types/chartTypes";
import { SCENARIO_PRESETS } from "~/lib/tax/scenario/presets.constants";

function endpointId(end: string | ChartNode): string {
  return typeof end === "string" ? end : end.id;
}

function flowTotals(links: ChartLink[]) {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const link of links) {
    const source = endpointId(link.source);
    const target = endpointId(link.target);
    outgoing.set(source, (outgoing.get(source) ?? 0) + link.value);
    incoming.set(target, (incoming.get(target) ?? 0) + link.value);
  }
  return { incoming, outgoing };
}

function imbalances(links: ChartLink[]): string[] {
  const { incoming, outgoing } = flowTotals(links);
  const ids = new Set([...incoming.keys(), ...outgoing.keys()]);
  const broken: string[] = [];
  for (const id of ids) {
    const inn = incoming.get(id) ?? 0;
    const out = outgoing.get(id) ?? 0;
    if (inn > 0 && out > 0 && Math.abs(inn - out) > 0.05) {
      broken.push(`${id} in ${inn.toFixed(2)} out ${out.toFixed(2)}`);
    }
  }
  return broken;
}

function layoutFor(form: TaxFormData, filingStatus: FilingStatus) {
  const taxData = getTaxYearConfig(2026);
  if (!taxData) throw new Error("missing 2026 config");
  const calculated = calculateAllConfigValues(form, taxData, filingStatus);
  const graph = buildSankeyLayoutFromCalculatedConfig(calculated);
  if (!graph) throw new Error("missing sankey");
  return graph;
}

describe("sankey money flow", () => {
  it("keeps $90,000 of ordinary income equal on the way in and the way out", () => {
    const form = taxFormDataFromParts({
      taxYear: 2026,
      filingStatus: "single",
      incomeRows: incomeSourcesToRows([
        newIncomeSource({ kind: "income-ordinary-wages-spouse1", amount: 90_000, label: "Salary" }),
      ]),
      pretaxRows: [],
      useItemizedDeductions: false,
      deductionRows: [],
      creditRows: [],
    });
    const graph = layoutFor(form, "single");
    expect(imbalances(graph.links)).toEqual([]);

    const { incoming, outgoing } = flowTotals(graph.links);
    expect(incoming.get("ordinaryTaxableIncome")).toBeCloseTo(90_000, 2);
    expect(outgoing.get("ordinaryTaxableIncome")).toBeCloseTo(90_000, 2);
    expect(incoming.get("standardDeduction")).toBeCloseTo(9_215, 2);
    expect(outgoing.get("standardDeduction")).toBeCloseTo(9_215, 2);
    expect(outgoing.get("takeHomePay") ?? 0).toBe(0);
    expect(incoming.get("takeHomePay")).toBeCloseTo(72_145, 2);
    expect(incoming.get("federalPayrollTaxes")).toBeCloseTo(6_885, 2);
    expect(incoming.get("federalIncomeTax")).toBeCloseTo(10_970, 2);
  });

  it("still balances when self-employment tax is larger than the standard deduction", () => {
    const form = taxFormDataFromParts({
      taxYear: 2026,
      filingStatus: "single",
      incomeRows: incomeSourcesToRows([
        newIncomeSource({
          kind: "income-ordinary-selfEmployment-selfEmployment-spouse1",
          amount: 200_000,
          label: "1099",
        }),
      ]),
      pretaxRows: [],
      useItemizedDeductions: false,
      deductionRows: [],
      creditRows: [],
    });
    const graph = layoutFor(form, "single");
    expect(imbalances(graph.links)).toEqual([]);
    const { incoming, outgoing } = flowTotals(graph.links);
    expect(incoming.get("ordinaryTaxableIncome")).toBeCloseTo(200_000, 2);
    expect(outgoing.get("ordinaryTaxableIncome")).toBeCloseTo(200_000, 2);
  });

  it("routes state income tax to its own node without breaking balance", () => {
    const wages = (amount: number, residenceState: "CA" | "AL" | "NY", filingStatus: FilingStatus = "single") =>
      taxFormDataFromParts({
        taxYear: 2026,
        filingStatus,
        residenceState,
        incomeRows: incomeSourcesToRows([
          newIncomeSource({ kind: "income-ordinary-wages-spouse1", amount, label: "Salary" }),
          newIncomeSource({ kind: "income-longTermCapGains", amount: amount / 10, label: "Gains" }),
        ]),
        pretaxRows: [],
        useItemizedDeductions: false,
        deductionRows: [],
        creditRows: [],
      });
    // Low income: federal taxable income is tiny, so state tax has to come out of the kept deduction.
    for (const [form, status] of [
      [wages(90_000, "CA"), "single"],
      [wages(18_000, "AL"), "single"],
      [wages(400_000, "NY", "marriedJoint"), "marriedJoint"],
    ] as const) {
      const taxData = getTaxYearConfig(2026)!;
      const calculated = calculateAllConfigValues(form, taxData, status);
      const stateTax = calculated.find((item) => item.id === "stateIncomeTax")!.computedValue;
      expect(stateTax).toBeGreaterThan(0);
      const graph = layoutFor(form, status);
      expect(imbalances(graph.links)).toEqual([]);
      const { incoming } = flowTotals(graph.links);
      expect(incoming.get("stateIncomeTax")).toBeCloseTo(stateTax, 2);
      const takeHome = calculated.find((item) => item.id === "takeHomePay")!.computedValue;
      expect(incoming.get("takeHomePay")).toBeCloseTo(takeHome, 2);
    }
  });

  it("balances the sample presets", () => {
    for (const preset of SCENARIO_PRESETS) {
      const form = preset.buildInput(2026);
      const filingStatus = form.rows.find(
        (row) => row.type === "setting" && row.id === "filingStatus",
      );
      const status = filingStatus && filingStatus.type === "setting" ? filingStatus.value : "single";
      const graph = layoutFor(form, status as FilingStatus);
      expect(imbalances(graph.links), preset.id).toEqual([]);
    }
  });
});
