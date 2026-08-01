// Locale-correct currency formatting, driven entirely by src/assets/currencies.json —
// no per-currency formatting logic to maintain as new currencies are added.

import { CURRENCIES, type CurrencyCode } from "../config/currency";

const formatters = new Map<CurrencyCode, Intl.NumberFormat>();

function getFormatter(currency: CurrencyCode): Intl.NumberFormat {
  const cached = formatters.get(currency);
  if (cached) return cached;

  const { locale, code } = CURRENCIES[currency];
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  });
  formatters.set(currency, formatter);
  return formatter;
}

/** Formats a whole-unit amount in the given currency, e.g. formatCurrency(49, "USD") -> "$49". */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  return getFormatter(currency).format(amount);
}
