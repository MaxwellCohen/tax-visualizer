/** Federal ordinary brackets and LTCG bracket slices (income / tax / keep per band). */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import type { configItem } from "./pageConfig.types";
import { calculateLtcgTaxTotal } from "./pageConfig.helpers";
import { calculateTaxableIncome } from "./taxCalculations";
import { longTermCapGains } from "./pageConfig.inputs";

export function getBracketItems(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    const brackets = taxData.federalBrackets[filingStatus];
    const items: configItem[] = [];

    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const rateLabel = (bracket.rate * 100).toFixed(0);
        const bracketId = `bracket-${i}`;

        const priorBound = (i > 0) ? (brackets[i - 1].upTo ?? Number.POSITIVE_INFINITY) : 0;
        const incomeCalculate = (inputs: TaxFormRow[], _td?: TaxYearConfig, _fs?: FilingStatus) => {
            const td = _td ?? taxData;
            const { ordinary } = calculateTaxableIncome(inputs, td, filingStatus);
            const upperBound = bracket.upTo ?? Number.POSITIVE_INFINITY;
            return Math.max(0, Math.min(ordinary, upperBound) - priorBound);
        };


        const bracketRow = 5 + i * 4;
        items.push({
            id: `${bracketId}-income`,
            label: `${rateLabel} % Income`,
            shortLabel: `${rateLabel}% Income`,
            sankeySettings: {
                node: { fill: "var(--sankey-node-4)", stroke: "var(--sankey-link)", row: bracketRow, col: 3 },
                link: [
                    { source: "ordinaryTaxableIncome", target: `${bracketId}-income`, fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: bracketRow, col: 2 },
                ],
            },
            calculate: incomeCalculate,
        });

        const incomeItem = items[items.length - 1];



        items.push({
            id: `${bracketId}-keep`,
            label: `${rateLabel} % Keep`,
            shortLabel: `${rateLabel}% Income`,
            sankeySettings: {
                link: [
                    { source: `${bracketId}-income`, target: "takeHomePay", fill: "var(--sankey-link-keep)", stroke: "var(--sankey-link-keep)", row: bracketRow + 1, col: 3 },
                ],
            },
            calculate: (inputs) => {
                const incomes = incomeItem.calculate?.(inputs, taxData, filingStatus) ?? 0;
                return incomes * (1 - bracket.rate);
            },
        });
        items.push({
            id: `${bracketId}-tax`,
            label: `${rateLabel} % Tax`,
            shortLabel: `${rateLabel}% Tax`,
            sankeySettings: {
                link: [
                    { source: `${bracketId}-income`, target: "federalIncomeTax", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)", row: bracketRow + 2, col: 3 },
                ],
            },
            calculate: (inputs, td, fs) => {
                const incomes = incomeItem.calculate?.(inputs, td, fs) ?? 0;
                return incomes * bracket.rate;
            },
        });
    }

    return items;
}

export function getLtcgBracketItems(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    const items: configItem[] = [];
    
    const ltcgIncomeRow = 50;
    items.push({
        id: "ltcg-income",
        label: "LTCG Income",
        shortLabel: "LTCG Income",
        sankeySettings: {
            node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link)", row: ltcgIncomeRow, col: 3 },
            link: [
                { source: "longTermTaxableIncome", target: "ltcg-income", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: ltcgIncomeRow, col: 2 },
            ],
        },
        calculate: longTermCapGains,
    });

    const incomeItem = items[items.length - 1];

    items.push({
        id: "ltcg-tax",
        label: "LTCG Tax",
        shortLabel: "LTCG Tax",
        sankeySettings: {
            link: [
                { source: "ltcg-income", target: "federalIncomeTax", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)", row: ltcgIncomeRow, col: 3 },
            ],
        },
        calculate: (inputs, taxData, filingStatus) => {
            const { ordinary, ltcg } = calculateTaxableIncome(inputs, taxData, filingStatus);
            return calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinary);
        }
    });

    items.push({
        id: "ltcg-keep",
        label: "LTCG Keep",
        shortLabel: "LTCG Keep",
        sankeySettings: {
            link: [
                { source: "ltcg-income", target: "takeHomePay", fill: "var(--sankey-link-keep)", stroke: "var(--sankey-link-keep)", row: 49, col: 3 },
            ],
        },
        calculate: (inputs, td, fs) => {
            const incomes = incomeItem.calculate?.(inputs, td, fs) ?? 0;
            const tax = items.find(i => i.id === "ltcg-tax")?.calculate?.(inputs, td, fs) ?? 0;
            return incomes - tax;
        },
    });

    return items;
}
