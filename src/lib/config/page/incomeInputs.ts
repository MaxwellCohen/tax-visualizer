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
                subcategories: [{ key: "income-ordinary-wages", labelSingle: "W-2 Wages", labelJoint: "W-2 Wages" }],
                validate: nonNegativeValidator,
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 1, col: 1 },
                link: [
                    { source: "income-ordinary-wages", target: "pretaxDeductions", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 0, col: 1 },
                    { source: "income-ordinary-wages", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 1, col: 1 },
                ],
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
                subcategories: [{ key: "income-ordinary-selfEmployment-selfEmployment", labelSingle: "1099 Self-Employment", labelJoint: "1099 Self-Employment" }],
                validate: nonNegativeValidator,
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 2, col: 1 },
                link: [
                    { source: "income-ordinary-selfEmployment", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" , row: 2, col : 1 },
                ],
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
                subcategories: [{ key: "income-ordinary-shortTermCapGains-shortTermCapGains", labelSingle: "Short-Term Capital Gains", labelJoint: "Short-Term Capital Gains" }],
                validate: nonNegativeValidator,
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 3, col: 1 },
                link: [
                    { source: "income-ordinary-shortTermCapGains", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 3, col: 1 },
                ],
            },
        },
        {
            id: "income-ordinary",
            label: "Other Ordinary Income",
            shortLabel: "Other Income",
            description: "Other ordinary income (rent, royalties, etc.)",
            taxTreatment: "ordinary",
            inputRowSettings: { 
                category: "income",
                displayOrder: 5, 
                inputType: "currency", 
                subcategories: [{ key: "income-ordinary-ordinary", labelSingle: "Other Ordinary Income", labelJoint: "Other Ordinary Income" }],
                validate: nonNegativeValidator,
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 4, col: 1 },
                link: [
                    { source: "income-ordinary", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 4, col: 1 },
                ],
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
                subcategories: [{ key: "income-longTermCapGains-longTermCapGains", labelSingle: "Long-Term Capital Gains", labelJoint: "Long-Term Capital Gains" }],
                validate: nonNegativeValidator,
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link)", row: 5, col: 1 },
                link: [
                    { source: "income-longTermCapGains", target: "longTermCapGains", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 4, col: 1 },
                ],
            },
        },
    ];
}