import { splitProps } from "solid-js";
import { useTaxInputCommitToUrl } from "~/components/tax/inputForm/context/TaxInputCommitUrlContext";
import { inputClass, parseCurrencyInput } from "~/components/tax/inputForm/shared";

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
  const [local] = splitProps(props, ["value", "onInput", "onBlur", "min", "step", "ariaLabel"]);
  const commitToUrl = useTaxInputCommitToUrl();
  const onBlur = () => {
    local.onBlur?.();
    commitToUrl?.();
  };
  return (
    <input
      type="number"
      class={`${inputClass} bg-input text-foreground`}
      value={local.value}
      min={local.min ?? "0"}
      step={local.step ?? "1"}
      aria-label={local.ariaLabel}
      onInput={(e) => local.onInput(parseCurrencyInput(e.currentTarget.value))}
      onBlur={onBlur}
    />
  );
}
