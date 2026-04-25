/** UZS: 1 250 000 so'm */
export function formatPriceUZS(priceUnits: number): string {
  const formatted = new Intl.NumberFormat("uz-Latn-UZ", {
    maximumFractionDigits: 0,
  }).format(priceUnits);
  return `${formatted} so'm`;
}

export function discountedPrice(priceUnits: number, discountPercent: number): number {
  if (discountPercent <= 0) return priceUnits;
  return Math.round(priceUnits * (1 - discountPercent / 100));
}
