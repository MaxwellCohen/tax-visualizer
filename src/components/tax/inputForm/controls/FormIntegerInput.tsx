import { createSignal } from "solid-js";
import { useTaxInputCommitToUrl } from "~/components/tax/inputForm/context/TaxInputCommitUrlContext";
import { inputClass } from "~/components/tax/inputForm/shared";

type Props = {
  value: number;
  onInput: (value: number) => void;
  onBlur?: () => void;
  ariaLabel?: string;
};

function parseCount(raw: string): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

export function FormIntegerInput(props: Props) {
  const commitToUrl = useTaxInputCommitToUrl();
  const [draft, setDraft] = createSignal<string | undefined>(undefined);

  const commitValue = (raw: string) => {
    props.onInput(raw === "" ? 0 : parseCount(raw));
  };

  return (
    <input
      type="number"
      inputmode="numeric"
      class={`${inputClass} bg-input text-foreground`}
      value={draft() ?? String(props.value)}
      min="0"
      step="1"
      aria-label={props.ariaLabel}
      onFocus={() => setDraft(String(props.value))}
      onInput={(e) => {
        const raw = e.currentTarget.value;
        setDraft(raw);
        if (raw !== "") commitValue(raw);
      }}
      onBlur={() => {
        const raw = draft();
        if (raw !== undefined) {
          commitValue(raw);
          setDraft(undefined);
        }
        props.onBlur?.();
        commitToUrl?.();
      }}
    />
  );
}
