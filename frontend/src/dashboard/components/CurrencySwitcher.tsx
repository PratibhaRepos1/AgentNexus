import { clsx } from 'clsx'
import { CurrencyCode, SUPPORTED_CURRENCIES } from '../../shared/currency'

interface Props {
  currency: CurrencyCode
  onChange: (currency: CurrencyCode) => void
}

export function CurrencySwitcher({ currency, onChange }: Props) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-0.5"
      role="group"
      aria-label="Currency"
    >
      {SUPPORTED_CURRENCIES.map((c) => (
        <button
          key={c.code}
          type="button"
          onClick={() => onChange(c.code)}
          aria-pressed={c.code === currency}
          aria-label={c.name}
          className={clsx(
            'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors',
            c.code === currency ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
          )}
        >
          <span aria-hidden="true">{c.flag}</span> {c.code}
        </button>
      ))}
    </div>
  )
}
