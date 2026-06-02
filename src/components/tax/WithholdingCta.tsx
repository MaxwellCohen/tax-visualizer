import type { TaxFormData } from "~/lib/tax/form/types";
import { buildWithholdingShareUrl } from "~/routes/withholding/withholdingPersistence";

type WithholdingCtaProps = {
  taxInput: TaxFormData;
};

export function WithholdingCta(props: WithholdingCtaProps) {
  const href = () => {
    if (typeof window === "undefined") return "/withholding";
    return buildWithholdingShareUrl(window.location.origin, props.taxInput, { jobs: [] });
  };

  return (
    <p class="rounded-lg border border-border bg-surface-alt px-4 py-3 text-sm text-muted-foreground">
      <a
        href={href()}
        class="font-medium text-accent underline underline-offset-2 transition-colors"
      >
        Estimate paycheck withholding
      </a>
      {" — "}
      see suggested federal withholding per pay period and whether you may be over- or under-withheld.
    </p>
  );
}
