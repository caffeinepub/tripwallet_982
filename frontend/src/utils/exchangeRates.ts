export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>,
): number {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;

  // All rates are relative to USD, so convert through USD
  // Formula: amount × (toRate / fromRate)
  return (amount / fromRate) * toRate;
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported currencies
    return `${currency} ${amount.toFixed(2)}`;
  }
}
