import { Show } from "solid-js";
import { addLineBtnClass, removeAllBtnClass } from "~/components/tax/inputForm/shared";

function AddLineButton(props: { label: string; onClick: () => void }) {
  return (
    <button type="button" class={addLineBtnClass} onClick={props.onClick}>
      {props.label}
    </button>
  );
}

export function AddLineMobileControls(props: { label: string; onAdd: () => void }) {
  return (
    <div class="flex justify-end md:hidden">
      <AddLineButton label={props.label} onClick={props.onAdd} />
    </div>
  );
}

export function AddLineHeaderControls(props: {
  addLabel: string;
  onAdd: () => void;
  onClearAll?: () => void;
  showClearAll?: boolean;
}) {
  return (
    <div class={props.onClearAll ? "flex justify-end gap-2" : "flex justify-end"}>
      <Show when={props.onClearAll && props.showClearAll}>
        <button type="button" class={removeAllBtnClass} onClick={props.onClearAll}>
          Remove all
        </button>
      </Show>
      <AddLineButton label={props.addLabel} onClick={props.onAdd} />
    </div>
  );
}
