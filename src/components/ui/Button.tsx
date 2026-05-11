import type { ButtonHTMLAttributes, ReactNode } from 'react'

const variants = {
  primary:
    'bg-gradient-to-r from-rose-400 to-orange-400 text-white shadow-lg shadow-rose-200/60 active:scale-[0.98]',
  secondary:
    'bg-white/80 text-slate-800 border border-white/60 shadow-md active:scale-[0.98]',
  ghost: 'bg-transparent text-slate-700 hover:bg-white/50 active:scale-[0.98]',
  danger: 'bg-red-500/90 text-white shadow-md active:scale-[0.98]',
}

export function Button({
  children,
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: keyof typeof variants
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-bold transition min-h-[48px] min-w-[48px] disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
