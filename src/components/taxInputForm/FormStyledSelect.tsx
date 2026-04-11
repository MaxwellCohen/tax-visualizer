import type { JSX } from "solid-js";
import { inputClass, labelClass } from "~/components/taxInputForm/shared";

type Props = {
  label: string;
  value: string | number;
  onChange: (e: Event & { currentTarget: HTMLSelectElement }) => void;
  onBlur: () => void;
  children: JSX.Element;
  /** When true, only the control is rendered (for table rows); use with a column header. */
  hideLabel?: boolean;
};

export function FormStyledSelect(props: Props) {
  const select = (
    <select
      class={inputClass}
      style={{ background: "var(--input-bg)", color: "var(--text)" }}
      value={props.value}
      aria-label={props.hideLabel ? props.label : undefined}
      onChange={props.onChange}
      onBlur={props.onBlur}
    >
      {props.children}
    </select>
  );
  if (props.hideLabel) {
    return select;
  }
  return (
    <label class={labelClass} style={{ color: "var(--text-muted)" }}>
      {props.label}
      {select}
    </label>
  );
}
