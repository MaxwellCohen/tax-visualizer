import { Show, type Accessor } from "solid-js";

export function FormFieldValidationMessage(props: {
  message: Accessor<string | undefined>;
  id?: string;
}) {
  return <Show when={props.message()}>
    <p id={props.id} class="mt-1 text-xs text-warning-text" role="alert">
      {props.message()}
    </p>
  </Show>;
}
