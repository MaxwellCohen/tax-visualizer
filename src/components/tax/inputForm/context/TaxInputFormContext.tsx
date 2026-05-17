import { createContext, useContext, type ParentComponent } from "solid-js";
import type { Accessor, Setter } from "solid-js";
import type { ValidationContext } from "~/lib/config/types";
import type { TaxInputRowActions } from "~/components/tax/inputForm/hooks/taxInputRowActions";
import type { TaxFormData } from "~/lib/tax/form/types";
import type { FilingStatus, TaxYearConfig } from "~/lib/tax/data/types";

/** Shared tax form shell: row accessors, limits, deduction memos, and row mutations. */
type TaxInputFormContextValue = {
    taxInput: Accessor<TaxFormData>;
    setTaxInput: Setter<TaxFormData>;
    taxData: Accessor<TaxYearConfig | null>;
    filingStatus: Accessor<FilingStatus>;
    validationCtx: Accessor<ValidationContext | undefined>;
    preTaxBenefitsTotal: Accessor<number>;
    isMarriedJoint: Accessor<boolean>;
    standardDeduction: Accessor<number>;
    itemizedBeatsStandard: Accessor<boolean>;
    rowActions: TaxInputRowActions;
};

const TaxInputFormContext = createContext<TaxInputFormContextValue>();

export const TaxInputFormProvider: ParentComponent<{ value: TaxInputFormContextValue }> = (props) => (
    <TaxInputFormContext.Provider value={props.value}>{props.children}</TaxInputFormContext.Provider>
);

export function useTaxInputForm(): TaxInputFormContextValue {
    const v = useContext(TaxInputFormContext);
    if (!v) throw new Error("useTaxInputForm must be used within TaxInputFormProvider");
    return v;
}
