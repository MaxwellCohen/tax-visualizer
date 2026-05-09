import { describe, expect, it } from "vitest";
import {
    calculatePayrollTaxBreakdown,
    calculateTaxableIncome,
    computeFederalTaxCreditsApplied,
    getOrdinaryBrackets,
    ordinaryIncomeSlicesWithPayrollShadow,
    
} from "~/lib/config/page/taxCalculations";
import { childTaxCredit } from "~/lib/config/page/pageConfig.inputs";
import { getTaxYearConfig } from "~/lib/taxData";
import { baseInput, withPretaxTotals } from "~/lib/taxCalc.test.helpers";
import { incomeSourcesToRows } from "~/lib/taxForm.factories";

describe("wage payroll tax", () => {
    it("calculates married joint Social Security tax per spouse", () => {
        const config = getTaxYearConfig(2025);
        expect(config).toBeDefined();
        const spouse1Wages = config!.payroll.socialSecurityWageBase + 20_000;
        const spouse2Wages = config!.payroll.socialSecurityWageBase + 10_000;
        const data = baseInput({
            taxYear: 2025,
            filingStatus: "marriedJoint",
            incomeRows: incomeSourcesToRows([
                { id: "w1", kind: "income-ordinary-wages-spouse1", label: "Spouse 1", amount: spouse1Wages },
                { id: "w2", kind: "income-ordinary-wages-spouse2", label: "Spouse 2", amount: spouse2Wages },
            ]),
        });

        const payroll = calculatePayrollTaxBreakdown(data.rows, config!, "marriedJoint");

        expect(payroll.socialSecurityTax).toBeCloseTo(
            config!.payroll.socialSecurityWageBase * 2 * config!.payroll.socialSecurityRate,
            5,
        );
        expect(payroll.medicareTax).toBeCloseTo((spouse1Wages + spouse2Wages) * config!.payroll.medicareRate, 5);
        expect(payroll.total).toBeCloseTo(payroll.socialSecurityTax + payroll.medicareTax, 5);
    });

    it("keeps legacy aggregate wage rows taxable as spouse 1 wages", () => {
        const config = getTaxYearConfig(2025);
        expect(config).toBeDefined();
        const wages = config!.payroll.socialSecurityWageBase + 20_000;
        const data = baseInput({
            taxYear: 2025,
            filingStatus: "marriedJoint",
            incomeRows: incomeSourcesToRows([
                { id: "w", kind: "income-ordinary-wages", label: "Wages", amount: wages },
            ]),
        });

        const payroll = calculatePayrollTaxBreakdown(data.rows, config!, "marriedJoint");

        expect(payroll.socialSecurityTax).toBeCloseTo(
            config!.payroll.socialSecurityWageBase * config!.payroll.socialSecurityRate,
            5,
        );
        expect(payroll.medicareTax).toBeCloseTo(wages * config!.payroll.medicareRate, 5);
    });

    it("keeps non-joint wage payroll tax aggregated", () => {
        const config = getTaxYearConfig(2025);
        expect(config).toBeDefined();
        const spouse1Wages = 120_000;
        const spouse2Wages = 80_000;
        const data = baseInput({
            taxYear: 2025,
            filingStatus: "single",
            incomeRows: incomeSourcesToRows([
                { id: "w1", kind: "income-ordinary-wages-spouse1", label: "Wages 1", amount: spouse1Wages },
                { id: "w2", kind: "income-ordinary-wages-spouse2", label: "Wages 2", amount: spouse2Wages },
            ]),
        });

        const payroll = calculatePayrollTaxBreakdown(data.rows, config!, "single");
        const totalWages = spouse1Wages + spouse2Wages;

        expect(payroll.socialSecurityTax).toBeCloseTo(
            Math.min(totalWages, config!.payroll.socialSecurityWageBase) * config!.payroll.socialSecurityRate,
            5,
        );
        expect(payroll.medicareTax).toBeCloseTo(totalWages * config!.payroll.medicareRate, 5);
    });
});

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

describe("dependent credits", () => {
    it("calculates child tax credit from dependent settings and tax-year defaults", () => {
        const config = getTaxYearConfig(2026);
        expect(config).toBeDefined();
        const data = baseInput({
            taxYear: 2026,
            qualifyingChildren: 2,
            otherDependents: 1,
        });

        expect(childTaxCredit(data.rows, config!)).toBe(
            (2 * config!.federalTaxCreditDefaults.childTaxCredit) +
            config!.federalTaxCreditDefaults.creditForOtherDependents,
        );
    });

    it("applies dependent credits against federal income tax", () => {
        const config = getTaxYearConfig(2025);
        expect(config).toBeDefined();
        const withoutDependents = baseInput({ taxYear: 2025 });
        const withDependents = baseInput({
            taxYear: 2025,
            qualifyingChildren: 1,
            otherDependents: 1,
        });

        const appliedWithoutDependents = computeFederalTaxCreditsApplied(withoutDependents.rows, config!, "single");
        const appliedWithDependents = computeFederalTaxCreditsApplied(withDependents.rows, config!, "single");

        expect(appliedWithDependents - appliedWithoutDependents).toBe(
            config!.federalTaxCreditDefaults.childTaxCredit +
            config!.federalTaxCreditDefaults.creditForOtherDependents,
        );
    });
});
