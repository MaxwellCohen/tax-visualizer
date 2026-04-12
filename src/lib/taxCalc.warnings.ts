import type { TaxInput } from "~/lib/taxCalc.types";
import { taxCalcMoney } from "~/lib/taxCalc.money";

export type TaxWarningContext = {
  input: TaxInput;
  rawPretaxTotal: number;
  wageIncome: number;
  pretaxCapped401: boolean;
  pretaxCappedHsa: boolean;
  pretaxCappedIra: boolean;
  iraCappedByCompensation: boolean;
  cap401: number;
  joint: boolean;
  limHsaFamily: number;
  limHsaSelfOnly: number;
  capIra: number;
  standardDeduction: number;
  itemizedDeductions: number;
  longTermCapitalGainsGrossIncome: number;
  federalNetInvestmentIncomeTax: number;
  federalIncomeTaxBeforeCredits: number;
  federalTaxCreditsEntered: number;
};

function pushPretaxVersusWageWarnings(ctx: TaxWarningContext, out: string[]): void {
  if (ctx.rawPretaxTotal > 0 && ctx.wageIncome <= 0) {
    out.push(
      "Pre-tax payroll benefits only apply to W-2 wages in this model, so these entries have no effect without wage income.",
    );
    return;
  }
  if (ctx.rawPretaxTotal > ctx.wageIncome && ctx.wageIncome > 0) {
    out.push(
      "Pre-tax payroll benefits exceed W-2 wages, so the app scaled those entries down proportionally.",
    );
  }
}

function format401HsaCapMessage(ctx: TaxWarningContext): string {
  const { input } = ctx;
  const money = taxCalcMoney;
  if (ctx.pretaxCapped401 && ctx.pretaxCappedHsa) {
    const hsa = ctx.joint
      ? `combined ${money.format(ctx.limHsaFamily)} for family HDHP`
      : `self-only HDHP up to ${money.format(ctx.limHsaSelfOnly)}`;
    return `401(k) deferrals and HSA payroll amounts were capped at IRS limits for ${input.taxYear} (${money.format(ctx.cap401)} elective deferral per spouse; HSA ${hsa}). Age-50+ catch-up is not modeled.`;
  }
  if (ctx.pretaxCapped401) {
    return `401(k) deferrals were capped at the ${input.taxYear} IRS elective deferral limit (${money.format(ctx.cap401)} per spouse). Age-50+ catch-up is not modeled.`;
  }
  const hsaOnly = ctx.joint
    ? `${money.format(ctx.limHsaFamily)} combined for family HDHP`
    : `self-only HDHP up to ${money.format(ctx.limHsaSelfOnly)}`;
  return `HSA payroll amounts were capped at the ${input.taxYear} IRS limit (${hsaOnly}).`;
}

function push401HsaCapWarning(ctx: TaxWarningContext, out: string[]): void {
  if (!ctx.pretaxCapped401 && !ctx.pretaxCappedHsa) return;
  out.push(format401HsaCapMessage(ctx));
}

function pushItemizedVersusStandardWarning(ctx: TaxWarningContext, out: string[]): void {
  if (!ctx.input.useItemizedDeductions) return;
  if (ctx.itemizedDeductions >= ctx.standardDeduction) return;
  out.push(
    `Your itemized deduction is below the ${taxCalcMoney.format(ctx.standardDeduction)} standard deduction for this filing status and year, so a real return would usually prefer the standard deduction.`,
  );
}

export function buildTaxWarnings(ctx: TaxWarningContext): string[] {
  const warnings: string[] = [];
  const { input } = ctx;

  pushPretaxVersusWageWarnings(ctx, warnings);
  push401HsaCapWarning(ctx, warnings);

  if (ctx.pretaxCappedIra) {
    warnings.push(
      `Traditional IRA amounts were capped at the ${input.taxYear} IRS contribution limit (${taxCalcMoney.format(ctx.capIra)} per spouse under age 50). Age-50+ catch-up is not modeled.`,
    );
  }
  if (ctx.iraCappedByCompensation) {
    warnings.push(
      "Traditional IRA deduction was limited to modeled ordinary income (wages after payroll pre-tax, other ordinary income, and short-term gains); excess is not modeled as nondeductible IRA.",
    );
  }

  pushItemizedVersusStandardWarning(ctx, warnings);

  if (ctx.longTermCapitalGainsGrossIncome > 0) {
    warnings.push(
      "Long-term capital gains use a simplified 0% / 15% / 20% stacking worksheet here and do not model qualified-dividend or special-gain edge cases.",
    );
  }

  if (ctx.federalNetInvestmentIncomeTax > 0) {
    warnings.push(
      "Net investment income tax (NIIT) is estimated from short- and long-term gains only (Form 8960 is simplified; MAGI excludes some real-world adjustments).",
    );
  }

  if (
    ctx.federalTaxCreditsEntered > ctx.federalIncomeTaxBeforeCredits &&
    ctx.federalIncomeTaxBeforeCredits >= 0
  ) {
    warnings.push(
      `Federal credits (${taxCalcMoney.format(ctx.federalTaxCreditsEntered)}) exceed modeled federal income tax before credits (${taxCalcMoney.format(ctx.federalIncomeTaxBeforeCredits)}); excess nonrefundable credits are not modeled as a cash refund.`,
    );
  }

  return warnings;
}
