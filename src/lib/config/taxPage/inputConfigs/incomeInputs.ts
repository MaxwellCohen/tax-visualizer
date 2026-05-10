/** Income inputs: W-2, 1099, STCG, LTCG, other ordinary. */
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";
import type { ConfigItem } from "../types";
import { nonNegativeValidator } from "../inputValidators";

export function makeIncomeInputsConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): ConfigItem[] {
    return [
        {
            id: "income-ordinary-wages",
            labels: { default: "W-2 Wages", compact: "Wages" },
            description: "Wages reported on Form W-2",
            taxTreatment: "ordinary",
            input: { 
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
            labels: { default: "1099 Self-Employment", compact: "1099 Income" },
            description: "Self-employment income (net of expenses)",
            taxTreatment: "selfEmployment",
            input: { 
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
            labels: { default: "Short-Term Capital Gains", compact: "STCG" },
            description: "Capital gains held one year or less",
            taxTreatment: "shortTermCapGains",
            input: { 
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
            labels: { default: "Other Ordinary Income", compact: "Other Income" },
            description: "Other ordinary income (rent, royalties, etc.)",
            taxTreatment: "ordinary",
            input: { 
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
            labels: { default: "Long-Term Capital Gains", compact: "LTCG" },
            description: "Capital gains held longer than one year",
            taxTreatment: "longTermCapGains",
            input: { 
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