import type { FormApi } from "@tanstack/solid-form";
import type { Accessor } from "solid-js";
import Accordion from "~/components/Accordion";
import { PreTax401Fields } from "~/components/taxInputForm/PreTax401Fields";
import { PreTaxHsaFields } from "~/components/taxInputForm/PreTaxHsaFields";
import { PreTaxOtherIraFields } from "~/components/taxInputForm/PreTaxOtherIraFields";
import { money } from "~/components/taxInputForm/shared";
import type { TaxInput } from "~/lib/taxCalc";
import type { PretaxBenefitLimits } from "~/lib/taxData.types";

type FormLike = FormApi<TaxInput, undefined>;

type Props = {
  form: FormLike;
  values: Accessor<TaxInput>;
  preTaxBenefitsOpen: boolean;
  setPreTaxBenefitsOpen: (v: boolean) => void;
  preTaxBenefitsTotal: Accessor<number>;
  isMarriedJoint: Accessor<boolean>;
  maxElective401: Accessor<number | undefined>;
  maxIraContribution: Accessor<number | undefined>;
  maxHsaSpouse1: Accessor<number | undefined>;
  maxHsaSpouse2: Accessor<number | undefined>;
  pretaxLimits: Accessor<PretaxBenefitLimits | null>;
};

export function TaxInputFormPreTaxSection(props: Props) {
  return (
    <Accordion
      open={props.preTaxBenefitsOpen}
      onOpenChange={props.setPreTaxBenefitsOpen}
      summary={
        <>
          <h2
            class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
          >
            Pre-tax benefits
          </h2>
          <span class="text-sm tabular-nums" style={{ color: "var(--text-muted)" }}>
            {money.format(props.preTaxBenefitsTotal())}
          </span>
        </>
      }
      action={props.preTaxBenefitsOpen ? "Collapse" : "Edit"}
      bodyClass="space-y-4"
    >
      <p class="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
        Payroll amounts that come out before tax. Applied only to W-2 wages; totals above your wage income
        are scaled down. Modeled traditional 401(k)/403(b), HSA, and other lines reduce federal income tax
        and Social Security/Medicare wages (Roth 401(k) is not modeled). With married filing jointly, 401(k)
        limits are per spouse; HSA family HDHP uses a combined payroll cap. Non-joint filers use the self-only
        HSA cap. Entries cannot exceed IRS limits for the selected tax year (age-50+ catch-up is not modeled);
        limits update when you change tax year.
      </p>
      <div class="space-y-4">
        <PreTax401Fields
          form={props.form}
          values={props.values}
          isMarriedJoint={props.isMarriedJoint}
          maxElective401={props.maxElective401}
          pretaxLimits={props.pretaxLimits}
        />
        <PreTaxHsaFields
          form={props.form}
          values={props.values}
          isMarriedJoint={props.isMarriedJoint}
          maxHsaSpouse1={props.maxHsaSpouse1}
          maxHsaSpouse2={props.maxHsaSpouse2}
          pretaxLimits={props.pretaxLimits}
        />
        <PreTaxOtherIraFields
          form={props.form}
          values={props.values}
          isMarriedJoint={props.isMarriedJoint}
          maxIraContribution={props.maxIraContribution}
          pretaxLimits={props.pretaxLimits}
        />
      </div>
    </Accordion>
  );
}
