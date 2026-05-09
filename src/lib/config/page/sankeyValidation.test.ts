import { describe, expect, it } from "vitest";
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import { getTaxYearConfig } from "~/lib/taxData";
import { calculateAllConfigValues, type CalculatedConfigItem } from "~/lib/taxCalc.calculateTaxes";
import { SankeyLink } from "~/lib/config/page/Page.config";
import { baseInput, withPretaxTotals } from "~/lib/taxCalc.test.helpers";
import { incomeSourcesToRows } from "~/lib/taxForm.factories";
import type { TaxFormData } from "~/lib/taxForm.types";

interface SankeyFlowTestCase {
    name: string;
    inputs: TaxFormData;
    taxData: TaxYearConfig;
    filingStatus: FilingStatus;
}

/**
 * Each Sankey link is declared on the config row that owns the flow amount for that edge.
 * Using the link target's `computedValue` is wrong for shared hubs (`takeHomePay`, `federalIncomeTax`),
 * where every incoming link would incorrectly use the hub's total instead of the slice for that edge.
 */
function extractSankeyLinkFlows(cc: CalculatedConfigItem[]): { link: SankeyLink; flowValue: number }[] {
    return cc
        .filter((item) => item.computedValue > 0 && Boolean(item.sankey?.links?.length))
        .flatMap((item) =>
            (item.sankey?.links || []).map((link) => ({
                link,
                flowValue: item.computedValue,
            })),
        );
}

function validateSankeyFlows(cc: CalculatedConfigItem[]): { nodeId: string; sourceTotal: number; targetTotal: number }[] {
    const linkFlows = extractSankeyLinkFlows(cc);
    const nodeFlows = new Map<string, { outgoing: number; incoming: number }>();

    for (const { link, flowValue } of linkFlows) {
        if (flowValue === 0) continue;

        const sourceItem = cc.find((c) => c.id === link.source);
        const targetItem = cc.find((c) => c.id === link.target);

        if (sourceItem) {
            const sourceNode = nodeFlows.get(link.source) || { outgoing: 0, incoming: 0 };
            sourceNode.outgoing += flowValue;
            nodeFlows.set(link.source, sourceNode);
        }

        if (targetItem) {
            const targetNode = nodeFlows.get(link.target) || { outgoing: 0, incoming: 0 };
            targetNode.incoming += flowValue;
            nodeFlows.set(link.target, targetNode);
        }
    }

    const mismatches: { nodeId: string; sourceTotal: number; targetTotal: number }[] = [];
    for (const [nodeId, flows] of nodeFlows) {
        if (flows.incoming > 0 && flows.outgoing > 0 && Math.abs(flows.outgoing - flows.incoming) > 0.01) {
            mismatches.push({ nodeId, sourceTotal: flows.outgoing, targetTotal: flows.incoming });
        }
    }

    return mismatches;
}

const standardTestCases: SankeyFlowTestCase[] = [
    {
        name: "single wage income 100k",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 100_000 },
            ]),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "single",
    },
    {
        name: "single wage + self-employment",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 90_000 },
                { id: "se", kind: "income-ordinary-selfEmployment-selfEmployment", label: "", amount: 60_000 },
            ]),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "single",
    },
    {
        name: "wage + 401k",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 100_000 },
            ]),
            pretaxRows: withPretaxTotals({ "input-pretax-401K-preTax401kSpouse1": 10_000 }),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "single",
    },
    {
        name: "married joint wages 200k",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "marriedJoint",
            incomeRows: incomeSourcesToRows([
                { id: "w1", kind: "income-ordinary-wages", label: "Wages Spouse 1", amount: 100_000 },
                { id: "w2", kind: "income-ordinary-wages", label: "Wages Spouse 2", amount: 100_000 },
            ]),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "marriedJoint",
    },
    {
        name: "wage + pretax + itemized deductions",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 150_000 },
            ]),
            pretaxRows: withPretaxTotals({ "input-pretax-401K-preTax401kSpouse1": 15_000 }),
            useItemizedDeductions: true,
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "single",
    },
    {
        name: "wage + ltcg",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 80_000 },
                { id: "ltcg", kind: "income-longTermCapGains", label: "", amount: 30_000 },
            ]),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "single",
    },
    {
        name: "high income top bracket",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 500_000 },
            ]),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "single",
    },
    {
        name: "zero income",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 0 },
            ]),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "single",
    },
    {
        name: "high SE income",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "se", kind: "income-ordinary-selfEmployment-selfEmployment", label: "", amount: 200_000 },
            ]),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "single",
    },
    {
        name: "wage + short-term cap gains",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 80_000 },
                { id: "stcg", kind: "income-shortTermCapGains", label: "", amount: 20_000 },
            ]),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "single",
    },
    {
        name: "year 2026",
        inputs: baseInput({
            taxYear: 2026,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 100_000 },
            ]),
        }),
        taxData: getTaxYearConfig(2026)!,
        filingStatus: "single",
    },
    {
        name: "married filing separately",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "marriedSeparate",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 100_000 },
            ]),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "marriedSeparate",
    },
    {
        name: "head of household",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "headOfHousehold",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 100_000 },
            ]),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "headOfHousehold",
    },
    {
        name: "wage + 401k + hsa",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 100_000 },
            ]),
            pretaxRows: withPretaxTotals({
                "input-pretax-401K-preTax401kSpouse1": 10_000,
                "input-pretax-HSA-preTaxHSASpouse1": 4_150,
            }),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "single",
    },
    {
        name: "wage + traditional IRA",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 100_000 },
            ]),
            pretaxRows: withPretaxTotals({
                "input-pretax-traditionalIRAPreTax-traditionalIRASpouse1": 7_000,
            }),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "single",
    },
    {
        name: "dual income wage + self-employment",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "marriedJoint",
            incomeRows: incomeSourcesToRows([
                { id: "w1", kind: "income-ordinary-wages", label: "Wages Spouse 1", amount: 120_000 },
                { id: "w2", kind: "income-ordinary-wages", label: "Wages Spouse 2", amount: 80_000 },
                { id: "se", kind: "income-ordinary-selfEmployment-selfEmployment", label: "", amount: 50_000 },
            ]),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "marriedJoint",
    },
    {
        name: "multiple pretax benefits",
        inputs: baseInput({
            taxYear: 2025,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 150_000 },
            ]),
            pretaxRows: withPretaxTotals({
                "input-pretax-401K-preTax401kSpouse1": 23_500,
                "input-pretax-HSA-preTaxHSASpouse1": 4_150,
                "input-pretax-traditionalIRAPreTax-traditionalIRASpouse1": 7_000,
            }),
        }),
        taxData: getTaxYearConfig(2025)!,
        filingStatus: "single",
    },
];

describe("sankey flow validation", () => {
    for (const tc of standardTestCases) {
        it(tc.name, () => {
            const calculated = calculateAllConfigValues(tc.inputs, tc.taxData, tc.filingStatus);
            const mismatches = validateSankeyFlows(calculated);

            expect(mismatches).toEqual([]);
        });
    }
});