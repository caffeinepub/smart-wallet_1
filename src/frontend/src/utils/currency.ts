export function formatCurrency(amount: number, _currency?: string): string {
  return `TZS ${amount.toLocaleString("en", { maximumFractionDigits: 0 })}`;
}

export function getCurrencySymbol(_currency?: string): string {
  return "TZS";
}

export const CURRENCIES = ["TZS"];
