import type { TaxInput } from "~/lib/taxCalc.types";
import type { TaxYearConfig } from "~/lib/taxData.types";
import { toMoneyValue } from "~/lib/taxCalc.money";
import type { IncomeTotals } from "~/lib/taxCalc.scenarioAmountsIncome";
import type { PretaxIraSlice } from "~/lib/taxCalc.scenarioPretaxIra.types";

export function computePretaxIraSlice(
  input: TaxInput,
  config: TaxYearConfig,
  inc: IncomeTotals,
): PretaxIraSlice {
  const { sources, wageIncome, ordinaryGrossIncome, shortTermCapGainsGrossIncome } = inc;

  const joint = input.filingStatus === "marriedJoint";
  const lim = config.pretaxLimits;
  const cap401 = lim.electiveDeferral401k;
  const uncapped401_1 = toMoneyValue(input.preTax401kSpouse1);
  const uncapped401_2 = joint ? toMoneyValue(input.preTax401kSpouse2) : 0;
  const uncappedHsa_1 = toMoneyValue(input.preTaxHsaSpouse1);
  const uncappedHsa_2 = joint ? toMoneyValue(input.preTaxHsaSpouse2) : 0;

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

  const rawOther = toMoneyValue(input.preTaxOther);
  const rawPretaxTotal = raw401 + rawHsa + rawOther;
  const pretaxScale = wageIncome <= 0 ? 0 : rawPretaxTotal > wageIncome ? wageIncome / rawPretaxTotal : 1;
  const effective401 = raw401 * pretaxScale;
  const effectiveHsa = rawHsa * pretaxScale;
  const effectiveOther = rawOther * pretaxScale;
  const preTaxTotal = effective401 + effectiveHsa + effectiveOther;
  const wagesAfterPretax = Math.max(0, wageIncome - preTaxTotal);
  const ordinaryGrossForTax = wagesAfterPretax + (ordinaryGrossIncome - wageIncome);

  const capIra = lim.traditionalIraContribution;
  const uncappedIra1 = toMoneyValue(input.traditionalIraSpouse1);
  const uncappedIra2 = joint ? toMoneyValue(input.traditionalIraSpouse2) : 0;
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
    joint,
    lim,
    pretaxCapped401,
    pretaxCappedHsa,
    pretaxCappedIra,
    iraCappedByCompensation,
    rawPretaxTotal,
    effective401,
    effectiveHsa,
    effectiveOther,
    preTaxTotal,
    wagesAfterPretax,
    ordinaryGrossForTax,
    effectiveIra,
    nonInvestmentOrdinaryGross,
    nonInvestmentAfterIra,
    ordinaryAfterIra,
    cap401,
    capIra,
  };
}
