/** Federal credit inputs: CTC, education, saver's credit, other. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import {
    childTaxCredit,
    educationCredits,
    retirementSavingsContributions,
    otherCredit,
} from "./pageConfig.inputs";
import { getCreditsSankeyRow, nonNegativeValidator, makeYearValuesCappedValidator } from "./pageConfig.helpers";

export function makeCreditInputsConfig(taxData: TaxYearConfig, filingStatus: FilingStatus): configItem[] {
    const row = getCreditsSankeyRow(taxData, filingStatus);
    const creditSankeyNode = { fill: "var(--sankey-node-credits)", stroke: "var(--sankey-link-credits)", row, col: 3 } as const;

    return [
        {
            id: "input-credit-childTax",
            label: "Child Tax Credit",
            shortLabel: "CTC",
            description:
                "Credit for qualifying children; maximum per child depends on tax year. Refundable amount may apply as Additional CTC (Schedule 8812).",
            kindDetail: {
                modelingNote:
                    "Nonrefundable portion offsets income tax; refundable Additional CTC has separate rules (earned income, etc.). Credit for other dependents uses a different maximum.",
            },
            inputRowSettings: {
                category: "credit",
                displayOrder: 1,
                inputType: "currency",
                subcategories: [
                    { key: "input-credit-childTax-childTax", labelSingle: "Child tax credit", labelJoint: "Child tax credit" },
                    { key: "input-credit-childTax-otherDependents", labelSingle: "Credit for other dependents", labelJoint: "Credit for other dependents" },
                ],
                validate: nonNegativeValidator,
            },
            calculate: childTaxCredit,
            sankeySettings: {
                node: creditSankeyNode,
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
                validate: nonNegativeValidator,
            },
            calculate: educationCredits,
            sankeySettings: {
                node: creditSankeyNode,
            },
        },
        {
            id: "retirementSavingsContributions",
            label: "Retirement Savings Contributions (Saver's Credit)",
            shortLabel: "Saver's Credit",
            description: "Saver's credit for eligible retirement contributions",
            kindDetail: {
                limitNote: "Up to $1,000 credit ($2,000 MFJ) at the maximum rate; percentage depends on AGI and filing status",
            },
            inputRowSettings: {
                category: "credit",
                displayOrder: 3,
                inputType: "currency",
                subcategories: [{ key: "retirementSavingsContributions-retirementSavingsContributions", labelSingle: "Retirement savings contributions (saver's) credit", labelJoint: "Retirement savings contributions (saver's) credit" }],
                getLimit: (yearValues) => yearValues.caps.credits["retirementSavingsContributions"] ?? 2000,
                validate: makeYearValuesCappedValidator("retirementSavingsContributions", 2000),
            },
            calculate: retirementSavingsContributions,
            sankeySettings: {
                node: creditSankeyNode,
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
                validate: nonNegativeValidator,
            },
            calculate: otherCredit,
            sankeySettings: {
                node: creditSankeyNode,
            },
        },
    ];
}