// fallow-ignore-file code-duplication
/** Federal ordinary brackets and LTCG bracket slices (income / tax / keep per band). */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { ConfigItem } from "./pageConfig.types";
import { getCreditsSankeyRow } from "./sankeyLayout.helpers";
import { calculateTaxBrackets } from "./taxCalculations";

function getCreditLinkCreditsRow(creditsRow: number) {
    return {
        fill: "var(--sankey-link-credits)",
        stroke: "var(--sankey-link-credits)",
        row: creditsRow,
        col: 3,
    } as const;
}

export function getBracketItems(taxData: TaxYearConfig, filingStatus: FilingStatus): ConfigItem[] {
    const brackets = taxData.federalBrackets[filingStatus];
    let items: ConfigItem[] = [];
    const creditsRow = getCreditsSankeyRow(taxData, filingStatus);
    const ltcgIncomeRow = 50;
    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const rateLabel = (bracket.rate * 100).toFixed(0);
        const bracketId = `bracket-${i}`;
        const bracketRow = 5 + i * 4;
        items.push({
            id: `${bracketId}-income`,
            chartRole: "ordinaryBracket",
            labels: { default: `${rateLabel} % Income`, compact: `${rateLabel}% Income` },
            sankey: {
                node: { fill: "var(--sankey-node-4)", stroke: "var(--sankey-link)", row: bracketRow, col: 3 },
                links: [
                    { source: "ordinaryTaxableIncome", target: `${bracketId}-income`, fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: bracketRow, col: 2 },
                ],
            },
            mekko: {
                    row: bracketRow,
                    col: 3,
                    fill: "var(--mekko-keep)",
                    stroke: "var(--mekko-keep)",
                    split: { keepId: `${bracketId}-keep`, taxFill: "var(--mekko-tax)", taxStroke: "var(--mekko-tax)" },
            },
            calculate: (inputs) => {
                const { tax, credits, keep } = calculateTaxBrackets(inputs, taxData, filingStatus)[i] ?? { tax: 0, credits: 0, keep: 0 };
                return tax + credits + keep;
            },
        }, {
            id: `${bracketId}-keep`,
            labels: { default: `${rateLabel} % Keep`, compact: `${rateLabel}% Income` },
            sankey: {
                links: [
                    { source: `${bracketId}-income`, target: "takeHomePay", fill: "var(--sankey-link-keep)", stroke: "var(--sankey-link-keep)", row: bracketRow + 1, col: 3 },
                ],
            },
            calculate: (inputs) => {
                const { keep } = calculateTaxBrackets(inputs, taxData, filingStatus)[i] ?? {  keep: 0 };
                return keep;
            },
        }, {
            id: `${bracketId}-credits`,
            labels: { default: `${rateLabel} % Credits`, compact: `${rateLabel}% Credits` },
            sankey: {
                links: [
                    { source: `${bracketId}-income`, target: "takeHomePay", ...getCreditLinkCreditsRow(creditsRow), row: bracketRow + 2 },
                ],
            },
            calculate: (inputs) => {
                const { credits } = calculateTaxBrackets(inputs, taxData, filingStatus)[i] ?? { credits: 0 };
                return credits;
            },
        }, {
            id: `${bracketId}-tax`,
            labels: { default: `${rateLabel} % Tax`, compact: `${rateLabel}% Tax` },
            sankey: {
                links: [
                    { source: `${bracketId}-income`, target: "federalIncomeTax", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)", row: bracketRow + 3, col: 3 },
                ],
            },
            calculate: (inputs) => {
                const { tax } = calculateTaxBrackets(inputs, taxData, filingStatus)[i] ?? { tax: 0 };
                return tax;
            },
        });
    }
    const i = brackets.length;
    items.push({
        id: "ltcg-income",
        chartRole: "ltcg",
        labels: { default: "LTCG Income", compact: "LTCG Income" },
        sankey: {
            node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link)", row: ltcgIncomeRow, col: 3 },
            links: [
                { source: "longTermTaxableIncome", target: "ltcg-income", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: ltcgIncomeRow, col: 2 },
            ],
        },
        mekko: {
                row: ltcgIncomeRow,
                col: 3,
                fill: "var(--mekko-ltcg)",
                stroke: "var(--mekko-ltcg)",
                split: { keepId: "ltcg-keep", taxFill: "var(--mekko-tax)", taxStroke: "var(--mekko-tax)" },
        },
        calculate: (inputs) => {
            const { tax, credits, keep } = calculateTaxBrackets(inputs, taxData, filingStatus)[i] ?? { tax: 0, credits: 0, keep: 0 };
            return tax + credits + keep;
        },
    },{
        id: "ltcg-tax",
        labels: { default: "LTCG Tax", compact: "LTCG Tax" },
        sankey: {
            links: [
                { source: "ltcg-income", target: "federalIncomeTax", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)", row: ltcgIncomeRow + 2, col: 3 },
            ],
        },
        calculate: (inputs) => {
            const { tax } = calculateTaxBrackets(inputs, taxData, filingStatus)[i] ?? { tax: 0 };
            return tax;
        },
    },{
        id: "ltcg-credits",
        labels: { default: "LTCG Credits", compact: "LTCG Credits" },
        sankey: {
            links: [
                {   
                    source: "ltcg-income",
                    target: "takeHomePay",
                    ...getCreditLinkCreditsRow(creditsRow),
                    row: ltcgIncomeRow + 1,
                },
            ],
        },
        calculate: (inputs) => {
            const { credits } = calculateTaxBrackets(inputs, taxData, filingStatus)[i] ?? { credits: 0 };
            return credits;
        },
    },{
        id: "ltcg-keep",
        labels: { default: "LTCG Keep", compact: "LTCG Keep" },
        sankey: {
            links: [
                { source: "ltcg-income", target: "takeHomePay", fill: "var(--sankey-link-keep)", stroke: "var(--sankey-link-keep)", row: 49, col: 3 },
            ],
        },
        calculate: (inputs) => {
            const { keep } = calculateTaxBrackets(inputs, taxData, filingStatus)[i] ?? { keep: 0 };
            return keep;
        },
    });
    return items;
}
