import { Index } from "solid-js";
import type { FormApi } from "@tanstack/solid-form";
import type { Accessor } from "solid-js";
import Accordion from "~/components/Accordion";
import { IncomeSourceFields } from "~/components/taxInputForm/IncomeSourceFields";
import { money } from "~/components/taxInputForm/shared";
import type { TaxInput } from "~/lib/taxCalc";

type FormLike = FormApi<TaxInput, undefined>;

type Props = {
  form: FormLike;
  values: Accessor<TaxInput>;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  wageSourceIndices: Accessor<number[]>;
  wagesTotal: Accessor<number>;
  removeSourceAt: (i: number) => void;
};

export function TaxInputFormWagesAccordion(props: Props) {
  return (
    <Accordion
      open={props.open}
      onOpenChange={props.onOpenChange}
      summary={
        <>
          <h2
            class="text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--text-faint)", "font-family": "var(--font-heading)" }}
          >
            W-2 wages
          </h2>
          <span class="text-sm tabular-nums" style={{ color: "var(--text-muted)" }}>
            {money.format(props.wagesTotal())}
          </span>
        </>
      }
      action={props.open ? "Collapse" : "Edit"}
      bodyClass="space-y-3"
    >
      <Index each={props.wageSourceIndices()}>
        {srcIndex => (
          <div
            class="rounded-lg p-3"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <IncomeSourceFields
              form={props.form}
              index={srcIndex()!}
              canRemove={props.values().incomeSources.length > 1}
              onRemove={() => props.removeSourceAt(srcIndex()!)}
            />
          </div>
        )}
      </Index>
    </Accordion>
  );
}
