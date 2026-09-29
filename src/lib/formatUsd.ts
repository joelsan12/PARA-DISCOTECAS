const usdFormatter = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'code',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatUsd = (value: number) => usdFormatter.format(Number.isFinite(value) ? value : 0);
