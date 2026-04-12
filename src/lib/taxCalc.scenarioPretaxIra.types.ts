import type { TaxYearConfig } from "~/lib/taxData.types";

export type PretaxIraSlice = {
  joint: boolean;
  lim: TaxYearConfig["pretaxLimits"];
  pretaxCapped401: boolean;
  pretaxCappedHsa: boolean;
  pretaxCappedIra: boolean;
  iraCappedByCompensation: boolean;
  rawPretaxTotal: number;
  effective401: number;
  effectiveHsa: number;
  effectiveOther: number;
  preTaxTotal: number;
  wagesAfterPretax: number;
  ordinaryGrossForTax: number;
  /** Net self-employment earnings (after 92.35% adjustment). */
  selfEmploymentIncome: number;
  effectiveIra: number;
  nonInvestmentOrdinaryGross: number;
  nonInvestmentAfterIra: number;
  ordinaryAfterIra: number;
  cap401: number;
  capIra: number;
};
