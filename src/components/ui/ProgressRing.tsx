import { useId } from 'react'

export function ProgressRing({
  value,
  max,
  size = 120,
  stroke = 10,
  label,
}: {
  value: number
  max: number
  size?: number
  stroke?: number
  label?: string
}) {
  const gid = useId().replace(/:/g, '')
  const gradId = `gradRing_${gid}`
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = max <= 0 ? 0 : Math.min(1, value / max)
  const offset = c * (1 - pct)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.65)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-extrabold text-slate-800">{Math.round(pct * 100)}%</span>
        {label ? <span className="text-xs font-semibold text-slate-500">{label}</span> : null}
      </div>
    </div>
  )
}
