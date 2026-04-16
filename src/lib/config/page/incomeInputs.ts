/** Income inputs: W-2, 1099, STCG, LTCG, other ordinary. */
import type { FilingStatus, TaxYearConfig } from "~/lib/taxData.types";
import type { configItem } from "./pageConfig.types";

export function makeIncomeInputsConfig(_taxData: TaxYearConfig, _filingStatus: FilingStatus): configItem[] {
    return [
        {
            id: "input-wages",
            label: "W-2 Wages",
            shortLabel: "Wages",
            description: "Wages reported on Form W-2",
            taxTreatment: "ordinary",
            inputRowSettings: { 
                category: "income",
                displayOrder: 1, 
                inputType: "currency", 
                subcategories: [{ key: "input-wages-wages", labelSingle: "W-2 Wages", labelJoint: "W-2 Wages" }] 
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 1, col: 1 },
                link: [
                    { source: "input-wages", target: "pretaxDeductions", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)", row: 0, col: 1 },
                    { source: "input-wages", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 1, col: 1 },
                ],
            },
        },
        {
            id: "input-selfEmployment",
            label: "1099 Self-Employment",
            shortLabel: "1099 Income",
            description: "Self-employment income (net of expenses)",
            taxTreatment: "selfEmployment",
            inputRowSettings: { 
                category: "income",
                displayOrder: 2, 
                inputType: "currency", 
                subcategories: [{ key: "input-selfEmployment-selfEmployment", labelSingle: "1099 Self-Employment", labelJoint: "1099 Self-Employment" }] 
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 2, col: 1 },
                link: [
                    { source: "input-selfEmployment", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" , row: 2, col : 1 },
                ],
            },
        },
        {
            id: "input-shortTermCapGains",
            label: "Short-Term Capital Gains",
            shortLabel: "STCG",
            description: "Capital gains held one year or less",
            taxTreatment: "shortTermCapGains",
            inputRowSettings: { 
                category: "income",
                displayOrder: 3, 
                inputType: "currency", 
                subcategories: [{ key: "input-shortTermCapGains-shortTermCapGains", labelSingle: "Short-Term Capital Gains", labelJoint: "Short-Term Capital Gains" }] 
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 3, col: 1 },
                link: [
                    { source: "input-shortTermCapGains", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 3, col: 1 },
                ],
            },
        },
        {
            id: "input-ordinary",
            label: "Other Ordinary Income",
            shortLabel: "Other Income",
            description: "Other ordinary income (rent, royalties, etc.)",
            taxTreatment: "ordinary",
            inputRowSettings: { 
                category: "income",
                displayOrder: 5, 
                inputType: "currency", 
                subcategories: [{ key: "input-ordinary-ordinary", labelSingle: "Other Ordinary Income", labelJoint: "Other Ordinary Income" }] 
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)", row: 4, col: 1 },
                link: [
                    { source: "input-ordinary", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 4, col: 1 },
                ],
            },
        },
        {
            id: "input-longTermCapGains",
            label: "Long-Term Capital Gains",
            shortLabel: "LTCG",
            description: "Capital gains held longer than one year",
            taxTreatment: "longTermCapGains",
            inputRowSettings: { 
                category: "income",
                displayOrder: 4, 
                inputType: "currency", 
                subcategories: [{ key: "input-longTermCapGains-longTermCapGains", labelSingle: "Long-Term Capital Gains", labelJoint: "Long-Term Capital Gains" }] 
            },
            sankeySettings: {
                node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link)", row: 5, col: 1 },
                link: [
                    { source: "input-longTermCapGains", target: "longTermCapGains", fill: "var(--sankey-link)", stroke: "var(--sankey-link)", row: 4, col: 1 },
                ],
            },
        },
    ];
}