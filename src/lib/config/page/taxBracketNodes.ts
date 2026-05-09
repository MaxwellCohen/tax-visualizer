/** Federal ordinary brackets and LTCG bracket slices (income / tax / keep per band). */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import type { configItem } from "./pageConfig.types";
import { calculateLtcgTaxTotal, getCreditsSankeyRow, getOrdinaryBrackets } from "./pageConfig.helpers";
import { allPretax, calculatePayrollTax, calculateSelfEmploymentTax, calculateTaxableIncome, ordinaryIncome, ordinaryIncomeSlicesWithPayrollShadow, totalDeductions } from "./taxCalculations";
import { longTermCapGains, totalCredits } from "./pageConfig.inputs";

interface CreditAllocation {
    ordinaryBracketCredits: number[];
    ltcgCredit: number;
    creditsRow: number;
}

function getCreditLinkCreditsRow(creditsRow: number) {
    return {
        fill: "var(--sankey-link-credits)",
        stroke: "var(--sankey-link-credits)",
        row: creditsRow,
        col: 3,
    } as const;
}

function computeCreditAllocation(
    inputs: TaxFormRow[],
    taxData: TaxYearConfig,
    filingStatus: FilingStatus,
    bracketsLength: number,
): CreditAllocation {
    const credits = totalCredits(inputs);
    const { ordinary, ltcg, payrollBracketShadowFill } = calculateTaxableIncome(inputs, taxData, filingStatus);
    const brackets = getOrdinaryBrackets(taxData, filingStatus);
    const ordinarySlices = ordinaryIncomeSlicesWithPayrollShadow(ordinary, brackets, payrollBracketShadowFill);

    const bracketTaxes: number[] = ordinarySlices.map((incomeInBracket, i) => incomeInBracket * brackets[i].rate);

    const ltcgTax = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinary);

    let remainingCredits = credits;
    const ordinaryBracketCredits: number[] = [...Array(bracketsLength)].fill(0);
    let ltcgCredit = 0;

    if (remainingCredits > 0 && ltcgTax > 0) {
        ltcgCredit = Math.min(remainingCredits, ltcgTax);
        remainingCredits -= ltcgCredit;
    }

    for (let i = brackets.length - 1; i >= 0 && remainingCredits > 0; i--) {
        const taxInBracket = bracketTaxes[i];
        if (taxInBracket > 0) {
            const creditApplied = Math.min(remainingCredits, taxInBracket);
            ordinaryBracketCredits[i] = creditApplied;
            remainingCredits -= creditApplied;
        }
    }

    return {
        ordinaryBracketCredits,
        ltcgCredit,
        creditsRow: getCreditsSankeyRow(taxData, filingStatus),
    };
}

// function getCreditAllocationForBrackets(
//     inputs: TaxFormRow[],
//     taxData: TaxYearConfig,
//     filingStatus: FilingStatus,
//     bracketsLength: number,
// ): CreditAllocation {
//     return computeCreditAllocation(inputs, taxData, filingStatus, bracketsLength);
// }




function calculateTaxBracket(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus, bracketIndex: number) {
    const result = [];
    const brackets = taxData.federalBrackets[filingStatus];
    const income = ordinaryIncome(inputs) - allPretax(inputs);
    const payrollTaxTotal = calculatePayrollTax(inputs, taxData, filingStatus) + calculateSelfEmploymentTax(inputs, taxData);
    const deductions = totalDeductions(inputs, taxData, filingStatus); 

    // const { afterPretax, payrollTaxTotal, deduction } = calculateTaxableIncome(inputs, taxData, filingStatus);
    let remainingIncome = income - deductions;
    let remainingPayrollTax = Math.max(payrollTaxTotal - deductions, 0);
    let remainingCredits = totalCredits(inputs);
    console.log("result", {payrollTaxTotal, deductions, 
        remainingIncome,
remainingPayrollTax,
remainingCredits,
    });
    // loop through all brackets to calculate the tax and keep
    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const bracketMax = bracket?.upTo ?? Infinity;
        const taxableBracketIncome = Math.min(remainingIncome, bracketMax);
        remainingIncome = Math.max(0, remainingIncome - taxableBracketIncome)
        const tax = taxableBracketIncome * bracket.rate;
        const keep = Math.max(taxableBracketIncome - tax - remainingPayrollTax, 0);
        remainingPayrollTax = Math.max(0, remainingPayrollTax - (taxableBracketIncome - tax));
        
        result.push({ taxBracket: bracket, tax, keep, credits: 0,  payrollTax: remainingPayrollTax, remainingIncome: remainingIncome });
    };
    console.log("result", result, );  
    // loop thorough backwards and add in the credit calculations using result from the forward pass
    for (let i = result.length - 1; i >= 0; i--) {
        const bracket = result[i];
        const credits = Math.min(remainingCredits, bracket.tax - bracket.credits);
        bracket.credits = Math.max(0, credits);
        bracket.tax  = Math.max(0, bracket.tax - credits);
        remainingCredits -= credits;
    }
    return result[bracketIndex];
}

export function getBracketItems(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    const brackets = taxData.federalBrackets[filingStatus];
    const items: configItem[] = [];
    const creditsRow = getCreditsSankeyRow(taxData, filingStatus);
    const ltcgIncomeRow = 50;
    for (let i = 0; i < brackets.length; i++) {
        const bracket = brackets[i];
        const rateLabel = (bracket.rate * 100).toFixed(0);
        const bracketId = `bracket-${i}`;

        // const incomeCalculate = (inputs: TaxFormRow[], _td?: TaxYearConfig, _fs?: FilingStatus) => {
        //     const td = _td ?? taxData;
        //     const { ordinary, payrollBracketShadowFill } = calculateTaxableIncome(inputs, td, filingStatus);
        //     const br = getOrdinaryBrackets(td, filingStatus);
        //     const slices = ordinaryIncomeSlicesWithPayrollShadow(ordinary, br, payrollBracketShadowFill);
        //     return slices[i];
        // };


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
            mekkoSettings: {
                column: { row: bracketRow, col: 3, fill: "var(--mekko-keep)", stroke: "var(--mekko-keep)", kind: "ordinaryBracket" },
            },
            calculate: (inputs) => {
                const bracketData = calculateTaxBracket(inputs, taxData, filingStatus, i);
                console.log("bracketData", i, bracketData);
                return bracketData.tax + bracketData.credits + bracketData.keep;
            },
        });

        // const incomeItem = items[items.length - 1];



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
                const bracketData = calculateTaxBracket(inputs, taxData, filingStatus, i);
                return bracketData.keep;
            },
        });

        items.push({
            id: `${bracketId}-credits`,
            label: `${rateLabel} % Credits`,
            shortLabel: `${rateLabel}% Credits`,
            sankeySettings: {
                link: [
                    { source: `${bracketId}-income`, target: "takeHomePay", ...getCreditLinkCreditsRow(creditsRow), row: bracketRow + 2 },
                ],
            },
            calculate: (inputs) => {
                const bracketData = calculateTaxBracket(inputs, taxData, filingStatus, i);
                return bracketData.credits;
            },
        });

        items.push({
            id: `${bracketId}-tax`,
            label: `${rateLabel} % Tax`,
            shortLabel: `${rateLabel}% Tax`,
            sankeySettings: {
                link: [
                    { source: `${bracketId}-income`, target: "federalIncomeTax", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)", row: bracketRow + 3, col: 3 },
                ],
            },
            calculate: (inputs) => {
                const bracketData = calculateTaxBracket(inputs, taxData, filingStatus, i);
                return bracketData.tax;
            },
        });
    }

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
        mekkoSettings: {
            column: { row: ltcgIncomeRow, col: 3, fill: "var(--mekko-ltcg)", stroke: "var(--mekko-ltcg)", kind: "ltcgBracket" },
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
            const gross = calculateLtcgTaxTotal(ltcg, taxData.longTermCapGains, filingStatus, ordinary);
            const allocation = computeCreditAllocation(
                inputs,
                taxData,
                filingStatus,
                taxData.federalBrackets[filingStatus].length,
            );
            return Math.max(0, gross - allocation.ltcgCredit);
        },
    });

    items.push({
        id: "ltcg-credits",
        label: "LTCG Credits",
        shortLabel: "LTCG Credits",
        sankeySettings: {
            link: [
                {
                    source: "ltcg-income",
                    target: "takeHomePay",
                    ...getCreditLinkCreditsRow(creditsRow),
                    row: ltcgIncomeRow + 2,
                },
            ],
        },
        calculate: (inputs, td, fs) => {
            const allocation = computeCreditAllocation(inputs, td, fs, td.federalBrackets[fs].length);
            return allocation.ltcgCredit;
        },
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
            const { ordinary, ltcg } = calculateTaxableIncome(inputs, td, fs);
            const grossLtcgTax = calculateLtcgTaxTotal(ltcg, td.longTermCapGains, fs, ordinary);
            return incomes - grossLtcgTax;
        },
    });
    return items;
}
