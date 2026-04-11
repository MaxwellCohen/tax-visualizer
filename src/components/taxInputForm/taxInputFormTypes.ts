import type { createForm } from "@tanstack/solid-form";
import type { TaxInput } from "~/lib/taxCalc";

/** `createForm<TaxInput>()` return type — `FormApi<TaxInput, undefined>` is too few type args and breaks `Field` inference. */
export type TaxInputFormApi = ReturnType<typeof createForm<TaxInput>>;
