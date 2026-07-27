import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, className, ...rest }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      ref={ref}
      className={clsx(
        'w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none transition',
        error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
        className
      )}
      {...rest}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
))
Input.displayName = 'Input'
