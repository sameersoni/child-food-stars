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

const TODAY = new Date().toISOString().slice(0, 10)

function MealCell({
  meal,
  slot,
  onSwap,
  onRegen,
  compact,
}: {
  meal: PlannedMeal
  slot: MealSlot
  onSwap: () => void
  onRegen: () => void
  compact: boolean
}) {
  const isSkipped = meal.foodId === 'skipped'

  return (
    <div
      className={`rounded-2xl border p-2 shadow-sm transition-all ${
        isSkipped
          ? 'border-slate-200 bg-slate-50'
          : 'border-white/50 bg-gradient-to-br from-white/90 to-rose-50/40'
      }`}
    >
      <div className="flex items-start gap-1.5">
        <span className={compact ? 'text-lg' : 'text-2xl'}>{meal.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className={`font-bold uppercase tracking-wide text-rose-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {MEAL_EMOJI[slot]} {compact ? MEAL_LABELS[slot].split(' ')[0] : MEAL_LABELS[slot]}
          </p>
          <p className={`truncate font-extrabold ${isSkipped ? 'text-slate-400 italic' : 'text-slate-900'} ${compact ? 'text-xs' : 'text-sm'}`}>
            {meal.name}
          </p>
          {!compact && meal.note ? (
            <p className="text-xs font-medium text-sky-700">{meal.note}</p>
          ) : null}
        </div>
      </div>
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            className="rounded-xl bg-white/80 px-2.5 py-1.5 text-xs font-bold text-rose-600 shadow-sm"
            onClick={onSwap}
          >
            Swap
          </button>
          <button
            type="button"
            className="rounded-xl bg-white/80 px-2.5 py-1.5 text-xs font-bold text-slate-600 shadow-sm"
            onClick={onRegen}
          >
            Regen
          </button>
        </div>
      )}
      {compact && (
        <div className="mt-1 flex gap-1">
          <button
            type="button"
            className="flex-1 rounded-lg bg-white/80 py-1 text-[10px] font-bold text-rose-600"
            onClick={onSwap}
          >
            Swap
          </button>
        </div>
      )}
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
  const [hoveredDay, setHoveredDay] = useState<number | null>(null)
  const pendingAction = useRef<(() => void) | null>(null)

  const title = useMemo(() => {
    if (!week) return 'Weekly plan'
    return `Week of ${week.weekStart}`
  }, [week])

  const needsPin = Boolean(pinHash) && !unlocked

  const requestParent = useCallback(
    (fn: () => void) => {
      if (!pinHash || unlocked) { fn(); return }
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

  const todayIndex = week.days.findIndex((d) => d.date === TODAY)

  return (
    <div className="mx-auto max-w-screen-xl space-y-4 p-4 pb-28 font-[Nunito]">
      {needsPin ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-950">
          <span className="mr-1">🔒</span>
          Parent controls are locked. Tap Swap or Regenerate — you will be asked for your PIN once per session.
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
        <Button variant="secondary" onClick={() => requestParent(() => regenWeek())}>
          Regenerate week
        </Button>
      </header>

      {/* Responsive grid: today's column is wider; others shrink; hover expands */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {week.days.map((day, dayIndex) => {
          const isToday = day.date === TODAY
          const isHovered = hoveredDay === dayIndex
          // today: flex-[2], hovered (non-today): flex-[2], others: flex-[1] but min width
          const flexClass = isToday
            ? 'flex-[2.5] min-w-[140px]'
            : isHovered
            ? 'flex-[2] min-w-[130px]'
            : 'flex-[1] min-w-[90px]'
          const compact = !isToday && !isHovered

          return (
            <div
              key={day.date}
              className={`transition-all duration-200 ${flexClass}`}
              onMouseEnter={() => setHoveredDay(dayIndex)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <Card
                className={`flex h-full flex-col gap-2 !p-2 transition-all duration-200 ${
                  isToday
                    ? '!bg-gradient-to-b from-rose-50 to-orange-50 ring-2 ring-rose-400 shadow-lg shadow-rose-200/50'
                    : isHovered
                    ? 'ring-1 ring-slate-300 shadow-md'
                    : 'opacity-90'
                }`}
              >
                {/* Day header */}
                <div className="flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <p className={`font-bold uppercase text-slate-500 truncate ${compact ? 'text-[10px]' : 'text-xs'}`}>
                      {isToday ? '📍 Today' : WEEKDAY_LABELS[dayIndex]}
                    </p>
                    <p className={`font-extrabold ${isToday ? 'text-rose-600 text-base' : compact ? 'text-xs text-slate-700' : 'text-sm text-slate-900'}`}>
                      {day.date.slice(5)}
                    </p>
                  </div>
                  {!compact && (
                    <button
                      type="button"
                      className="shrink-0 rounded-xl bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-700"
                      onClick={() => requestParent(() => regenDay(dayIndex))}
                    >
                      New
                    </button>
                  )}
                </div>

                {/* Meal cells */}
                <div className="flex flex-col gap-1.5">
                  {MEAL_ORDER.map((slot) => (
                    <MealCell
                      key={slot}
                      meal={day[slot]}
                      slot={slot}
                      compact={compact}
                      onSwap={() =>
                        requestParent(() =>
                          setSwapCtx({ dayIndex, slot, current: day[slot] }),
                        )
                      }
                      onRegen={() => requestParent(() => regenMeal(dayIndex, slot))}
                    />
                  ))}
                </div>

                {/* Compact: show regen on hover */}
                {compact && isHovered && (
                  <button
                    type="button"
                    className="mt-1 w-full rounded-xl bg-rose-100 py-1.5 text-xs font-bold text-rose-700"
                    onClick={() => requestParent(() => regenDay(dayIndex))}
                  >
                    New day
                  </button>
                )}
              </Card>
            </div>
          )
        })}
      </div>

      {/* Scroll hint when today is visible */}
      {todayIndex === -1 && (
        <p className="text-center text-xs font-semibold text-slate-400">
          Today is outside this plan week. Regenerate the week to see today.
        </p>
      )}

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
