import { Show } from "solid-js";
import type { Accessor } from "solid-js";

type FieldApiLike = { state: { meta: { errors?: unknown[] } } };

function firstStringError(errors: unknown[] | undefined): string | undefined {
  if (!errors) return undefined;
  for (const e of errors) {
    if (typeof e === "string") return e;
  }
  return undefined;
}

/** First validation error from TanStack Field `meta.errors` (string messages). */
export function FormFieldValidationMessage(props: { field: Accessor<FieldApiLike> }) {
  const msg = () => firstStringError(props.field().state.meta.errors);
  return (
    <Show when={msg()}>
      <p class="mt-1 text-xs text-(--warning-text)">{msg()}</p>
    </Show>
  );
}
