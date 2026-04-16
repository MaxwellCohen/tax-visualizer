import { describe, it, expect } from "vitest";
import { getLtcgBracketItems } from "./taxBracketNodes";
import type { TaxYearConfig, FilingStatus } from "~/lib/taxData.types";
import type { TaxFormRow, TaxFormData } from "~/lib/taxForm.types";
import { YEAR_VALUES_2026 } from "~/lib/config/yearValues/YEAR_VALUES_2026";
import { yearValuesToTaxYearConfig } from "~/lib/taxData.fromYearValues";
import { calculateTaxes } from "~/lib/taxCalc.calculateTaxes";

const taxData2026: TaxYearConfig = yearValuesToTaxYearConfig(YEAR_VALUES_2026, "planning");

function makeInputs(
    wages: number,
    ltcg: number,
    filingStatus: FilingStatus = "single"
): TaxFormRow[] {
    return [
        { type: "setting", id: "filingStatus", value: filingStatus },
        { type: "income", id: "wages-1", kind: "wages", label: "Salary", amount: wages },
        { type: "income", id: "ltcg-1", kind: "longTermCapGains", label: "Brokerage sale", amount: ltcg },
    ];
}

describe("getLtcgBracketItems", () => {
    it("calculates total LTCG income", () => {
        const items = getLtcgBracketItems(taxData2026, "single");
        const inputs = makeInputs(120000, 25000);
        
        const ltcgIncome = items.find(i => i.id === "ltcg-income");
        
        expect(ltcgIncome?.calculate?.(inputs, taxData2026, "single")).toBe(25000);
    });

    it("calculates LTCG tax using calculateLtcgTaxTotal", () => {
        const items = getLtcgBracketItems(taxData2026, "single");
        const inputs = makeInputs(120000, 25000);
        
        const ltcgTax = items.find(i => i.id === "ltcg-tax");
        
        // With $120k wages - standard deduction $16100 = $103900 taxable ordinary
        // Zero rate threshold is $49450, so all LTCG is in 15% bracket
        // $25,000 * 15% = $3,750
        expect(ltcgTax?.calculate?.(inputs, taxData2026, "single")).toBe(3750);
    });

    it("returns 0 when no LTCG", () => {
        const items = getLtcgBracketItems(taxData2026, "single");
        const inputs = makeInputs(120000, 0);
        
        const ltcgIncome = items.find(i => i.id === "ltcg-income");
        const ltcgTax = items.find(i => i.id === "ltcg-tax");
        
        expect(ltcgIncome?.calculate?.(inputs, taxData2026, "single")).toBe(0);
        expect(ltcgTax?.calculate?.(inputs, taxData2026, "single")).toBe(0);
    });

    it("handles married filing jointly", () => {
        const items = getLtcgBracketItems(taxData2026, "marriedJoint");
        const inputs = makeInputs(120000, 25000, "marriedJoint");
        
        const ltcgTax = items.find(i => i.id === "ltcg-tax");
        
        // With $120k wages - standard deduction $32200 = $87800 taxable ordinary
        // Zero rate threshold is $98900, so all LTCG is in 15% bracket
        // $25,000 * 15% = $3,750
        expect(ltcgTax?.calculate?.(inputs, taxData2026, "marriedJoint")).toBe(3750);
    });

    it("exactly matches the URL scenario", () => {
        const inputs: TaxFormRow[] = [
            { type: "setting", id: "taxYear", value: 2026 },
            { type: "setting", id: "filingStatus", value: "single" },
            { type: "income", id: "d7961f70-0cab-44c7-bc2a-8ecb247f7f5b", kind: "wages", label: "Salary", amount: 120000 },
            { type: "income", id: "ab23fb03-ae31-4748-a5ca-40a8d18ee78b", kind: "longTermCapGains", label: "Brokerage sale", amount: 25000 },
            { type: "setting", id: "useItemizedDeductions", value: false },
            { type: "deduction", id: "cc8ec310-93ed-4ac4-ae29-972793043382", kind: "otherItemized", label: "", amount: 0 },
            { type: "credit", id: "44b8dfb2-810e-411d-a08f-8232fad0c477", kind: "childTaxCredit", label: "", amount: 0 },
        ];
        
        const items = getLtcgBracketItems(taxData2026, "single");
        
        const ltcgIncome = items.find(i => i.id === "ltcg-income");
        const ltcgTax = items.find(i => i.id === "ltcg-tax");
        
        expect(ltcgIncome?.calculate?.(inputs, taxData2026, "single")).toBe(25000);
        expect(ltcgTax?.calculate?.(inputs, taxData2026, "single")).toBe(3750);
    });

    it("integrates with full tax calculation pipeline", () => {
        const formData: TaxFormData = {
            rows: [
                { type: "setting", id: "taxYear", value: 2026 },
                { type: "setting", id: "filingStatus", value: "single" },
                { type: "income", id: "wages-1", kind: "wages", label: "Salary", amount: 120000 },
                { type: "income", id: "ltcg-1", kind: "longTermCapGains", label: "Brokerage sale", amount: 25000 },
                { type: "setting", id: "useItemizedDeductions", value: false },
            ],
        };
        
        const result = calculateTaxes(formData);
        
        expect(result).not.toBeNull();
        
        const ltcgIncome = result?.metricLines?.find(l => l.metricsKey === "ltcg-income");
        const ltcgTax = result?.metricLines?.find(l => l.metricsKey === "ltcg-tax");
        
        console.log("=== Full Pipeline Results ===");
        console.log("All metricLines keys:", result?.metricLines?.map(l => l.metricsKey));
        console.log("LTCG income (metricLines):", ltcgIncome?.value);
        console.log("LTCG tax (metricLines):", ltcgTax?.value);
        
        expect(ltcgIncome?.value).toBe(25000);
        expect(ltcgTax?.value).toBe(3750);
    });
});
