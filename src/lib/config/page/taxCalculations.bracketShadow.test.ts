import { describe, expect, it } from "vitest";
import { getOrdinaryBrackets } from "~/lib/config/page/pageConfig.helpers";
import {
    calculateTaxableIncome,
    ordinaryIncomeSlicesWithPayrollShadow,
} from "~/lib/config/page/taxCalculations";
import { getTaxYearConfig } from "~/lib/taxData";
import { baseInput, withPretaxTotals } from "~/lib/taxCalc.test.helpers";
import { incomeSourcesToRows } from "~/lib/taxForm.factories";

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
});
