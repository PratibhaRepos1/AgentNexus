import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface Props {
  children: ReactNode
  className?: string
  title?: string
}

export function Card({ children, className, title }: Props) {
  return (
    <div className={clsx('bg-white rounded-xl border border-gray-200 shadow-sm', className)}>
      {title && (
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
