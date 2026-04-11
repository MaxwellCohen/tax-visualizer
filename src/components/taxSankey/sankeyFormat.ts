/** Shared currency formatter for Sankey link titles and node labels. */
export const sankeyMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
