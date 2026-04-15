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
            inputRowSettings: { displayOrder: 1, inputType: "currency" },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "input-wages", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                    { source: "input-wages", target: "pretaxDeductions", fill: "var(--sankey-link-deferred)", stroke: "var(--sankey-link-deferred)" },
                ],
            },
        },
        {
            id: "input-selfEmployment",
            label: "1099 Self-Employment",
            shortLabel: "1099 Income",
            description: "Self-employment income (net of expenses)",
            taxTreatment: "selfEmployment",
            inputRowSettings: { displayOrder: 2, inputType: "currency" },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "input-selfEmployment", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
        {
            id: "input-shortTermCapGains",
            label: "Short-Term Capital Gains",
            shortLabel: "STCG",
            description: "Capital gains held one year or less",
            taxTreatment: "shortTermCapGains",
            inputRowSettings: { displayOrder: 3, inputType: "currency" },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "input-shortTermCapGains", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
        {
            id: "input-longTermCapGains",
            label: "Long-Term Capital Gains",
            shortLabel: "LTCG",
            description: "Capital gains held longer than one year",
            taxTreatment: "longTermCapGains",
            inputRowSettings: { displayOrder: 4, inputType: "currency" },
            sankeySettings: {
                node: { fill: "var(--sankey-node-ltcg)", stroke: "var(--sankey-link-ltcg)" },
                link: [
                    { source: "input-longTermCapGains", target: "longTermCapGains", fill: "var(--sankey-link-ltcg)", stroke: "var(--sankey-link-ltcg)" },
                ],
            },
        },
        {
            id: "input-ordinary",
            label: "Other Ordinary Income",
            shortLabel: "Other Income",
            description: "Other ordinary income (rent, royalties, etc.)",
            taxTreatment: "ordinary",
            inputRowSettings: { displayOrder: 5, inputType: "currency" },
            sankeySettings: {
                node: { fill: "var(--sankey-node-income)", stroke: "var(--sankey-link)" },
                link: [
                    { source: "input-ordinary", target: "wages", fill: "var(--sankey-link)", stroke: "var(--sankey-link)" },
                ],
            },
        },
    ];
}
