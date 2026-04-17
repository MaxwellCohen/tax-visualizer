/** Federal ordinary brackets and LTCG bracket slices (income / tax / keep per band). */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import type { configItem } from "./pageConfig.types";
import { calculateLtcgTaxTotal, getStandardDeduction } from "./pageConfig.helpers";
import { buildFinalTaxContext } from "./pageConfig.finalTaxContext";
import {
    wageIncome,
    selfEmploymentIncome,
    ordinaryIncome,
    shortTermCapGains,
    _401k,
    _hsa,
    otherPretax,
    traditionalIra,
    salt,
    medicalDental,
    mortgageInterest,
    charitable,
    longTermCapGains,
    allPretax,
} from "./pageConfig.inputs";

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
            const seIncome = selfEmploymentIncome(inputs);
            const seTax = seIncome * 0.9235 * (td.payroll.socialSecurityRate * 2 + td.payroll.medicareRate * 2);
            const seDeduction = seTax / 2;
            const ordinary = ordinaryIncome(inputs);
            const pretax = _401k(inputs) + _hsa(inputs) + otherPretax(inputs) + traditionalIra(inputs);
            const afterPretax =  seIncome + ordinary  - pretax - seDeduction;
            const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
            const standard =  getStandardDeduction(inputs, taxData, filingStatus);
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
    
    const { wageIncome, selfEmploymentIncome, ordinaryIncome, shortTermCapGains, _401k, _hsa, otherPretax, traditionalIra, salt, medicalDental, mortgageInterest, charitable } = buildFinalTaxContext(taxData, filingStatus);
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
        calculate: (inputs: TaxFormRow[]) => {
            const ltcgAmount = longTermCapGains(inputs);
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
            const ltcgAmount = longTermCapGains(inputs);
            const seIncome = selfEmploymentIncome(inputs);
            const seTax = seIncome * 0.9235 * (taxData.payroll.socialSecurityRate * 2 + taxData.payroll.medicareRate * 2);
            const seDeduction = seTax / 2;
            const wages = wageIncome(inputs);
            const ordinary = ordinaryIncome(inputs);
            const stcg = shortTermCapGains(inputs);
            const pretax = allPretax(inputs);
            const afterPretax = wages + seIncome + ordinary + stcg - pretax - seDeduction;
            const itemized = salt(inputs) + medicalDental(inputs) + mortgageInterest(inputs) + charitable(inputs);
            const standard = getStandardDeduction(inputs, taxData, filingStatus);
            const deduction = Math.max(itemized, standard);
            const ordinaryTaxable = Math.max(0, afterPretax - deduction);
            
            const ltcgTax = calculateLtcgTaxTotal(ltcgAmount, taxData.longTermCapGains, filingStatus, Number(ordinaryTaxable));
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
