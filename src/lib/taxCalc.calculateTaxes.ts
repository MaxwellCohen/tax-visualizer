import { getTaxYearConfig } from "~/lib/taxData";
import { buildTaxWarnings } from "~/lib/taxCalc.warnings";
import { calculatePayrollTax } from "~/lib/taxCalc.payroll";
import { prepareScenarioAmounts } from "~/lib/taxCalc.scenarioAmounts";
import { computeFederalNiitLayer } from "~/lib/taxCalc.federalNiitLayer";
import { toTaxResult } from "~/lib/taxCalc.toTaxResult";
import { toMoneyValue } from "~/lib/taxCalc.money";
import { TAX_RESULT_NOTES } from "~/lib/taxCalc.resultNotes.constants";
import type { TaxInput, TaxResult } from "~/lib/taxCalc.types";

export function calculateTaxes(input: TaxInput): TaxResult | null {
  const config = getTaxYearConfig(input.taxYear);
  if (!config) {
    return null;
  }

  const p = prepareScenarioAmounts(input, config);

  const deductionKind = input.useItemizedDeductions ? "itemized" : "standard";
  const standardDeduction = config.standardDeduction[input.filingStatus];
  const itemizedDeductions = toMoneyValue(input.itemizedDeductions);
  const deductionAmount = deductionKind === "itemized" ? itemizedDeductions : standardDeduction;

  const fed = computeFederalNiitLayer(input, config, p, deductionAmount);

  const wagesForPayroll = Math.max(0, p.wageIncome - p.effective401 - p.effectiveHsa - p.effectiveOther);
  const { socialSecurityTax, medicareTax, payrollTax } = calculatePayrollTax(
    wagesForPayroll,
    input.taxYear,
    input.filingStatus,
  );

  const takeHomePay = Math.max(
    0,
    p.totalIncome - p.preTaxTotal - fed.federalIncomeTax - payrollTax - p.effectiveIra,
  );
  const effectiveTaxRate = p.totalIncome > 0 ? (fed.federalIncomeTax + payrollTax) / p.totalIncome : 0;

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
  });

  return toTaxResult({
    input,
    p,
    deductionKind,
    standardDeduction,
    deductionAmount,
    fed,
    socialSecurityTax,
    medicareTax,
    payrollTax,
    takeHomePay,
    effectiveTaxRate,
    warnings,
    notes: TAX_RESULT_NOTES,
  });
}
