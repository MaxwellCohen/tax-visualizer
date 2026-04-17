import type { FilingStatus, TaxYearConfig, LongTermCapGainsThresholds, FederalTaxBracket } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import { allPretax, useItemizedDeductions, wageIncome } from "./pageConfig.inputs";
import { calculatePayrollTax } from "./taxCalculations";

export function findInputById(inputs: TaxFormRow[], id: string): number {

    
    for (const row of (inputs || [])) {
        if (row.type === "setting") {
            if (row.id.includes(id)) {
                if ("value" in row && typeof row.value === "number") return row.value;
            }
        } else if ("kind" in row) {
            if (row.kind.includes(id)) {
                if ("amount" in row && typeof row.amount === "number") {
                    return row.amount;
                }
            }
        }
    }
    return 0;
}

export function getStandardDeduction(inputs: TaxFormRow[], taxData: TaxYearConfig, filingStatus: FilingStatus): number {
    const useItemized = useItemizedDeductions(inputs);
    if(useItemized) return 0;
    const income = wageIncome(inputs) - allPretax(inputs)
    const standard = Math.min(income, taxData.standardDeduction[filingStatus]);

    const payrollTax = calculatePayrollTax(inputs, taxData);
    return Math.max(0, standard - payrollTax);
}

export function getOrdinaryBrackets(taxData: TaxYearConfig, filingStatus: FilingStatus): FederalTaxBracket[] {
    return taxData.federalBrackets[filingStatus];
}


export function calculateOrdinaryTaxTotal(taxableIncome: number, brackets: FederalTaxBracket[]): { tax: number; marginalRate: number } {
    let remaining = taxableIncome;
    let lowerBound = 0;
    let totalTax = 0;
    let lastRate = 0;

    for (const bracket of brackets) {
        if (remaining <= 0) break;
        const upperBound = bracket.upTo ?? Number.POSITIVE_INFINITY;
        const amountInBracket = Math.min(remaining, upperBound - lowerBound);
        if (amountInBracket > 0) {
            const taxAmount = amountInBracket * bracket.rate;
            totalTax += taxAmount;
            remaining -= amountInBracket;
            lastRate = bracket.rate;
        }
        lowerBound = upperBound;
    }
    return { tax: totalTax, marginalRate: lastRate };
}

export function calculateLtcgTaxTotal(
    taxableLtcg: number,
    thresholds: LongTermCapGainsThresholds,
    filingStatus: FilingStatus,
    baseIncome: number
): number {
console.log("taxableLtcg", taxableLtcg);
console.log("thresholds", thresholds);
console.log("filingStatus", filingStatus);
console.log("baseIncome", baseIncome);
    let totalTax = 0;
    let remaining = taxableLtcg;
    let lowerBound = baseIncome;

    const thresholdValues = thresholds[filingStatus];
    const bracketConfigs: Array<{ rate: number; thresholdKey: "zeroRateMax" | "fifteenRateMax" | null }> = [
        { rate: 0, thresholdKey: "zeroRateMax" },
        { rate: 0.15, thresholdKey: "fifteenRateMax" },
        { rate: 0.20, thresholdKey: null },
    ];

    for (const cfg of bracketConfigs) {
        if (remaining <= 0) break;
        const upperBound = cfg.thresholdKey ? thresholdValues[cfg.thresholdKey] : Number.POSITIVE_INFINITY;
        const amountInBracket = Math.max(0, Math.min(remaining, Math.max(0, upperBound - lowerBound)));
        if (amountInBracket > 0) {
            const taxAmount = amountInBracket * cfg.rate;
            totalTax += taxAmount;
            remaining -= amountInBracket;
        }
        lowerBound = upperBound;
    }
    return totalTax;
}
