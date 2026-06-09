// fallow-ignore-file code-duplication
/** Federal ordinary brackets and LTCG bracket slices (income / tax / keep per band). */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";
import { getCreditsSankeyRow } from "../sankey/sankeyLayout.helpers";
import { findOrdinaryTaxBucketByRate, sumTaxBucketsByType } from "~/lib/tax/calc/taxEvaluation";

function getCreditLinkCreditsRow(creditsRow: number) {
    return {
        row: creditsRow,
        col: 3,
    } as const;
}

export function getBracketItems(taxData: TaxYearConfig, filingStatus: FilingStatus): ConfigItem[] {
    const brackets = taxData.federalBrackets[filingStatus];
    let items: ConfigItem[] = [];
    const creditsRow = getCreditsSankeyRow(brackets.length);
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
            description: `Ordinary income hub taxed at ${rateLabel}% (marginal band)`,
            sankey: {
                node: { row: bracketRow, col: 3 },
            },
        }, {
            id: `${bracketId}-income`,
            chartRole: "ordinaryBracket",
            chartStyle: { fill: "var(--color-sankey-link-keep)", stroke: "var(--color-sankey-link-keep)" },
            labels: { default: `${rateLabel} % Income`, compact: `${rateLabel}% Income` },
            description: `Ordinary income flowing into the ${rateLabel}% bracket slice`,
            sankey: {
                links: [
                    { source: "ordinaryTaxableIncome", target: `${bracketId}-node`, row: bracketRow, col: 2 },
                ],
            },
            mekko: {
                row: bracketRow,
                split: { keepId: `${bracketId}-keep` },
            },
            calculate: (_inputs, _taxData, _filingStatus, context) => {
                const { tax, credits, keep } = findOrdinaryTaxBucketByRate(context, bracket.rate) ?? { tax: 0, credits: 0, keep: 0 };
                return tax + credits + keep;
            },
        }, {
            id: `${bracketId}-keep`,
            chartStyle: { fill: "var(--color-sankey-link-keep)", stroke: "var(--color-sankey-link-keep)" },
            labels: { default: `${rateLabel} % Keep`, compact: `${rateLabel}% Income` },
            description: `After-tax ordinary income kept from the ${rateLabel}% bracket`,
            sankey: {
                links: [
                    { source: `${bracketId}-node`, target: "takeHomePay", row: bracketRow + 1, col: 3 },
                ],
            },
            calculate: (_inputs, _taxData, _filingStatus, context) => findOrdinaryTaxBucketByRate(context, bracket.rate)?.keep ?? 0,
        }, {
            id: `${bracketId}-credits`,
            chartStyle: { fill: "var(--color-chart-credit)", stroke: "var(--color-sankey-link-credits)" },
            labels: { default: `${rateLabel} % Credits`, compact: `${rateLabel}% Credits` },
            description: `Federal credits attributed to ordinary income in the ${rateLabel}% band`,
            sankey: {
                links: [
                    { source: `${bracketId}-node`, target: "takeHomePay", ...getCreditLinkCreditsRow(creditsRow), row: bracketRow + 2 },
                ],
            },
            calculate: (_inputs, _taxData, _filingStatus, context) => findOrdinaryTaxBucketByRate(context, bracket.rate)?.credits ?? 0,
        }, {
            id: `${bracketId}-tax`,
            chartStyle: { fill: "var(--color-chart-tax)", stroke: "var(--color-sankey-link-tax)" },
            labels: { default: `${rateLabel} % Tax`, compact: `${rateLabel}% Tax` },
            description: `Federal income tax from ordinary income in the ${rateLabel}% bracket`,
            sankey: {
                links: [
                    { source: `${bracketId}-node`, target: "federalIncomeTax", row: bracketRow + 3, col: 3 },
                ],
            },
            calculate: (_inputs, _taxData, _filingStatus, context) => findOrdinaryTaxBucketByRate(context, bracket.rate)?.tax ?? 0,
        });
    }
    // const i = brackets.length;
    items.push({
        id: "ltcg-income",
        chartRole: "ltcg",
        chartStyle: { fill: "var(--color-chart-ltcg)", stroke: "var(--color-sankey-link)" },
        labels: { default: "LTCG Income", compact: "LTCG Income" },
        description: "Long-term capital gains routed through preferential rate buckets",
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
        calculate: (_inputs, _taxData, _filingStatus, context) =>
            sumTaxBucketsByType(context, "ltcg", (bucket) => bucket.tax + bucket.credits + bucket.keep),
    }, {
        id: "ltcg-tax",
        chartStyle: { fill: "var(--color-chart-tax)", stroke: "var(--color-sankey-link-tax)" },
        labels: { default: "LTCG Tax", compact: "LTCG Tax" },
        description: "Federal income tax on long-term capital gains",
        sankey: {
            links: [
                { source: "ltcg-income", target: "federalIncomeTax", row: ltcgIncomeRow + 2, col: 3 },
            ],
        },
        calculate: (_inputs, _taxData, _filingStatus, context) =>
            sumTaxBucketsByType(context, "ltcg", (bucket) => bucket.tax),
    }, {
        id: "ltcg-credits",
        chartStyle: { fill: "var(--color-chart-credit)", stroke: "var(--color-sankey-link-credits)" },
        labels: { default: "LTCG Credits", compact: "LTCG Credits" },
        description: "Credits flowing from LTCG bracket allocation",
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
        calculate: (_inputs, _taxData, _filingStatus, context) =>
            sumTaxBucketsByType(context, "ltcg", (bucket) => bucket.credits),
    }, {
        id: "ltcg-keep",
        chartStyle: { fill: "var(--color-sankey-link-keep)", stroke: "var(--color-sankey-link-keep)" },
        labels: { default: "LTCG Keep", compact: "LTCG Keep" },
        description: "After-tax long-term gains kept",
        sankey: {
            links: [
                { source: "ltcg-income", target: "takeHomePay", row: 49, col: 3 },
            ],
        },
        calculate: (_inputs, _taxData, _filingStatus, context) =>
            sumTaxBucketsByType(context, "ltcg", (bucket) => bucket.keep),
    });
    return items;
}
