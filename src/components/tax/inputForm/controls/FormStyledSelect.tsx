import type { Accessor, JSX } from "solid-js";
import { For, createEffect } from "solid-js";
import { useTaxInputCommitToUrl } from "~/components/tax/inputForm/context/TaxInputCommitUrlContext";
import { inputClass, labelClass } from "~/components/tax/inputForm/shared";

type Option = { value: string | number; label: string };

type Props = {
  label: string;
  value: Accessor<string | number>;
  onInput: (e: Event & { currentTarget: HTMLSelectElement }) => void;
  onBlur: () => void;
  options?: Option[];
  children?: JSX.Element;
  hideLabel?: boolean;
};

export function FormStyledSelect(props: Props) {
  let selectEl: HTMLSelectElement | undefined;
  const commitToUrl = useTaxInputCommitToUrl();
  const onBlur = () => {
    props.onBlur();
    commitToUrl?.();
  };

  /** Native `<select>` can drop the visible selection when `<option>` nodes reconcile; re-apply after DOM settles (value may be unchanged). */
  createEffect(() => {
    const v = String(props.value());
    const opts = props.options;
    if (opts && opts.length) {
      const el = selectEl;
      if (el) {
        queueMicrotask(() => {
          if (el.isConnected && el.value !== v) {
            el.value = v;
          }
        });
      }
    }
  });

  const select = (
    <select
      ref={(el) => {
        selectEl = el;
      }}
      class={`${inputClass} bg-input text-foreground`}
      value={String(props.value())}
      aria-label={props.hideLabel ? props.label : undefined}
      onInput={props.onInput}
      onBlur={onBlur}
    >
      {props.options ? (
        <For each={props.options}>
          {(opt) => <option value={String(opt.value)}>{opt.label}</option>}
        </For>
      ) : (
        props.children
      )}
    </select>
  );
  if (props.hideLabel) {
    return select;
  }
  return (
    <label class={`${labelClass} text-muted-foreground`}>
      {props.label}
      {select}
    </label>
  );
}
