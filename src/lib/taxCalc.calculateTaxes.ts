/**
 * Single entry point for federal + payroll modeling. Produces {@link TaxResult} consumed by the
 * summary table, Sankey, and Mekko; charts do not recompute tax—only layout and allocation rules.
 * 
 * This function accepts form information (TaxInput) and tax configuration (TaxYearConfig),
 * then calculates all tax items using a configurable pipeline.
 */
import { clampTaxInputToYearLimits } from "~/lib/taxCalc.clamp";
import { getTaxYearConfig } from "~/lib/taxData";
import { toTaxResult } from "~/lib/taxCalc.toTaxResult";
import { prepareScenarioAmounts } from "~/lib/taxCalc.scenarioAmounts";
import { computeFederalNiitLayer } from "~/lib/taxCalc.federalNiitLayer";
import { calculatePayrollTax, calculateSelfEmploymentTax } from "~/lib/taxCalc.payroll";
import { buildTaxWarnings } from "~/lib/taxCalc.warnings";
import { sumLabeledAmountSources } from "~/lib/taxCalc.labeledAmountSource";
import { TAX_RESULT_NOTES } from "~/lib/taxCalc.resultNotes.constants";
import type { TaxInput, TaxResult } from "~/lib/taxCalc.types";
import type { TaxYearConfig } from "~/lib/taxData.types";

export function calculateTaxes(rawInput: TaxInput, config?: TaxYearConfig): TaxResult | null {
  const input = clampTaxInputToYearLimits(rawInput);
  const taxConfig = config ?? getTaxYearConfig(input.taxYear);
  if (!taxConfig) {
    return null;
  }

  const p = prepareScenarioAmounts(input, taxConfig);

  const deductionKind = input.useItemizedDeductions ? "itemized" : "standard";
  const standardDeduction = taxConfig.standardDeduction[input.filingStatus];
  const itemizedDeductions = sumLabeledAmountSources(input.itemizedDeductions);
  const deductionAmount = deductionKind === "itemized" ? itemizedDeductions : standardDeduction;

  const fed = computeFederalNiitLayer(input, taxConfig, p, deductionAmount);

  const federalIncomeTaxBeforeCredits = fed.federalIncomeTax;
  const federalTaxCreditsEntered = sumLabeledAmountSources(input.federalTaxCredits);
  const federalTaxCreditsApplied = Math.min(federalTaxCreditsEntered, federalIncomeTaxBeforeCredits);
  const federalIncomeTaxAfterCredits = Math.max(0, federalIncomeTaxBeforeCredits - federalTaxCreditsApplied);

  const wagesForPayroll = Math.max(0, p.wageIncome - p.effective401 - p.effectiveHsa - p.effectiveOther);
  const { socialSecurityTax, medicareTax, payrollTax } = calculatePayrollTax(
    wagesForPayroll,
    input.taxYear,
    input.filingStatus,
  );

  const { selfEmploymentTax, netEarnings } = calculateSelfEmploymentTax(
    p.selfEmploymentIncome, // Already net from computePretaxIraSlice
    input.taxYear,
    input.filingStatus,
  );

  const takeHomePay = Math.max(
    0,
    p.totalIncome - p.preTaxTotal - federalIncomeTaxAfterCredits - payrollTax - selfEmploymentTax - p.effectiveIra,
  );
  const effectiveRateDenominator = Math.max(0, p.totalIncome - p.preTaxTotal - p.effectiveIra + netEarnings);
  const effectiveTaxRate =
    effectiveRateDenominator > 0
      ? (federalIncomeTaxAfterCredits + payrollTax + selfEmploymentTax) / effectiveRateDenominator
      : 0;

  const warnings = buildTaxWarnings({
    input,
    rawPretaxTotal: p.rawPretaxTotal,
    wageIncome: p.wageIncome,
    pretaxCapped401: p.pretaxCapped401,
    pretaxCappedHsa: p.pretaxCappedHsa,
    pretaxCappedIra: p.pretaxCappedIra,
    iraCappedByCompensation: p.iraCappedByCompensation,
    cap401: p.cap401,
    joint: p.joint,
    limHsaFamily: p.lim.hsaFamily,
    limHsaSelfOnly: p.lim.hsaSelfOnly,
    capIra: p.capIra,
    standardDeduction,
    itemizedDeductions,
    longTermCapitalGainsGrossIncome: p.longTermCapitalGainsGrossIncome,
    federalNetInvestmentIncomeTax: fed.federalNetInvestmentIncomeTax,
    federalIncomeTaxBeforeCredits,
    federalTaxCreditsEntered,
  });

  return toTaxResult({
    input,
    p,
    deductionKind,
    standardDeduction,
    deductionAmount,
    fed,
    federalIncomeTaxBeforeCredits,
    federalTaxCreditsEntered,
    federalTaxCreditsApplied,
    federalIncomeTaxAfterCredits,
    socialSecurityTax,
    medicareTax,
    payrollTax,
    selfEmploymentTax,
    takeHomePay,
    effectiveTaxRate,
    warnings,
    notes: TAX_RESULT_NOTES,
  });
}
