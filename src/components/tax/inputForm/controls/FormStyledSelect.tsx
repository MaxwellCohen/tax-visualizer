import type { Accessor } from "solid-js";
import { For, Show, createEffect } from "solid-js";
import type { JSX } from "@solidjs/web";
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
  createEffect(
    () => ({ value: String(props.value()), options: props.options }),
    ({ value, options }) => {
      const el = selectEl;
      if (!el || !options?.length) return;
      queueMicrotask(() => {
        if (el.isConnected && el.value !== value) el.value = value;
      });
    },
  );

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
        <For each={props.options} keyed={(opt) => String(opt.value)}>
          {(opt) => <option value={String(opt().value)}>{opt().label}</option>}
        </For>
      ) : (
        props.children
      )}
    </select>
  );
  return (
    <Show
      when={!props.hideLabel}
      fallback={select}
    >
      <label class={`${labelClass} text-muted-foreground`}>
        {props.label}
        {select}
      </label>
    </Show>
  );
}
