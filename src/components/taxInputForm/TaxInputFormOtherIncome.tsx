import { Index, Show } from "solid-js";
import type { FormApi } from "@tanstack/solid-form";
import type { Accessor } from "solid-js";
import Accordion from "~/components/Accordion";
import { IncomeSourceFields } from "~/components/taxInputForm/IncomeSourceFields";
import { labelForIncomeKind, money } from "~/components/taxInputForm/shared";
import type { TaxInput } from "~/lib/taxCalc";
import { incomeSourceDisplayLabel } from "~/lib/taxCalc";

type FormLike = FormApi<TaxInput, undefined>;

type Props = {
  form: FormLike;
  values: Accessor<TaxInput>;
  otherSourceIndices: Accessor<number[]>;
  removeSourceAt: (i: number) => void;
};

export function TaxInputFormOtherIncome(props: Props) {
  return (
    <div class="space-y-3">
      <Index each={props.otherSourceIndices()}>
        {srcIndex => {
          const i = () => srcIndex()!;
          const source = () => props.values().incomeSources[i()];
          return (
            <Accordion
              summary={
                <>
                  <h2
                    class="min-w-0 truncate text-[0.65rem] font-semibold uppercase tracking-[0.15em]"
                    style={{
                      color: "var(--text-faint)",
                      "font-family": "var(--font-heading)",
                    }}
                  >
                    {incomeSourceDisplayLabel(source())}
                  </h2>
                  <Show
                    when={
                      incomeSourceDisplayLabel(source()) !==
                      labelForIncomeKind(source().kind)
                    }
                  >
                    <span
                      class="text-[0.65rem] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {labelForIncomeKind(source().kind)}
                    </span>
                  </Show>
                  <span class="text-sm tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {money.format(source().amount)}
                  </span>
                </>
              }
              action="Edit"
            >
              <IncomeSourceFields
                form={props.form}
                index={i()}
                canRemove={props.values().incomeSources.length > 1}
                onRemove={() => props.removeSourceAt(i())}
              />
            </Accordion>
          );
        }}
      </Index>
    </div>
  );
}
