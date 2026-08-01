// Central currency configuration. To add a new currency: add an entry to
// src/assets/currencies.json, then register it in SUPPORTED_CURRENCIES below (with a flag
// emoji for the switcher). No other code changes are required — CurrencySwitcher.astro
// renders itself from this list, and CurrencyService/Price are generic over currency code.

import currencies from "../assets/currencies.json";

export type CurrencyCode = keyof typeof currencies;

export interface CurrencyDefinition {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  /** Flag emoji shown in the switcher. */
  flag: string;
  /** Full name, used for aria-labels. */
  name: string;
}

export const CURRENCIES = currencies as Record<CurrencyCode, { symbol: string; locale: string; code: CurrencyCode }>;

export const SUPPORTED_CURRENCIES: CurrencyDefinition[] = [
  { code: "USD", symbol: CURRENCIES.USD.symbol, locale: CURRENCIES.USD.locale, flag: "🇺🇸", name: "US Dollar" },
  { code: "NOK", symbol: CURRENCIES.NOK.symbol, locale: CURRENCIES.NOK.locale, flag: "🇳🇴", name: "Norwegian Krone" },
];

/** All conversions are always priced from this base — product prices are authored in USD. */
export const BASE_CURRENCY: CurrencyCode = "USD";

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

/** Exchange rates are refreshed at most this often — keeps API calls to ~1/day site-wide. */
export const RATE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export const STORAGE_KEYS = {
  CURRENCY: "chatcraft_currency",
  RATE_CACHE: "chatcraft_exchange_rate",
} as const;

export const CURRENCY_CHANGE_EVENT = "chatcraft:currencychange";
