export const SITE_NAME = "US Tax Visualizer";

/** Set `VITE_SITE_ORIGIN` (e.g. in `.env`) for absolute `og:url` and `link[rel=canonical]`. */
const SITE_ORIGIN = (import.meta.env.VITE_SITE_ORIGIN ?? "").replace(/\/$/, "");

export function canonicalUrl(pathnameAndSearch: string): string | undefined {
  if (!SITE_ORIGIN) return undefined;
  const path = pathnameAndSearch.startsWith("/") ? pathnameAndSearch : `/${pathnameAndSearch}`;
  return `${SITE_ORIGIN}${path}`;
}

export const PAGE_META = {
  home: {
    title: "US Tax Visualizer — Federal income, payroll, and take-home pay",
    description:
      "Interactive US federal tax explorer: ordinary and long-term capital gains brackets, payroll taxes (Social Security and Medicare), deductions, and take-home pay. Educational—not tax advice.",
    keywords:
      "federal income tax, tax brackets, FICA, payroll tax, capital gains, take-home pay, withholding, United States",
  },
  withholding: {
    title: "Paycheck withholding estimate — US Tax Visualizer",
    description:
      "Rough federal income tax per paycheck and year-end refund or balance-due estimate from your modeled annual liability. Educational—not W-4 or tax advice.",
    keywords:
      "federal income tax withholding, paycheck withholding, refund estimate, biweekly withholding, United States",
  },
  about: {
    title: "About — US Tax Visualizer",
    description:
      "How Tax Visualizer models US federal taxes, what it includes, and what it leaves out. Built with SolidStart for learning—not professional tax preparation.",
  },
  notFound: {
    title: "Page not found — US Tax Visualizer",
    description: "This URL does not match a page on US Tax Visualizer.",
  },
} as const;
