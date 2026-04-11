export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function deltaLabel(current: number, baseline: number, formatter: Intl.NumberFormat): string {
  const delta = current - baseline;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${formatter.format(delta)}`;
}
