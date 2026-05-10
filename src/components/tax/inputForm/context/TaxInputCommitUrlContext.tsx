import { createContext, useContext, type ParentComponent } from "solid-js";

const TaxInputCommitToUrlContext = createContext<(() => void) | undefined>(undefined);

/** Wraps the tax form so fields can call URL sync after their own blur handling. */
export const TaxInputCommitToUrlProvider: ParentComponent<{
  onCommitToUrl?: () => void;
}> = props => (
  <TaxInputCommitToUrlContext.Provider value={props.onCommitToUrl}>{props.children}</TaxInputCommitToUrlContext.Provider>
);

export function useTaxInputCommitToUrl(): (() => void) | undefined {
  return useContext(TaxInputCommitToUrlContext);
}
