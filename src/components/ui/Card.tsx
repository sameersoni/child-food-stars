import type { HTMLAttributes, ReactNode } from 'react'

export function Card({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={`rounded-3xl border border-white/50 bg-white/70 p-4 shadow-xl shadow-slate-200/40 backdrop-blur-md ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
