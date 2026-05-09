/** Income inputs: W-2, 1099, STCG, LTCG, other ordinary. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";
import { nonNegativeValidator } from "./pageConfig.helpers";

export function makeIncomeInputsConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "income-ordinary-wages",
            label: "W-2 Wages",
            shortLabel: "Wages",
            description: "Wages reported on Form W-2",
            taxTreatment: "ordinary",
            inputRowSettings: { 
                category: "income",
                displayOrder: 1, 
                inputType: "currency", 
                subcategories: [
                    { key: "income-ordinary-wages-spouse1", labelSingle: "W-2 Wages", labelJoint: "W-2 Wages (spouse 1)" },
                    { key: "income-ordinary-wages-spouse2", labelSingle: "W-2 Wages (2)", labelJoint: "W-2 Wages (spouse 2)" },
                ],
                validate: nonNegativeValidator,
            },
        },
        {
            id: "income-ordinary-selfEmployment",
            label: "1099 Self-Employment",
            shortLabel: "1099 Income",
            description: "Self-employment income (net of expenses)",
            taxTreatment: "selfEmployment",
            inputRowSettings: { 
                category: "income",
                displayOrder: 2, 
                inputType: "currency", 
                subcategories: [
                    { key: "income-ordinary-selfEmployment-selfEmployment-spouse1", labelSingle: "1099 Self-Employment", labelJoint: "1099 Self-Employment (spouse 1)" },
                    { key: "income-ordinary-selfEmployment-selfEmployment-spouse2", labelSingle: "1099 Self-Employment (2)", labelJoint: "1099 Self-Employment (spouse 2)" },
                ],
                validate: nonNegativeValidator,
            },
        },
        {
            id: "income-ordinary-shortTermCapGains",
            label: "Short-Term Capital Gains",
            shortLabel: "STCG",
            description: "Capital gains held one year or less",
            taxTreatment: "shortTermCapGains",
            inputRowSettings: { 
                category: "income",
                displayOrder: 3, 
                inputType: "currency", 
                subcategories: [
                    { key: "income-ordinary-shortTermCapGains-shortTermCapGains-spouse1", labelSingle: "Short-Term Capital Gains", labelJoint: "Short-Term Capital Gains (spouse 1)" },
                    { key: "income-ordinary-shortTermCapGains-shortTermCapGains-spouse2", labelSingle: "Short-Term Capital Gains (2)", labelJoint: "Short-Term Capital Gains (spouse 2)" },
                ],
                validate: nonNegativeValidator,
            },
        },
        {
            id: "income-ordinary-other",
            label: "Other Ordinary Income",
            shortLabel: "Other Income",
            description: "Other ordinary income (rent, royalties, etc.)",
            taxTreatment: "ordinary",
            inputRowSettings: { 
                category: "income",
                displayOrder: 5, 
                inputType: "currency", 
                subcategories: [
                    { key: "income-ordinary-other-other-spouse1", labelSingle: "Other Ordinary Income", labelJoint: "Other Ordinary Income (spouse 1)" },
                    { key: "income-ordinary-other-other-spouse2", labelSingle: "Other Ordinary Income (2)", labelJoint: "Other Ordinary Income (spouse 2)" },
                ],
                validate: nonNegativeValidator,
            },
        },
        {
            id: "income-longTermCapGains",
            label: "Long-Term Capital Gains",
            shortLabel: "LTCG",
            description: "Capital gains held longer than one year",
            taxTreatment: "longTermCapGains",
            inputRowSettings: { 
                category: "income",
                displayOrder: 4, 
                inputType: "currency", 
                subcategories: [
                    { key: "income-longTermCapGains-longTermCapGains-spouse1", labelSingle: "Long-Term Capital Gains", labelJoint: "Long-Term Capital Gains (spouse 1)" },
                    { key: "income-longTermCapGains-longTermCapGains-spouse2", labelSingle: "Long-Term Capital Gains (2)", labelJoint: "Long-Term Capital Gains (spouse 2)" },
                ],
                validate: nonNegativeValidator,
            },
        },
    ];
}