import { Show, type Accessor } from "solid-js";

export function FormFieldValidationMessage(props: { message: Accessor<string | undefined> }) {
  const msg = () => props.message();
  return (
    <Show when={msg()}>
      <p class="mt-1 text-xs text-warning-text">{msg()}</p>
    </Show>
  );
}
