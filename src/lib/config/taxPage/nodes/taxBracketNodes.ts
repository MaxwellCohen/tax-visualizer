// fallow-ignore-file code-duplication
/** Federal ordinary brackets and LTCG bracket slices (income / tax / keep per band). */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";
import { getCreditsSankeyRow } from "../sankey/sankeyLayout.helpers";
import { calculateTaxBrackets } from "../calc/taxCalculations";

function getCreditLinkCreditsRow(creditsRow: number) {
    return {
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
            id: `${bracketId}-node`,
            chartStyle: { fill: "var(--color-chart-keep)", stroke: "var(--color-chart-keep)" },
            labels: { default: `${rateLabel} % Income`, compact: `${rateLabel}% Income` },
            sankey: {
                node: { row: bracketRow, col: 3 },
            },
        }, {
            id: `${bracketId}-income`,
            chartRole: "ordinaryBracket",
            chartStyle: { fill: "var(--color-sankey-link-keep)", stroke: "var(--color-sankey-link-keep)" },
            labels: { default: `${rateLabel} % Income`, compact: `${rateLabel}% Income` },
            sankey: {
                links: [
                    { source: "ordinaryTaxableIncome", target: `${bracketId}-node`, row: bracketRow, col: 2 },
                ],
            },
            mekko: {
                    row: bracketRow,
                    split: { keepId: `${bracketId}-keep` },
            },
            calculate: (inputs) => {
                const { tax, credits, keep } = calculateTaxBrackets(inputs, taxData, filingStatus)[i] ?? { tax: 0, credits: 0, keep: 0 };
                return tax + credits + keep;
            },
        }, {
            id: `${bracketId}-keep`,
            chartStyle: { fill: "var(--color-sankey-link-keep)", stroke: "var(--color-sankey-link-keep)" },
            labels: { default: `${rateLabel} % Keep`, compact: `${rateLabel}% Income` },
            sankey: {
                links: [
                    { source: `${bracketId}-node`, target: "takeHomePay", row: bracketRow + 1, col: 3 },
                ],
            },
            calculate: (inputs) => {
                const { keep } = calculateTaxBrackets(inputs, taxData, filingStatus)[i] ?? {  keep: 0 };
                return keep;
            },
        }, {
            id: `${bracketId}-credits`,
            chartStyle: { fill: "var(--color-chart-credit)", stroke: "var(--color-sankey-link-credits)" },
            labels: { default: `${rateLabel} % Credits`, compact: `${rateLabel}% Credits` },
            sankey: {
                links: [
                    { source: `${bracketId}-node`, target: "takeHomePay", ...getCreditLinkCreditsRow(creditsRow), row: bracketRow + 2 },
                ],
            },
            calculate: (inputs) => {
                const { credits } = calculateTaxBrackets(inputs, taxData, filingStatus)[i] ?? { credits: 0 };
                return credits;
            },
        }, {
            id: `${bracketId}-tax`,
            chartStyle: { fill: "var(--color-chart-tax)", stroke: "var(--color-sankey-link-tax)" },
            labels: { default: `${rateLabel} % Tax`, compact: `${rateLabel}% Tax` },
            sankey: {
                links: [
                    { source: `${bracketId}-node`, target: "federalIncomeTax", row: bracketRow + 3, col: 3 },
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
        chartStyle: { fill: "var(--color-chart-ltcg)", stroke: "var(--color-sankey-link)" },
        labels: { default: "LTCG Income", compact: "LTCG Income" },
        sankey: {
            node: { row: ltcgIncomeRow, col: 3 },
            links: [
                { source: "longTermTaxableIncome", target: "ltcg-income", row: ltcgIncomeRow, col: 2 },
            ],
        },
        mekko: {
                row: ltcgIncomeRow,
                split: { keepId: "ltcg-keep" },
        },
        calculate: (inputs) => {
            const { tax, credits, keep } = calculateTaxBrackets(inputs, taxData, filingStatus)[i] ?? { tax: 0, credits: 0, keep: 0 };
            return tax + credits + keep;
        },
    },{
        id: "ltcg-tax",
        chartStyle: { fill: "var(--color-chart-tax)", stroke: "var(--color-sankey-link-tax)" },
        labels: { default: "LTCG Tax", compact: "LTCG Tax" },
        sankey: {
            links: [
                { source: "ltcg-income", target: "federalIncomeTax", row: ltcgIncomeRow + 2, col: 3 },
            ],
        },
        calculate: (inputs) => {
            const { tax } = calculateTaxBrackets(inputs, taxData, filingStatus)[i] ?? { tax: 0 };
            return tax;
        },
    },{
        id: "ltcg-credits",
        chartStyle: { fill: "var(--color-chart-credit)", stroke: "var(--color-sankey-link-credits)" },
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
        chartStyle: { fill: "var(--color-sankey-link-keep)", stroke: "var(--color-sankey-link-keep)" },
        labels: { default: "LTCG Keep", compact: "LTCG Keep" },
        sankey: {
            links: [
                { source: "ltcg-income", target: "takeHomePay", row: 49, col: 3 },
            ],
        },
        calculate: (inputs) => {
            const { keep } = calculateTaxBrackets(inputs, taxData, filingStatus)[i] ?? { keep: 0 };
            return keep;
        },
    });
    return items;
}
