/** Federal credit inputs: CTC, education, saver's credit, other. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import {
    childTaxCredit,
    educationCredits,
    retirementSavingsContributions,
    otherCredit,
} from "./pageConfig.inputs";

const creditSankeyNode = { fill: "var(--sankey-node-credits)", stroke: "var(--sankey-link-credits)", row: 3, col: 2 } as const;
const creditSankeyLink = { fill: "var(--sankey-link-credits)", stroke: "var(--sankey-link-credits)", row: 3, col: 2 } as const;

export function makeCreditInputsConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "input-credit-childTax",
            label: "Child Tax Credit",
            shortLabel: "CTC",
            description: "Credit for qualifying children (up to $2000 per child)",
            kindDetail: {
                modelingNote: "$2000 per child, $500 refundable if greater than tax liability",
            },
            inputRowSettings: {
                category: "credit",
                displayOrder: 1,
                inputType: "currency",
                subcategories: [
                    { key: "input-credit-childTax-childTax", labelSingle: "Child tax credit", labelJoint: "Child tax credit" },
                    { key: "input-credit-childTax-otherDependents", labelSingle: "Credit for other dependents", labelJoint: "Credit for other dependents" },
                ],
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
            calculate: childTaxCredit,
            sankeySettings: {
                node: creditSankeyNode,
                link: [{ source: "input-credit-childTax", target: "federalTaxCredits", ...creditSankeyLink }],
            },
        },
        {
            id: "input-credit-education",
            label: "Education Credits",
            shortLabel: "Education",
            description: "American opportunity credit and/or lifetime learning credit",
            kindDetail: {
                modelingNote: "AOC (up to $2500 per student) or LLC (up to $2000 per return)",
            },
            inputRowSettings: {
                category: "credit",
                displayOrder: 2,
                inputType: "currency",
                subcategories: [{ key: "input-credit-education-education", labelSingle: "Education credits (AOTC / LLC)", labelJoint: "Education credits (AOTC / LLC)" }],
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
            calculate: educationCredits,
            sankeySettings: {
                node: creditSankeyNode,
                link: [{ source: "input-credit-education", target: "federalTaxCredits", ...creditSankeyLink }],
            },
        },
        {
            id: "retirementSavingsContributions",
            label: "Retirement Savings Contributions (Saver's Credit)",
            shortLabel: "Saver's Credit",
            description: "Saver's credit for eligible retirement contributions",
            kindDetail: {
                limitNote: "Up to $2000 credit (based on income)",
            },
            inputRowSettings: {
                category: "credit",
                displayOrder: 3,
                inputType: "currency",
                subcategories: [{ key: "retirementSavingsContributions-retirementSavingsContributions", labelSingle: "Retirement savings contributions (saver's) credit", labelJoint: "Retirement savings contributions (saver's) credit" }],
                getLimit: (yearValues) => yearValues.caps.credits["retirementSavingsContributions"] ?? 2000,
                validate: (value, ctx) => {
                    const limit = ctx.yearValues.caps.credits["retirementSavingsContributions"] ?? 2000;
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    if (value > limit) return { valid: false, message: `Cannot exceed ${limit}`, clampedValue: limit };
                    return { valid: true };
                },
            },
            calculate: retirementSavingsContributions,
            sankeySettings: {
                node: creditSankeyNode,
                link: [{ source: "retirementSavingsContributions", target: "federalTaxCredits", ...creditSankeyLink }],
            },
        },
        {
            id: "input-credit-other",
            label: "Other Federal Credit",
            shortLabel: "Other",
            description: "Any other federal income tax credit",
            kindDetail: {
                modelingNote: "Miscellaneous federal credits",
            },
            inputRowSettings: {
                category: "credit",
                displayOrder: 4,
                inputType: "currency",
                subcategories: [
                    { key: "input-credit-other-otherFederalCredit", labelSingle: "Other federal credit", labelJoint: "Other federal credit" },
                    { key: "input-credit-other-childAndDependentCare", labelSingle: "Child and dependent care credit", labelJoint: "Child and dependent care credit" },
                    { key: "input-credit-other-foreignTaxCredit", labelSingle: "Foreign tax credit", labelJoint: "Foreign tax credit" },
                    { key: "input-credit-other-residentialCleanEnergy", labelSingle: "Residential clean energy credit", labelJoint: "Residential clean energy credit" },
                    { key: "input-credit-other-electricVehicleCredit", labelSingle: "Clean vehicle / EV credit", labelJoint: "Clean vehicle / EV credit" },
                    { key: "input-credit-other-generalBusinessCredit", labelSingle: "General business credit", labelJoint: "General business credit" },
                ],
                validate: (value) => {
                    if (value < 0) return { valid: false, message: "Cannot be negative", clampedValue: 0 };
                    return { valid: true };
                },
            },
            calculate: otherCredit,
            sankeySettings: {
                node: creditSankeyNode,
                link: [{ source: "input-credit-other", target: "federalTaxCredits", ...creditSankeyLink }],
            },
        },
    ];
}