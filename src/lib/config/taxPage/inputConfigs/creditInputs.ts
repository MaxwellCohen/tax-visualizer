/** Federal credit inputs: CTC, education, saver's credit, other. */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";
import {
    childTaxCredit,
    educationCredits,
    retirementSavingsContributions,
    otherCredit,
} from "../rowMetrics";
import { nonNegativeValidator, makeYearValuesCappedValidator } from "../inputValidators";
import { getCreditsSankeyRow } from "../sankey/sankeyLayout.helpers";

export function makeCreditInputsConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): ConfigItem[] {
    const row = getCreditsSankeyRow(taxData, filingStatus);
    const creditSankeyNode = { row, col: 3 } as const;

    return [
        {
            id: "input-credit-childTax",
            chartStyle: { fill: "var(--chart-credit)", stroke: "var(--sankey-link-credits)" },
            labels: { default: "Child Tax Credit", compact: "CTC" },
            description:
                "Calculated from qualifying children and other dependents entered in Settings; maximum per dependent depends on tax year.",
            kindDetail: {
                modelingNote:
                    "Nonrefundable portion offsets income tax; refundable Additional CTC, earned income tests, and phase-outs are not modeled.",
            },
            calculate: childTaxCredit,
            sankey: {
                node: creditSankeyNode,
            },
        },
        {
            id: "input-credit-education",
            chartStyle: { fill: "var(--chart-credit)", stroke: "var(--sankey-link-credits)" },
            labels: { default: "Education Credits", compact: "Education" },
            description: "American opportunity credit and/or lifetime learning credit",
            kindDetail: {
                modelingNote: "AOC (up to $2500 per student) or LLC (up to $2000 per return)",
            },
            input: {
                category: "credit",
                displayOrder: 2,
                inputType: "currency",
                subcategories: [{ key: "input-credit-education-education", labelSingle: "Education credits (AOTC / LLC)", labelJoint: "Education credits (AOTC / LLC)" }],
                validate: nonNegativeValidator,
            },
            calculate: educationCredits,
            sankey: {
                node: creditSankeyNode,
            },
        },
        {
            id: "retirementSavingsContributions",
            chartStyle: { fill: "var(--chart-credit)", stroke: "var(--sankey-link-credits)" },
            labels: { default: "Retirement Savings Contributions (Saver's Credit)", compact: "Saver's Credit" },
            description: "Saver's credit for eligible retirement contributions",
            kindDetail: {
                limitNote: "Up to $1,000 credit ($2,000 MFJ) at the maximum rate; percentage depends on AGI and filing status",
            },
            input: {
                category: "credit",
                displayOrder: 3,
                inputType: "currency",
                subcategories: [{ key: "retirementSavingsContributions-retirementSavingsContributions", labelSingle: "Retirement savings contributions (saver's) credit", labelJoint: "Retirement savings contributions (saver's) credit" }],
                getLimit: (yearValues) => yearValues.caps.credits["retirementSavingsContributions"] ?? 2000,
                validate: makeYearValuesCappedValidator("retirementSavingsContributions", 2000),
            },
            calculate: retirementSavingsContributions,
            sankey: {
                node: creditSankeyNode,
            },
        },
        {
            id: "input-credit-other",
            chartStyle: { fill: "var(--chart-credit)", stroke: "var(--sankey-link-credits)" },
            labels: { default: "Other Federal Credit", compact: "Other" },
            description: "Any other federal income tax credit",
            kindDetail: {
                modelingNote: "Miscellaneous federal credits",
            },
            input: {
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
                validate: nonNegativeValidator,
            },
            calculate: otherCredit,
            sankey: {
                node: creditSankeyNode,
            },
        },
    ];
}