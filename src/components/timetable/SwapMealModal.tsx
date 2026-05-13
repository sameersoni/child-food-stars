import { useMemo, useState } from 'react'
import type { ChildProfile, MealSlot, PlannedMeal } from '../../types/models'
import { swapSuggestions } from '../../engine/timetableEngine'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { MEAL_LABELS } from '../../constants/meals'

const FOOD_EMOJIS = ['🍽️', '🥘', '🍜', '🍛', '🥗', '🫓', '🍳', '🥙', '🌮', '🍱', '🥞', '🍲']

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
  const [customName, setCustomName] = useState('')
  const [customEmoji, setCustomEmoji] = useState('🍽️')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const alts = useMemo(
    () => (open ? swapSuggestions(profile, current, slot, 8) : []),
    [open, profile, current, slot],
  )

  if (!open) return null

  const handleCustomAdd = () => {
    const name = customName.trim()
    if (!name) return
    const meal: PlannedMeal = {
      foodId: `custom_${Date.now()}`,
      name,
      emoji: customEmoji,
      tags: ['custom'],
    }
    onPick(meal)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="swap-title"
    >
      <Card className="max-h-[90dvh] w-full max-w-md overflow-y-auto p-5 shadow-2xl">
        <h3 id="swap-title" className="text-xl font-extrabold text-slate-900">
          Swap {MEAL_LABELS[slot]}
        </h3>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Type any food, or pick from the suggestions below.
        </p>

        {/* ── Custom food entry ───────────────────────────────── */}
        <div className="mt-4 rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/60 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-rose-600">
            Enter any food
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="shrink-0 rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-2xl"
              onClick={() => setShowEmojiPicker((v) => !v)}
              title="Pick an emoji"
            >
              {customEmoji}
            </button>
            <input
              className="min-h-[48px] flex-1 rounded-2xl border border-white/60 bg-white/80 px-4 text-base font-semibold outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="e.g. Maggi Noodles, Poha…"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
            />
          </div>
          {showEmojiPicker ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {FOOD_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { setCustomEmoji(e); setShowEmojiPicker(false) }}
                  className={`rounded-xl border-2 p-2 text-xl ${customEmoji === e ? 'border-rose-400 bg-rose-100' : 'border-transparent bg-white/70'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          ) : null}
          <Button
            className="mt-3 w-full"
            disabled={!customName.trim()}
            onClick={handleCustomAdd}
          >
            Use this food
          </Button>
        </div>

        {/* ── Smart suggestions ───────────────────────────────── */}
        {alts.length > 0 ? (
          <>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500">
              Smart suggestions
            </p>
            <div className="mt-2 flex flex-col gap-2">
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
                    <span className="text-xs font-medium text-slate-500">
                      {m.tags.slice(0, 5).join(' · ')}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {/* ── Skip meal ───────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => {
            onPick({ foodId: 'skipped', name: 'Meal skipped', emoji: '⏭️', tags: [] })
            onClose()
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3 text-sm font-bold text-slate-500 transition hover:border-slate-400"
        >
          ⏭️ Skip this meal (nothing eaten)
        </button>

        <Button variant="secondary" className="mt-2 w-full" onClick={onClose}>
          Close
        </Button>
      </Card>
    </div>
  )
}
