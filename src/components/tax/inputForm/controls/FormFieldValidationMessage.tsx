import { Show, type Accessor } from "solid-js";

export function FormFieldValidationMessage(props: { message: Accessor<string | undefined> }) {
  return <Show when={props.message()}>
    <p class="mt-1 text-xs text-warning-text">{props.message()}</p>
  </Show>;
}
