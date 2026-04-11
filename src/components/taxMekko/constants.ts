export const W = 920;
export const H = 560;
export const PAD_L = 102;
export const PAD_R = 20;
export const PAD_B = 52;
export const PAD_T = 28;
export const SUMMARY_H = 20;
export const SUMMARY_GAP = 12;

export const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const pct = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
