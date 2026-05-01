import { useTaxInputCommitToUrl } from "~/components/taxInputForm/taxInputFormCommitUrlContext";
import { inputClass, parseCurrencyInput } from "~/components/taxInputForm/shared";

type Props = {
  value: number;
  onInput: (value: number) => void;
  onBlur?: () => void;
  min?: string;
  step?: string;
  /** When set, used instead of a wrapping `<label>` (e.g. table cells with column headers). */
  ariaLabel?: string;
};

export function FormCurrencyInput(props: Props) {
  const commitToUrl = useTaxInputCommitToUrl();
  const onBlur = () => {
    props.onBlur?.();
    commitToUrl?.();
  };
  return (
    <input
      type="number"
      min={props.min ?? "0"}
      step={props.step ?? "1"}
      class={inputClass}
      style={{ background: "var(--input-bg)", color: "var(--text)" }}
      aria-label={props.ariaLabel}
      value={props.value}
      onInput={(e) => props.onInput(parseCurrencyInput(e.currentTarget.value))}
      onBlur={onBlur}
    />
  );
}
