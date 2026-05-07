import { describe, expect, it } from "vitest";
import { getOrdinaryBrackets } from "~/lib/config/page/pageConfig.helpers";
import {
    calculateOrdinaryTaxWithPayrollShadow,
    calculateTaxableIncome,
    computeDeductionShieldSlice,
    ordinaryIncomeSlicesWithPayrollShadow,
    sankeyOrdinaryTaxableIncomeHubInflow,
} from "~/lib/config/page/taxCalculations";
import { getTaxYearConfig } from "~/lib/taxData";
import { baseInput, withPretaxTotals } from "~/lib/taxCalc.test.helpers";
import { incomeSourcesToRows, newDeductionRow } from "~/lib/taxForm.factories";

describe("payroll bracket shadow", () => {
    it("wage + large SE: excess payroll over standard consumes 10% band and part of 12%", () => {
        const data = baseInput({
            taxYear: 2026,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 90_000 },
                {
                    id: "se",
                    kind: "income-ordinary-selfEmployment-selfEmployment",
                    label: "",
                    amount: 160_000,
                },
            ]),
            pretaxRows: withPretaxTotals({ "input-pretax-401K-preTax401kSpouse1": 0 }),
        });
        const config = getTaxYearConfig(2026);
        expect(config).toBeDefined();
        const ti = calculateTaxableIncome(data.rows, config!, "single");
        const brackets = getOrdinaryBrackets(config!, "single");
        const slices = ordinaryIncomeSlicesWithPayrollShadow(
            ti.ordinary,
            brackets,
            ti.payrollBracketShadowFill,
        );
        expect(ti.payrollBracketShadowFill).toBeGreaterThan(0);
        expect(slices[0]).toBe(0);
        expect(slices[1]).toBeLessThan(Math.min(ti.ordinary, 50_400 - 12_400));
    });

    it("high wage + low itemized: shadow clears bottom bracket; slices sum to ordinary; tax equals slice-weighted sum; sankey hub matches slice components", () => {
        const data = baseInput({
            taxYear: 2026,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "", amount: 800_000 },
            ]),
            useItemizedDeductions: true,
            /** Low itemized so payroll − shield exceeds the first bracket width (~12.4k for 2026 single). */
            deductionRows: [newDeductionRow({ amount: 10_000 })],
        });
        const config = getTaxYearConfig(2026);
        expect(config).toBeDefined();
        const ti = calculateTaxableIncome(data.rows, config!, "single");
        const brackets = getOrdinaryBrackets(config!, "single");
        const slices = ordinaryIncomeSlicesWithPayrollShadow(
            ti.ordinary,
            brackets,
            ti.payrollBracketShadowFill,
        );
        const { tax } = calculateOrdinaryTaxWithPayrollShadow(ti.ordinary, brackets, ti.payrollBracketShadowFill);
        const taxFromSlices = slices.reduce((acc, inc, i) => acc + inc * brackets[i].rate, 0);

        expect(ti.payrollBracketShadowFill).toBeGreaterThan(0);
        expect(slices[0]).toBe(0);
        expect(slices.reduce((a, b) => a + b, 0)).toBeCloseTo(ti.ordinary, 5);
        expect(taxFromSlices).toBeCloseTo(tax, 5);
        expect(tax).toBeGreaterThan(0);

        const hub = sankeyOrdinaryTaxableIncomeHubInflow(data.rows, config!, "single");
        const shieldSlice = computeDeductionShieldSlice(data.rows, config!, "single");
        expect(hub).toBeCloseTo(shieldSlice.payrollTaxTotal + shieldSlice.deduction + shieldSlice.ordinary, 5);
    });
});
