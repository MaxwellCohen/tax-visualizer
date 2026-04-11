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
};

export function buildTaxWarnings(ctx: TaxWarningContext): string[] {
  const warnings: string[] = [];
  const money = taxCalcMoney;
  const { input } = ctx;

  if (ctx.rawPretaxTotal > 0 && ctx.wageIncome <= 0) {
    warnings.push(
      "Pre-tax payroll benefits only apply to W-2 wages in this model, so these entries have no effect without wage income.",
    );
  } else if (ctx.rawPretaxTotal > ctx.wageIncome && ctx.wageIncome > 0) {
    warnings.push(
      "Pre-tax payroll benefits exceed W-2 wages, so the app scaled those entries down proportionally.",
    );
  }

  if (ctx.pretaxCapped401 || ctx.pretaxCappedHsa) {
    warnings.push(
      ctx.pretaxCapped401 && ctx.pretaxCappedHsa
        ? `401(k) deferrals and HSA payroll amounts were capped at IRS limits for ${input.taxYear} (${money.format(ctx.cap401)} elective deferral per spouse; HSA ${ctx.joint ? `combined ${money.format(ctx.limHsaFamily)} for family HDHP` : `self-only HDHP up to ${money.format(ctx.limHsaSelfOnly)}`}). Age-50+ catch-up is not modeled.`
        : ctx.pretaxCapped401
          ? `401(k) deferrals were capped at the ${input.taxYear} IRS elective deferral limit (${money.format(ctx.cap401)} per spouse). Age-50+ catch-up is not modeled.`
          : `HSA payroll amounts were capped at the ${input.taxYear} IRS limit (${ctx.joint ? `${money.format(ctx.limHsaFamily)} combined for family HDHP` : `self-only HDHP up to ${money.format(ctx.limHsaSelfOnly)}`}).`,
    );
  }

  if (ctx.pretaxCappedIra) {
    warnings.push(
      `Traditional IRA amounts were capped at the ${input.taxYear} IRS contribution limit (${money.format(ctx.capIra)} per spouse under age 50). Age-50+ catch-up is not modeled.`,
    );
  }
  if (ctx.iraCappedByCompensation) {
    warnings.push(
      "Traditional IRA deduction was limited to modeled ordinary income (wages after payroll pre-tax, other ordinary income, and short-term gains); excess is not modeled as nondeductible IRA.",
    );
  }

  if (input.useItemizedDeductions && ctx.itemizedDeductions < ctx.standardDeduction) {
    warnings.push(
      `Your itemized deduction is below the ${money.format(ctx.standardDeduction)} standard deduction for this filing status and year, so a real return would usually prefer the standard deduction.`,
    );
  }

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

  return warnings;
}
