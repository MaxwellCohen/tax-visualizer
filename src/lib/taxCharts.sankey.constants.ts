import type { IncomeKind } from "~/lib/taxCalc.types";
import { INCOME_KIND_CHART_ORDER_BY_KIND } from "~/lib/config/sankeyOrder.config";

export { INCOME_KIND_CHART_ORDER_BY_KIND };

export const SANKEY_IDS = {
  ordinaryTaxableIncome: "ordinary-taxable-income",
  /** Sibling of ordinary rate brackets: payroll tax (FICA) attributed to ordinary taxable income. */
  payrollOrdinaryStrip: "payroll-ordinary-strip",
  longTermTaxableIncome: "long-term-taxable-income",
  /** LTCG gross offset by the deduction (not run from LTCG income rows into the deduction bar). */
  ltcgDeductionShield: "ltcg-deduction-shield",
  /** Federal income tax + NIIT (after credits) attributed from brackets. */
  taxesFederal: "taxes-federal",
  /** Social Security + Medicare (and add-on Medicare) from wages. */
  taxesPayroll: "taxes-payroll",
  federalCredits: "federal-credits",
  keep: "keep",
  /** Itemized-only terminal from `deduction-shield` (accounting; standard deduction flows to `keep`). */
  deductionBenefitSink: "deduction-benefit-sink",
} as const;
