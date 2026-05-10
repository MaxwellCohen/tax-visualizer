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
  const commitToUrl = useTaxInputCommitToUrl();
  const onBlur = () => {
    props.onBlur?.();
    commitToUrl?.();
  };
  return (
    <input
      type="number"
      onBlur={onBlur}
      class={`${inputClass} bg-input text-foreground`}
      {...props}
      onInput={(e) => props.onInput(parseCurrencyInput(e.currentTarget.value))}
      min={props.min ?? "0"}
      step={props.step ?? "1"}
    />
  );
}
