import type { AggregatedPretax } from "~/lib/taxCalc.pretaxBenefitSource";
import { aggregatePretaxFromSources } from "~/lib/taxCalc.pretaxBenefitSource";
import type { TaxInput } from "~/lib/taxCalc.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { toMoneyValue } from "~/lib/taxCalc.money";
import type { IncomeTotals } from "~/lib/taxCalc.scenarioAmountsIncome";
import type { PretaxIraSlice } from "~/lib/taxCalc.scenarioPretaxIra.types";

type Pretax401HsaScaled = {
  pretaxCapped401: boolean;
  pretaxCappedHsa: boolean;
  rawPretaxTotal: number;
  effective401: number;
  effectiveHsa: number;
  effectiveOther: number;
  preTaxTotal: number;
  wagesAfterPretax: number;
  ordinaryGrossForTax: number;
};

function computeScaled401HsaAndOrdinaryBase(
  pt: AggregatedPretax,
  lim: TaxYearConfig["pretaxLimits"],
  inc: IncomeTotals,
  joint: boolean,
): Pretax401HsaScaled {
  const { wageIncome, ordinaryGrossIncome } = inc;
  const cap401 = lim.electiveDeferral401k;
  const uncapped401_1 = toMoneyValue(pt.preTax401kSpouse1);
  const uncapped401_2 = joint ? toMoneyValue(pt.preTax401kSpouse2) : 0;
  const uncappedHsa_1 = toMoneyValue(pt.preTaxHsaSpouse1);
  const uncappedHsa_2 = joint ? toMoneyValue(pt.preTaxHsaSpouse2) : 0;

  const raw401_1 = Math.min(uncapped401_1, cap401);
  const raw401_2 = joint ? Math.min(uncapped401_2, cap401) : 0;
  const raw401 = raw401_1 + raw401_2;

  const uncappedHsaTotal = uncappedHsa_1 + (joint ? uncappedHsa_2 : 0);
  const rawHsa = joint
    ? Math.min(uncappedHsaTotal, lim.hsaFamily)
    : Math.min(uncappedHsa_1, lim.hsaSelfOnly);

  const pretaxCapped401 = uncapped401_1 > cap401 || (joint && uncapped401_2 > cap401);
  const pretaxCappedHsa = joint
    ? uncappedHsaTotal > lim.hsaFamily
    : uncappedHsa_1 > lim.hsaSelfOnly;

  const rawOther = toMoneyValue(pt.preTaxOther);
  const rawPretaxTotal = raw401 + rawHsa + rawOther;
  const pretaxScale = wageIncome <= 0 ? 0 : rawPretaxTotal > wageIncome ? wageIncome / rawPretaxTotal : 1;
  const effective401 = raw401 * pretaxScale;
  const effectiveHsa = rawHsa * pretaxScale;
  const effectiveOther = rawOther * pretaxScale;
  const preTaxTotal = effective401 + effectiveHsa + effectiveOther;
  const wagesAfterPretax = Math.max(0, wageIncome - preTaxTotal);
  const ordinaryGrossForTax = wagesAfterPretax + (ordinaryGrossIncome - wageIncome);

  return {
    pretaxCapped401,
    pretaxCappedHsa,
    rawPretaxTotal,
    effective401,
    effectiveHsa,
    effectiveOther,
    preTaxTotal,
    wagesAfterPretax,
    ordinaryGrossForTax,
  };
}

type IraSlicePart = {
  pretaxCappedIra: boolean;
  effectiveIra: number;
  iraCappedByCompensation: boolean;
  nonInvestmentOrdinaryGross: number;
  nonInvestmentAfterIra: number;
  ordinaryAfterIra: number;
  cap401: number;
  capIra: number;
};

function computeIraSlicePart(
  pt: AggregatedPretax,
  lim: TaxYearConfig["pretaxLimits"],
  inc: IncomeTotals,
  joint: boolean,
  ordinaryGrossForTax: number,
  wagesAfterPretax: number,
): IraSlicePart {
  const { sources, shortTermCapGainsGrossIncome } = inc;
  const cap401 = lim.electiveDeferral401k;
  const capIra = lim.traditionalIraContribution;
  const uncappedIra1 = toMoneyValue(pt.traditionalIraSpouse1);
  const uncappedIra2 = joint ? toMoneyValue(pt.traditionalIraSpouse2) : 0;
  const rawIra1 = Math.min(uncappedIra1, capIra);
  const rawIra2 = joint ? Math.min(uncappedIra2, capIra) : 0;
  const rawIraSum = rawIra1 + rawIra2;
  const pretaxCappedIra = uncappedIra1 > capIra || (joint && uncappedIra2 > capIra);
  const effectiveIra = Math.min(rawIraSum, ordinaryGrossForTax);
  const iraCappedByCompensation = rawIraSum > ordinaryGrossForTax && ordinaryGrossForTax >= 0;

  const nonInvestmentOrdinaryGross =
    wagesAfterPretax + sources.filter(s => s.kind === "ordinary").reduce((s, x) => s + x.amount, 0);
  let iraRem = effectiveIra;
  const iraFromNonInv = Math.min(iraRem, nonInvestmentOrdinaryGross);
  iraRem -= iraFromNonInv;
  const iraFromStcg = Math.min(iraRem, shortTermCapGainsGrossIncome);
  const nonInvestmentAfterIra = nonInvestmentOrdinaryGross - iraFromNonInv;
  const ordinaryAfterIra = nonInvestmentAfterIra + (shortTermCapGainsGrossIncome - iraFromStcg);

  return {
    pretaxCappedIra,
    effectiveIra,
    iraCappedByCompensation,
    nonInvestmentOrdinaryGross,
    nonInvestmentAfterIra,
    ordinaryAfterIra,
    cap401,
    capIra,
  };
}

export function computePretaxIraSlice(
  input: TaxInput,
  config: TaxYearConfig,
  inc: IncomeTotals,
): PretaxIraSlice {
  const joint = input.filingStatus === "marriedJoint";
  const lim = config.pretaxLimits;
  const pt = aggregatePretaxFromSources(input.pretaxBenefitSources, joint);

  const scaled = computeScaled401HsaAndOrdinaryBase(pt, lim, inc, joint);
  const ira = computeIraSlicePart(pt, lim, inc, joint, scaled.ordinaryGrossForTax, scaled.wagesAfterPretax);

  return {
    joint,
    lim,
    pretaxCapped401: scaled.pretaxCapped401,
    pretaxCappedHsa: scaled.pretaxCappedHsa,
    pretaxCappedIra: ira.pretaxCappedIra,
    iraCappedByCompensation: ira.iraCappedByCompensation,
    rawPretaxTotal: scaled.rawPretaxTotal,
    effective401: scaled.effective401,
    effectiveHsa: scaled.effectiveHsa,
    effectiveOther: scaled.effectiveOther,
    preTaxTotal: scaled.preTaxTotal,
    wagesAfterPretax: scaled.wagesAfterPretax,
    ordinaryGrossForTax: scaled.ordinaryGrossForTax,
    effectiveIra: ira.effectiveIra,
    nonInvestmentOrdinaryGross: ira.nonInvestmentOrdinaryGross,
    nonInvestmentAfterIra: ira.nonInvestmentAfterIra,
    ordinaryAfterIra: ira.ordinaryAfterIra,
    cap401: ira.cap401,
    capIra: ira.capIra,
  };
}
