import { createContext, useContext, type ParentComponent } from "solid-js";
import type { CommitTaxInputToUrl } from "~/components/tax/inputForm/hooks/taxInputRowActions";

const noop: CommitTaxInputToUrl = () => {};

const TaxInputCommitToUrlContext = createContext<CommitTaxInputToUrl>(noop);

/** Wraps the tax form so fields can call URL sync after their own blur handling. */
export const TaxInputCommitToUrlProvider: ParentComponent<{
  onCommitToUrl?: CommitTaxInputToUrl;
}> = (props) => (
  <TaxInputCommitToUrlContext value={props.onCommitToUrl ?? noop}>{props.children}</TaxInputCommitToUrlContext>
);

export function useTaxInputCommitToUrl(): CommitTaxInputToUrl {
  return useContext(TaxInputCommitToUrlContext);
}
