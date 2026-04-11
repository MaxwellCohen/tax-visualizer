import type { Accessor } from "solid-js";
import { inputClass, parseCurrencyInput } from "~/components/taxInputForm/shared";

type NumberFieldApi = {
  state: { value: number };
  handleChange: (v: number) => void;
  handleBlur: () => void;
};

type Props = {
  field: Accessor<NumberFieldApi>;
  min?: string;
  step?: string;
  /** When set, used instead of a wrapping `<label>` (e.g. table cells with column headers). */
  ariaLabel?: string;
};

export function FormCurrencyInput(props: Props) {
  return (
    <input
      type="number"
      min={props.min ?? "0"}
      step={props.step ?? "1"}
      class={inputClass}
      style={{ background: "var(--input-bg)", color: "var(--text)" }}
      aria-label={props.ariaLabel}
      value={props.field().state.value}
      onInput={e => props.field().handleChange(parseCurrencyInput(e.currentTarget.value))}
      onBlur={props.field().handleBlur}
    />
  );
}
