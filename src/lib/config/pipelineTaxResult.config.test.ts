import { describe, expect, it } from "vitest";
import type { TaxChartMetrics } from "~/lib/taxForm.types";
import {
  PIPELINE_COMPUTED_ROW_ORDER,
  PIPELINE_FLAT_SPECS,
  TAX_CHART_METRICS_KEYS,
} from "~/lib/config/pipelineTaxResult.config";

describe("pipelineTaxResult.config", () => {
  it("TAX_CHART_METRICS_KEYS lists each TaxChartMetrics key exactly once", () => {
    const keys = new Set<string>(TAX_CHART_METRICS_KEYS);
    expect(keys.size).toBe(TAX_CHART_METRICS_KEYS.length);

    type K = keyof TaxChartMetrics;
    const all: K[] = [
      "totalIncome",
      "wageIncome",
      "selfEmploymentIncome",
      "ordinaryGrossIncome",
      "shortTermCapGainsGrossIncome",
      "longTermCapitalGainsGrossIncome",
      "preTax401k",
      "preTaxHsa",
      "preTaxOther",
      "preTaxTotal",
      "traditionalIra",
      "wagesAfterPretax",
      "deductionKind",
      "standardDeduction",
      "deductionAmount",
      "deductionAllocatedToOrdinary",
      "deductionAllocatedToLongTermGross",
      "ordinaryTaxableIncome",
      "longTermTaxableIncome",
      "taxableIncome",
      "ordinaryFederalSegments",
      "longTermCapitalGainsSegments",
      "federalOrdinaryIncomeTax",
      "federalLongTermCapGainsTax",
      "federalNetInvestmentIncomeTax",
      "netInvestmentIncome",
      "federalIncomeTaxBeforeCredits",
      "federalTaxCredits",
      "federalTaxCreditsApplied",
      "federalIncomeTax",
      "payrollTax",
      "selfEmploymentTax",
      "socialSecurityTax",
      "medicareTax",
      "takeHomePay",
      "effectiveTaxRate",
    ];
    for (const k of all) {
      expect(keys.has(k), `missing ${k}`).toBe(true);
    }
  });

  it("PIPELINE_FLAT_SPECS covers every chart metric key", () => {
    const fromSpecs = new Set(PIPELINE_FLAT_SPECS.map((e) => e.key));
    for (const k of TAX_CHART_METRICS_KEYS) {
      expect(fromSpecs.has(k), `PIPELINE_FLAT_SPECS missing ${k}`).toBe(true);
    }
  });

  it("PIPELINE_COMPUTED_ROW_ORDER matches chart keys length and set", () => {
    expect(PIPELINE_COMPUTED_ROW_ORDER.length).toBe(TAX_CHART_METRICS_KEYS.length);
    const orderSet = new Set(PIPELINE_COMPUTED_ROW_ORDER);
    expect(orderSet.size).toBe(TAX_CHART_METRICS_KEYS.length);
    for (const k of TAX_CHART_METRICS_KEYS) {
      expect(orderSet.has(k)).toBe(true);
    }
  });
});
