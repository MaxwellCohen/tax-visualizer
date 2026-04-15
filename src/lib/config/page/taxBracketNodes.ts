/** Federal ordinary brackets and LTCG bracket slices (income / tax / keep per band). */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { TaxFormRow } from "~/lib/taxForm.types";
import type { configItem } from "./pageConfig.types";
import { findInputById, getStandardDeduction } from "./pageConfig.helpers";

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

        items.push({
            id: `${bracketId}-income`,
            label: `Bracket ${i + 1} Income (${rateLabel}%)`,
            shortLabel: `${rateLabel}% Income`,
            sankeySettings: {
                node: { fill: "var(--sankey-node-4)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "ordinaryTaxableIncome", target: `${bracketId}-income`, fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
            calculate: incomeCalculate,
        });

        const incomeItem = items[items.length - 1];



        items.push({
            id: `${bracketId}-keep`,
            label: `Bracket ${i + 1} Keep (${rateLabel}%)`,
            shortLabel: `${rateLabel}% Keep`,
            sankeySettings: {
                link: [
                    { source: `${bracketId}-income`, target: "takeHomePay", fill: "var(--sankey-link-keep)", stroke: "var(--sankey-link-keep)" },
                ],
            },
            calculate: (inputs) => {
                const incomes = incomeItem.calculate?.(inputs, taxData, filingStatus) ?? 0;
                return incomes * (1 - bracket.rate);
            },
        });
        items.push({
            id: `${bracketId}-tax`,
            label: `Bracket ${i + 1} Tax (${rateLabel}%)`,
            shortLabel: `${rateLabel}% Tax`,
            sankeySettings: {
                link: [
                    { source: `${bracketId}-income`, target: "federalIncomeTax", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)" },
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
    const longTermCapGains = (inputs: TaxFormRow[]) => findInputById(inputs, "longTermCapGains");
    const thresholds = taxData.longTermCapGains[filingStatus];
    const items: configItem[] = [];

    const ltcgConfigs: Array<{ rate: number; thresholdKey: "zeroRateMax" | "fifteenRateMax" | null; label: string }> = [
        { rate: 0, thresholdKey: "zeroRateMax", label: "0%" },
        { rate: 0.15, thresholdKey: "fifteenRateMax", label: "15%" },
        { rate: 0.20, thresholdKey: null, label: "20%" },
    ];

    let priorBound = 0;

    for (let i = 0; i < ltcgConfigs.length; i++) {
        const cfg = ltcgConfigs[i];
        const upperBound = cfg.thresholdKey ? (thresholds[cfg.thresholdKey] ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY;

        const incomeCalculate = (inputs: TaxFormRow[], _td?: TaxYearConfig, _fs?: FilingStatus) => {
            const ltcgAmount = longTermCapGains(inputs);
            const lowerBound = (i === 0) ? 0 : (ltcgConfigs[i - 1].thresholdKey ? (thresholds[ltcgConfigs[i - 1].thresholdKey!] ?? 0) : 0);
            const amountInBracket = Math.max(0, Math.min(ltcgAmount, upperBound) - lowerBound);
            return amountInBracket;
        };

        const bracketId = `ltcg-bracket-${i}`;
        items.push({
            id: `${bracketId}-income`,
            label: `LTCG Bracket ${i + 1} Income (${cfg.label})`,
            shortLabel: `LTCG ${cfg.label} Income`,
            sankeySettings: {
                node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link-ltcg)" },
                link: [
                    { source: "longTermTaxableIncome", target: `${bracketId}-income`, fill: "var(--sankey-link-ltcg)", stroke: "var(--sankey-link-ltcg)" },
                ],
            },
            calculate: incomeCalculate,
        });

        const incomeItem = items[items.length - 1];

        items.push({
            id: `${bracketId}-tax`,
            label: `LTCG Bracket ${i + 1} Tax (${cfg.label})`,
            shortLabel: `LTCG ${cfg.label} Tax`,
            sankeySettings: {
                link: [
                    { source: `${bracketId}-income`, target: "federalIncomeTax", fill: "var(--sankey-link-tax)", stroke: "var(--sankey-link-tax)" },
                ],
            },
            calculate: (inputs, td, fs) => {
                const incomes = incomeItem.calculate?.(inputs, td, fs) ?? 0;
                return incomes * cfg.rate;
            },
        });

        items.push({
            id: `${bracketId}-keep`,
            label: `LTCG Bracket ${i + 1} Keep (${cfg.label})`,
            shortLabel: `LTCG ${cfg.label} Keep`,
            sankeySettings: {
                link: [
                    { source: `${bracketId}-income`, target: "takeHomePay", fill: "var(--sankey-link-keep)", stroke: "var(--sankey-link-keep)" },
                ],
            },
            calculate: (inputs, td, fs) => {
                const incomes = incomeItem.calculate?.(inputs, td, fs) ?? 0;
                return incomes * (1 - cfg.rate);
            },
        });

        priorBound = upperBound;
    }
    
    return items;
}
