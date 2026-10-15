import { createSignal } from "solid-js";
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
  error?: string;
  errorId?: string;
};

export function FormCurrencyInput(props: Props) {
  const commitToUrl = useTaxInputCommitToUrl();
  const [draft, setDraft] = createSignal<string | undefined>(undefined);

  const commitValue = (raw: string) => {
    props.onInput(raw === "" ? 0 : parseCurrencyInput(raw));
  };

  const onBlur = () => {
    const raw = draft();
    if (raw !== undefined) {
      commitValue(raw);
      setDraft(undefined);
    }
    props.onBlur?.();
    commitToUrl?.();
  };

  return (
    <input
      type="number"
      class={`${inputClass} bg-input text-foreground`}
      value={draft() ?? String(props.value)}
      min={props.min ?? "0"}
      step={props.step ?? "1"}
      aria-label={props.ariaLabel}
      aria-invalid={props.error ? "true" : undefined}
      aria-describedby={props.error ? props.errorId : undefined}
      onFocus={() => setDraft(String(props.value))}
      onInput={(e) => {
        const raw = e.currentTarget.value;
        setDraft(raw);
        if (raw !== "") commitValue(raw);
      }}
      onBlur={onBlur}
    />
  );
}
