import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MealSlot, PlannedMeal } from '../../types/models'
import { useAppData } from '../../context/AppDataContext'
import { WEEKDAY_LABELS } from '../../utils/dates'
import { MEAL_EMOJI, MEAL_LABELS, MEAL_ORDER } from '../../constants/meals'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { SwapMealModal } from './SwapMealModal'
import { useParentSessionUnlocked } from '../../hooks/useParentSessionUnlocked'
import { ParentPinUnlockModal } from '../parent/ParentPinUnlockModal'

function MealCell({
  meal,
  slot,
  onSwap,
  onRegen,
}: {
  meal: PlannedMeal
  slot: MealSlot
  onSwap: () => void
  onRegen: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/50 bg-gradient-to-br from-white/90 to-rose-50/40 p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <span className="text-2xl">{meal.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-rose-500">
            {MEAL_EMOJI[slot]} {MEAL_LABELS[slot]}
          </p>
          <p className="truncate font-extrabold text-slate-900">{meal.name}</p>
          {meal.note ? <p className="text-xs font-medium text-sky-700">{meal.note}</p> : null}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-rose-600 shadow-sm"
          onClick={onSwap}
        >
          Swap
        </button>
        <button
          type="button"
          className="rounded-xl bg-white/80 px-3 py-2 text-xs font-bold text-slate-600 shadow-sm"
          onClick={onRegen}
        >
          Regenerate
        </button>
      </div>
    </div>
  )
}

export function WeeklyPlanPage() {
  const { state, regenWeek, regenDay, regenMeal, swapMeal } = useAppData()
  const { unlocked, setUnlocked } = useParentSessionUnlocked()
  const week = state.currentWeekPlan
  const profile = state.profile
  const pinHash = state.settings.parentPinHash

  const [swapCtx, setSwapCtx] = useState<{
    dayIndex: number
    slot: MealSlot
    current: PlannedMeal
  } | null>(null)

  const [pinModalOpen, setPinModalOpen] = useState(false)
  const pendingAction = useRef<(() => void) | null>(null)

  const title = useMemo(() => {
    if (!week) return 'Weekly plan'
    return `Week of ${week.weekStart}`
  }, [week])

  const needsPin = Boolean(pinHash) && !unlocked

  const requestParent = useCallback(
    (fn: () => void) => {
      if (!pinHash || unlocked) {
        fn()
        return
      }
      pendingAction.current = fn
      setPinModalOpen(true)
    },
    [pinHash, unlocked],
  )

  const onPinVerified = useCallback(() => {
    setUnlocked()
    setPinModalOpen(false)
    const next = pendingAction.current
    pendingAction.current = null
    next?.()
  }, [setUnlocked])

  const closePinModal = useCallback(() => {
    setPinModalOpen(false)
    pendingAction.current = null
  }, [])

  if (!profile || !week) {
    return (
      <div className="p-6 text-center font-[Nunito]">
        <p className="text-lg font-bold text-slate-700">No plan yet.</p>
        <Link to="/onboarding" className="mt-4 inline-block font-bold text-rose-600 underline">
          Start onboarding
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 pb-28 font-[Nunito]">
      {needsPin ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-950">
          <span className="mr-1">🔒</span>
          Parent controls are locked. Tap Swap, Regenerate, or New day — you will be asked for your PIN
          once per browser session.
        </div>
      ) : null}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-rose-500">Smart timetable</p>
          <h1 className="text-3xl font-extrabold text-slate-900">{title}</h1>
          <p className="mt-1 font-semibold text-slate-600">
            Balanced rotation for {profile.childName} · Tap swap anytime.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => requestParent(() => regenWeek())}>
            Regenerate week
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-7">
        {week.days.map((day, dayIndex) => (
          <Card key={day.date} className="flex flex-col gap-3 !p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase text-slate-500">
                  {WEEKDAY_LABELS[dayIndex]}
                </p>
                <p className="text-lg font-extrabold text-slate-900">{day.date.slice(5)}</p>
              </div>
              <button
                type="button"
                className="rounded-xl bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700"
                onClick={() => requestParent(() => regenDay(dayIndex))}
              >
                New day
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {MEAL_ORDER.map((slot) => (
                <MealCell
                  key={slot}
                  meal={day[slot]}
                  slot={slot}
                  onSwap={() =>
                    requestParent(() =>
                      setSwapCtx({ dayIndex, slot, current: day[slot] }),
                    )
                  }
                  onRegen={() => requestParent(() => regenMeal(dayIndex, slot))}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>

      {swapCtx && profile ? (
        <SwapMealModal
          open
          profile={profile}
          slot={swapCtx.slot}
          current={swapCtx.current}
          onClose={() => setSwapCtx(null)}
          onPick={(meal) => swapMeal(swapCtx.dayIndex, swapCtx.slot, meal)}
        />
      ) : null}

      {pinHash ? (
        <ParentPinUnlockModal
          open={pinModalOpen}
          storedHash={pinHash}
          onVerified={onPinVerified}
          onClose={closePinModal}
        />
      ) : null}
    </div>
  )
}
