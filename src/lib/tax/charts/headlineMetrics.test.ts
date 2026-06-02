import { describe, expect, it } from "vitest";
import { calculateAllConfigValues } from "~/lib/tax/calc/calculateTaxes";
import { getTaxYearConfig } from "~/lib/tax/data/accessors.impl";
import type { TaxFormData } from "~/lib/tax/form/types";
import {
  headlineMetricsFromCalculatedConfig,
  totalModeledTaxes,
} from "./headlineMetrics";

const wagesOnlyMfj2026: TaxFormData = {
  rows: [
    { type: "setting", id: "taxYear", value: 2026 },
    { type: "setting", id: "filingStatus", value: "marriedJoint" },
    { type: "setting", id: "qualifyingChildren", value: 0 },
    { type: "setting", id: "otherDependents", value: 0 },
    {
      type: "income",
      id: "1",
      kind: "income-ordinary-wages-spouse1",
      label: "",
      amount: 162_000,
    },
    {
      type: "pretax",
      id: "2",
      kind: "input-pretax-401K-preTax401kSpouse1",
      label: "",
      amount: 0,
    },
    { type: "setting", id: "useItemizedDeductions", value: false },
    { type: "deduction", id: "3", kind: "deduction-salt-salt", label: "", amount: 0 },
    {
      type: "credit",
      id: "4",
      kind: "input-credit-other-otherFederalCredit",
      label: "",
      amount: 0,
    },
  ],
};

describe("headlineMetricsFromCalculatedConfig", () => {
  it("sums federal income and payroll taxes in the default headline", () => {
    const taxData = getTaxYearConfig(2026)!;
    const cc = calculateAllConfigValues(wagesOnlyMfj2026, taxData, "marriedJoint");
    const metrics = headlineMetricsFromCalculatedConfig(cc);
    const taxes = metrics[0];
    expect(taxes?.label).toBe("Federal income & payroll taxes");
    expect(taxes?.value).toBe(17_980 + 12_393);
    expect(totalModeledTaxes(cc, "allTaxes")).toBe(taxes?.value);
  });

  it("can show income tax only for withholding-style headlines", () => {
    const taxData = getTaxYearConfig(2026)!;
    const cc = calculateAllConfigValues(wagesOnlyMfj2026, taxData, "marriedJoint");
    const metrics = headlineMetricsFromCalculatedConfig(cc, { taxScope: "incomeOnly" });
    expect(metrics[0]?.value).toBe(17_980);
    expect(totalModeledTaxes(cc, "incomeOnly")).toBe(17_980);
  });
});
