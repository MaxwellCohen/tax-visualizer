import type { JSX } from "solid-js";
import { inputClass, labelClass } from "~/components/taxInputForm/shared";

type Props = {
  label: string;
  value: string | number;
  onChange: (e: Event & { currentTarget: HTMLSelectElement }) => void;
  onBlur: () => void;
  children: JSX.Element;
};

export function FormStyledSelect(props: Props) {
  return (
    <label class={labelClass} style={{ color: "var(--text-muted)" }}>
      {props.label}
      <select
        class={inputClass}
        style={{ background: "var(--input-bg)", color: "var(--text)" }}
        value={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
      >
        {props.children}
      </select>
    </label>
  );
}
