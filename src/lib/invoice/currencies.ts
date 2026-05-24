export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", locale: "en-NZ" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", locale: "de-CH" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona", locale: "sv-SE" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone", locale: "nb-NO" },
  { code: "DKK", symbol: "kr", name: "Danish Krone", locale: "da-DK" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", locale: "en-HK" },
  { code: "ZAR", symbol: "R", name: "South African Rand", locale: "en-ZA" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", locale: "ar-AE" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso", locale: "es-MX" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", locale: "pt-BR" },
];

export function getCurrency(code: string): CurrencyOption {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function formatMoney(amount: number, currencyCode: string, locale?: string): string {
  const currency = getCurrency(currencyCode);
  const fmtLocale = locale ?? currency.locale;
  try {
    return new Intl.NumberFormat(fmtLocale, {
      style: "currency",
      currency: currency.code,
      minimumFractionDigits: currency.code === "JPY" ? 0 : 2,
      maximumFractionDigits: currency.code === "JPY" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
}
