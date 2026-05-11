import { useMemo } from 'react'
import type { ChildProfile, MealSlot, PlannedMeal } from '../../types/models'
import { swapSuggestions } from '../../engine/timetableEngine'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { MEAL_LABELS } from '../../constants/meals'

export function SwapMealModal({
  open,
  onClose,
  profile,
  slot,
  current,
  onPick,
}: {
  open: boolean
  onClose: () => void
  profile: ChildProfile
  slot: MealSlot
  current: PlannedMeal
  onPick: (meal: PlannedMeal) => void
}) {
  const alts = useMemo(
    () => (open ? swapSuggestions(profile, current, slot, 8) : []),
    [open, profile, current, slot],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="swap-title"
    >
      <Card className="max-h-[85dvh] w-full max-w-md overflow-y-auto p-5 shadow-2xl">
        <h3 id="swap-title" className="text-xl font-extrabold text-slate-900">
          Swap {MEAL_LABELS[slot]}
        </h3>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Pick a tasty alternative. Nutrition tags help us rotate wisely.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {alts.map((m) => (
            <button
              key={m.foodId}
              type="button"
              onClick={() => {
                onPick(m)
                onClose()
              }}
              className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 p-3 text-left transition hover:border-rose-200"
            >
              <span className="text-3xl">{m.emoji}</span>
              <span className="flex-1">
                <span className="block font-bold text-slate-900">{m.name}</span>
                <span className="text-xs font-medium text-slate-500">{m.tags.slice(0, 5).join(' · ')}</span>
              </span>
            </button>
          ))}
        </div>
        <Button variant="secondary" className="mt-4 w-full" onClick={onClose}>
          Close
        </Button>
      </Card>
    </div>
  )
}
