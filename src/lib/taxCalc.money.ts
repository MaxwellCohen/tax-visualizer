export const taxCalcMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function toMoneyValue(value: number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}
