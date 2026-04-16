import type { JSX } from "solid-js";
import { inputClass, labelClass } from "~/components/taxInputForm/shared";

type Option = { value: string | number; label: string };

type Props = {
  label: string;
  value: string | number;
  onChange: (e: Event & { currentTarget: HTMLSelectElement }) => void;
  onBlur: () => void;
  options?: Option[];
  children?: JSX.Element;
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
      {props.options
        ? props.options.map(opt => <option value={opt.value}>{opt.label}</option>)
        : props.children}
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
