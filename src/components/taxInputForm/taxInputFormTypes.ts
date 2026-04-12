/**
 * TanStack Form instance for tax row data (`TaxFormData` in `~/lib/taxForm.types`). Typed loosely:
 * dynamic `rows[i].kind` paths are not representable as literal field names, and strict `FormApi`
 * generics break `Field` inference.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaxInputFormApi = any;
