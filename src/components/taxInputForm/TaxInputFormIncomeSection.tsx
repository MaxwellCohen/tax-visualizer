import { createMemo, Index } from "solid-js";
import type { Accessor } from "solid-js";
import Accordion from "~/components/Accordion";
import { IncomeSourceTableRow } from "~/components/taxInputForm/IncomeSourceFields";
import type { TaxInputFormApi } from "~/components/taxInputForm/taxInputFormTypes";
import { money, taxInputFormTableThClass } from "~/components/taxInputForm/shared";
import type { TaxFormData, TaxFormIncomeRow } from "~/lib/taxForm.types";
import { incomeRowIndices } from "~/lib/taxForm.rows";

type Props = {
  form: TaxInputFormApi;
  values: Accessor<TaxFormData>;
  addSource: () => void;
  removeSourceAt: (i: number) => void;
};

const addSourceBtnClass =
  "shrink-0 whitespace-nowrap rounded-md border border-(--border) bg-(--accent-muted) px-3 py-2 text-xs font-medium uppercase tracking-wide text-(--accent) transition-colors";

export function TaxInputFormIncomeSection(props: Props) {
  const indices = createMemo(() => incomeRowIndices(props.values().rows));

  const incomeTotal = createMemo(() =>
    props
      .values()
      .rows.filter((r): r is TaxFormIncomeRow => r.type === "income")
      .reduce((sum, s) => {
        const n = s.amount;
        return sum + (Number.isFinite(n) ? n : 0);
      }, 0),
  );

  return (
    <Accordion
      summary={
        <>
          <h2 class="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-(--text-faint) [font-family:var(--font-heading)]">
            Income sources
          </h2>
          <span class="text-sm tabular-nums text-(--text-muted)">{money.format(incomeTotal())}</span>
        </>
      }
      bodyClass="space-y-4"
    >
      <p class="text-xs leading-relaxed text-(--text-muted)">
        Add wages, self-employment, and other ordinary income—one row per type. Optional labels are only for your
        notes (for example in charts).
      </p>
      <div class="flex justify-end md:hidden">
        <button type="button" class={addSourceBtnClass} onClick={props.addSource}>
          Add source
        </button>
      </div>
      <div class="overflow-x-auto max-md:overflow-x-visible rounded-lg border border-(--border) bg-(--surface-alt)">
        <table class="w-full min-w-0 border-collapse text-sm md:min-w-xl md:[&>tbody>tr:last-child>td]:border-b-0">
          <thead class="hidden md:table-header-group">
            <tr>
              <th scope="col" class={`${taxInputFormTableThClass} pl-3`}>
                Type
              </th>
              <th scope="col" class={taxInputFormTableThClass}>
                Label (optional)
              </th>
              <th scope="col" class={taxInputFormTableThClass}>
                Amount
              </th>
              <th scope="col" class={`${taxInputFormTableThClass} whitespace-nowrap pr-3 text-right align-bottom`}>
                <div class="flex justify-end">
                  <button type="button" class={addSourceBtnClass} onClick={props.addSource}>
                    Add source
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <Index each={indices()}>
              {(_src, idx) => {
                const rowIndex = () =>
                  typeof idx === "function" ? (idx as () => number)() : (idx as number);
                const absIndex = () => indices()[rowIndex()];
                return (
                  <IncomeSourceTableRow
                    form={props.form}
                    rowIndex={absIndex()}
                    canRemove={indices().length > 1}
                    onRemove={() => props.removeSourceAt(absIndex())}
                  />
                );
              }}
            </Index>
          </tbody>
        </table>
      </div>
    </Accordion>
  );
}
