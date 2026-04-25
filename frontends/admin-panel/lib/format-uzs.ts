export function formatPriceUZS(priceUnits: number): string {
  return `${new Intl.NumberFormat("uz-Latn-UZ", { maximumFractionDigits: 0 }).format(priceUnits)} so'm`;
}
