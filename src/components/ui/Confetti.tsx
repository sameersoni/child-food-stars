import { useEffect, useState } from 'react'

const COLORS = ['#ff6b9d', '#ffd93d', '#6bcb77', '#4d96ff', '#c77dff', '#ff9f45']

export function ConfettiBurst({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<{ id: number; left: string; color: string; delay: string }[]>(
    [],
  )

  useEffect(() => {
    if (!active) return
    const next = Array.from({ length: 28 }, (_, i) => ({
      id: Date.now() + i,
      left: `${Math.random() * 100}%`,
      color: COLORS[i % COLORS.length],
      delay: `${Math.random() * 0.25}s`,
    }))
    const id = window.requestAnimationFrame(() => setPieces(next))
    const t = window.setTimeout(() => setPieces([]), 3000)
    return () => {
      window.cancelAnimationFrame(id)
      window.clearTimeout(t)
    }
  }, [active])

  if (!pieces.length) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{ left: p.left, backgroundColor: p.color, animationDelay: p.delay }}
        />
      ))}
    </div>
  )
}
