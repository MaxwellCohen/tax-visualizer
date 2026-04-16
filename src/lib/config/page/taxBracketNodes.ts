/** Federal ordinary brackets and LTCG bracket slices (income / tax / keep per band). */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import type { configItem } from "./pageConfig.types";
import { findInputById, calculateLtcgTaxTotal, getStandardDeduction } from "./pageConfig.helpers";
import { buildFinalTaxContext } from "./pageConfig.finalTaxContext";

export function getBracketItems(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    const brackets = taxData.federalBrackets[filingStatus];
    const items: configItem[] = [];

    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const rateLabel = (bracket.rate * 100).toFixed(0);
        const bracketId = `bracket-${i}`;

        const priorBound = (i > 0) ? (brackets[i - 1].upTo ?? Number.POSITIVE_INFINITY) : 0;
        const incomeCalculate = (inputs: TaxFormRow[], _td?: TaxYearConfig, _fs?: FilingStatus) => {
            const wages = findInputById(inputs, "wages");
            const seIncome = findInputById(inputs, "selfEmployment");
            const ordinary = findInputById(inputs, "ordinary");
            const stcg = findInputById(inputs, "shortTermCapGains");
            const pretax = findInputById(inputs, "401k") + findInputById(inputs, "hsa") + findInputById(inputs, "otherPretax") + findInputById(inputs, "traditionalIra");
            const afterPretax = wages + seIncome + ordinary + stcg - pretax;
            const itemized = findInputById(inputs, "salt") + findInputById(inputs, "medicalDental") + findInputById(inputs, "mortgageInterest") + findInputById(inputs, "charitable");
            const standard = getStandardDeduction(taxData, filingStatus);
            const deduction = Math.max(itemized, standard);
            const taxableIncome = Math.max(0, afterPretax - deduction);
            const upperBound = bracket.upTo ?? Number.POSITIVE_INFINITY;
            return Math.max(0, Math.min(taxableIncome, upperBound) - priorBound);
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

export function getLtcgBracketItems(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    const items: configItem[] = [];
    
    const { wageIncome, selfEmploymentIncome, ordinaryIncome, shortTermCapGains, longTermCapGains, _401k, _hsa, otherPretax, traditionalIra, salt, medicalDental, mortgageInterest, charitable } = buildFinalTaxContext(taxData, filingStatus);
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
        calculate: (inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus) => {
            const ltcgAmount = findInputById(inputs, "longTermCapGains");
            return ltcgAmount;
        },
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
            console.log("-----", inputs);
            const ltcgAmount = findInputById(inputs, "longTermCapGains");
            const wages = wageIncome(inputs);
            const seIncome = selfEmploymentIncome(inputs);
            const ordinary = ordinaryIncome(inputs);
            const stcg = shortTermCapGains(inputs);
            const ltcg = longTermCapGains(inputs);
            const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
            const afterPretax = wages + seIncome + ordinary + stcg - pretax;
            const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
            const standard = getStandardDeduction(taxData, filingStatus);
            const deduction = Math.max(itemized, standard);
            const ordinaryTaxable = Math.max(0, afterPretax - deduction);
            
            console.log("-----", ordinaryTaxable);
            console.log("-----", ltcgAmount);
            const ltcgTax = calculateLtcgTaxTotal(ltcgAmount, taxData.longTermCapGains, filingStatus, Number(ordinaryTaxable));
            console.log("-----", ltcgTax);
            return ltcgTax;
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
            console.log("incomes", incomes);
            console.log("tax", tax);
            return incomes - tax;
        },
    });

    return items;
}
