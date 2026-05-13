import { useEffect, useMemo, useRef, useState } from 'react'
import { MEAL_LABELS, MEAL_ORDER } from '../../constants/meals'
import { useAppData } from '../../context/AppDataContext'
import { ConfettiBurst } from '../ui/Confetti'
import { ProgressRing } from '../ui/ProgressRing'
import { Card } from '../ui/Card'
import {
  STARS_ALL_MEALS_BONUS,
  STARS_PER_SLOT,
  STARS_WATER_GOAL,
  computeStarsEarned,
  computeWeekEligibility,
  maxStarsForDay,
} from '../../utils/stars'
import { getAudioContext, playStarChime } from '../../utils/sound'
import { randomQuote } from '../../data/quotes'
import { computeStreak } from '../../utils/achievements'
import type { ChildProfile, WeekPlan } from '../../types/models'

// ─── Reward picker shown to the kid at the start of the week ─────────────────

function RewardPicker({
  rewards,
  onPick,
}: {
  rewards: string[]
  onPick: (r: string) => void
}) {
  return (
    <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50">
      <p className="text-sm font-bold uppercase tracking-wide text-amber-700">New week, new goal!</p>
      <h2 className="mt-1 text-xl font-extrabold text-slate-900">
        Pick your reward for this week 🎁
      </h2>
      <p className="mt-1 text-sm font-semibold text-slate-600">
        Earn 80% of stars Mon–Sat to claim it on Sunday!
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {rewards.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onPick(r)}
            className="flex items-center gap-3 rounded-2xl border-2 border-amber-200 bg-white/80 px-4 py-3 text-left font-bold text-slate-900 transition hover:border-amber-400 hover:bg-amber-50"
          >
            <span className="text-2xl">🎁</span>
            {r}
          </button>
        ))}
      </div>
    </Card>
  )
}

// ─── Weekly reward progress card ──────────────────────────────────────────────

function WeekRewardCard({
  reward,
  pct,
  earned,
  max,
  eligible,
  isSunday,
}: {
  reward: string
  pct: number
  earned: number
  max: number
  eligible: boolean
  isSunday: boolean
}) {
  const barColor = eligible ? 'from-emerald-400 to-teal-400' : 'from-amber-400 to-orange-400'

  return (
    <Card
      className={`border-2 ${eligible ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50' : 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-700">This week's goal</p>
          <p className="mt-0.5 truncate text-lg font-extrabold text-slate-900">🎁 {reward}</p>
        </div>
        <span className={`shrink-0 text-2xl font-extrabold ${eligible ? 'text-emerald-600' : 'text-amber-600'}`}>
          {pct}%
        </span>
      </div>

      <div className="mt-3 h-4 overflow-hidden rounded-full bg-white/70 shadow-inner">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs font-semibold text-slate-500">
        {earned} / {max} stars · Mon–Sat · target 80%
      </p>

      {eligible && isSunday && (
        <div className="mt-3 rounded-2xl border border-emerald-300 bg-emerald-100 px-4 py-3 text-center">
          <p className="text-lg font-extrabold text-emerald-800">🎉 Reward unlocked today!</p>
          <p className="text-sm font-semibold text-emerald-700">
            It's Sunday — time to enjoy your reward!
          </p>
        </div>
      )}
      {eligible && !isSunday && (
        <p className="mt-3 text-sm font-bold text-emerald-700">
          🌟 On track! Keep it up through Saturday!
        </p>
      )}
      {!eligible && (
        <p className="mt-3 text-sm font-semibold text-amber-700">
          Need {80 - pct}% more to reach the goal — you can do it!
        </p>
      )}
    </Card>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

function StarsContent({
  profile,
  week,
}: {
  profile: ChildProfile
  week: WeekPlan
}) {
  const { state, upsertLog, getOrCreateLog, setSoundEnabled, setWeekReward } = useAppData()
  const waterGoal = profile.waterGoalMl

  const weekDates = useMemo(() => week.days.map((d) => d.date), [week])
  const sundayDate = weekDates[6] ?? ''

  const [selected, setSelected] = useState('')
  const activeDate = useMemo(() => {
    if (!weekDates.length) return ''
    if (selected && weekDates.includes(selected)) return selected
    const today = new Date().toISOString().slice(0, 10)
    return weekDates.includes(today) ? today : weekDates[0]
  }, [weekDates, selected])

  const isSundayActive = activeDate === sundayDate

  const [celebrate, setCelebrate] = useState(false)
  const [quote] = useState(() => randomQuote())
  const audioRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (state.settings.soundEnabled && !audioRef.current) {
      audioRef.current = getAudioContext()
    }
  }, [state.settings.soundEnabled])

  const streak = useMemo(
    () => computeStreak(state.dailyLogs, waterGoal),
    [state.dailyLogs, waterGoal],
  )

  const dayPlan = week.days.find((d) => d.date === activeDate)
  const log = getOrCreateLog(activeDate)
  const stars = computeStarsEarned(log.meals, log.waterMl, waterGoal)
  const maxStars = maxStarsForDay()

  // Reward state
  const rewards = state.rewards
  const chosenReward = state.weekRewards[week.weekStart]
  const weekElig = useMemo(
    () => computeWeekEligibility(week.days, state.dailyLogs, waterGoal),
    [week.days, state.dailyLogs, waterGoal],
  )

  const showRewardPicker = rewards.length > 0 && !chosenReward
  const showRewardProgress = rewards.length > 0 && !!chosenReward

  const toggleMeal = (slot: (typeof MEAL_ORDER)[number]) => {
    const next = { ...log.meals, [slot]: !log.meals[slot] }
    upsertLog({
      ...log,
      meals: next,
      starsEarned: computeStarsEarned(next, log.waterMl, waterGoal),
      updatedAt: new Date().toISOString(),
    })
    if (state.settings.soundEnabled) void playStarChime(audioRef.current)
    setCelebrate(true)
    window.setTimeout(() => setCelebrate(false), 1200)
  }

  const addWater = (ml: number) => {
    const nextMl = Math.max(0, log.waterMl + ml)
    upsertLog({
      ...log,
      waterMl: nextMl,
      starsEarned: computeStarsEarned(log.meals, nextMl, waterGoal),
      updatedAt: new Date().toISOString(),
    })
  }

  const waterPct = waterGoal > 0 ? Math.min(100, Math.round((log.waterMl / waterGoal) * 100)) : 0

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-28 font-[Nunito]">
      <ConfettiBurst active={celebrate} />

      <header className="text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-amber-600">Today's Stars</p>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Hi {profile.childName} {profile.avatarEmoji ?? '⭐'}
        </h1>
        <p className="mt-2 font-semibold text-slate-600">{quote}</p>
      </header>

      <Card className="flex items-center justify-between gap-3 !py-3">
        <div>
          <p className="text-xs font-bold uppercase text-orange-600">Streak</p>
          <p className="text-2xl font-extrabold text-slate-900">
            {streak} day{streak === 1 ? '' : 's'}
          </p>
          <p className="text-xs font-semibold text-slate-600">Keep the sparkle going!</p>
        </div>
        <span className="text-5xl">🔥</span>
      </Card>

      {/* Reward picker — shown when rewards exist but none chosen this week */}
      {showRewardPicker && (
        <RewardPicker
          rewards={rewards}
          onPick={(r) => setWeekReward(week.weekStart, r)}
        />
      )}

      {/* Weekly reward progress */}
      {showRewardProgress && (
        <WeekRewardCard
          reward={chosenReward}
          pct={weekElig.pct}
          earned={weekElig.earned}
          max={weekElig.max}
          eligible={weekElig.eligible}
          isSunday={new Date().toISOString().slice(0, 10) === sundayDate}
        />
      )}

      {/* Day picker */}
      <Card>
        <p className="text-sm font-bold text-slate-600">Pick a day</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {weekDates.map((d, i) => {
            const isSun = i === 6
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelected(d)}
                className={`flex min-h-[44px] flex-col items-center justify-center rounded-2xl px-3 py-1 text-sm font-extrabold transition ${
                  d === activeDate ? 'bg-rose-500 text-white shadow-lg' : 'bg-white/70 text-slate-700'
                }`}
              >
                <span>{d.slice(5)}</span>
                {isSun && (
                  <span className={`text-[9px] font-bold leading-none ${d === activeDate ? 'text-rose-100' : 'text-amber-500'}`}>
                    ☀️ relax
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* Sunday relaxed notice */}
      {isSundayActive && (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 text-center">
          <p className="text-3xl">☀️</p>
          <p className="mt-2 text-lg font-extrabold text-amber-800">Relaxed Sunday!</p>
          <p className="mt-1 text-sm font-semibold text-amber-700">
            Today doesn't count toward the weekly reward — enjoy a chill day!
            {weekElig.eligible ? " You've already earned it 🎉" : ''}
          </p>
        </Card>
      )}

      {/* Stars ring */}
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute -right-2 -top-2 animate-pulse-soft text-4xl">⭐</div>
          <ProgressRing value={stars} max={maxStars} size={140} stroke={12} label="stars" />
        </div>
        <div className="max-w-xs text-sm font-semibold text-slate-600">
          <p>
            Breakfast, snacks, lunch = <strong>1 star</strong> each. Dinner ={' '}
            <strong>2 stars</strong>.
          </p>
          <p className="mt-2">
            Water goal = <strong>{STARS_WATER_GOAL} stars</strong>. All meals bonus ={' '}
            <strong>{STARS_ALL_MEALS_BONUS} stars</strong>.
          </p>
        </div>
      </div>

      {/* Meals */}
      {dayPlan ? (
        <Card>
          <h2 className="text-xl font-extrabold text-slate-900">Meals</h2>
          <div className="mt-3 flex flex-col gap-3">
            {MEAL_ORDER.map((slot) => {
              const meal = dayPlan[slot]
              const done = log.meals[slot]
              const isSkipped = meal.foodId === 'skipped'

              if (isSkipped) {
                return (
                  <div
                    key={slot}
                    className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4"
                  >
                    <span className="text-3xl opacity-40">⏭️</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase text-slate-400">
                        {MEAL_LABELS[slot]} · skipped
                      </p>
                      <p className="font-extrabold italic text-slate-400">No meal planned</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400">0⭐</span>
                  </div>
                )
              }

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => toggleMeal(slot)}
                  className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
                    done ? 'border-emerald-400 bg-emerald-50' : 'border-white/60 bg-white/70'
                  }`}
                >
                  <span className="text-3xl">{meal.emoji}</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase text-slate-500">
                      {MEAL_LABELS[slot]} · +{STARS_PER_SLOT[slot]}⭐
                    </p>
                    <p className="font-extrabold text-slate-900">{meal.name}</p>
                  </div>
                  <span className="text-2xl">{done ? '✅' : '⭕'}</span>
                </button>
              )
            })}
          </div>
        </Card>
      ) : (
        <Card>No meals planned for this date in the current week view.</Card>
      )}

      {/* Water */}
      <Card>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold text-slate-900">Water power</h2>
          <span className="text-sm font-bold text-sky-700">{waterPct}%</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Goal: {waterGoal} ml · Logged: {log.waterMl} ml
        </p>
        <div className="mt-3 h-4 overflow-hidden rounded-full bg-white/70 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-all duration-500"
            style={{ width: `${waterPct}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex overflow-hidden rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => addWater(-250)}
              disabled={log.waterMl === 0}
              className="flex-1 bg-slate-50 py-3 text-sm font-extrabold text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            >
              −250
            </button>
            <span className="flex items-center px-2 text-xs font-bold text-slate-400">ml</span>
            <button
              type="button"
              onClick={() => addWater(250)}
              className="flex-1 bg-sky-50 py-3 text-sm font-extrabold text-sky-600 transition hover:bg-sky-100"
            >
              +250
            </button>
          </div>
          <div className="flex overflow-hidden rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => addWater(-500)}
              disabled={log.waterMl === 0}
              className="flex-1 bg-slate-50 py-3 text-sm font-extrabold text-slate-500 transition hover:bg-slate-100 disabled:opacity-30"
            >
              −500
            </button>
            <span className="flex items-center px-2 text-xs font-bold text-slate-400">ml</span>
            <button
              type="button"
              onClick={() => addWater(500)}
              className="flex-1 bg-sky-50 py-3 text-sm font-extrabold text-sky-600 transition hover:bg-sky-100"
            >
              +500
            </button>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            checked={state.settings.soundEnabled}
            onChange={(e) => {
              setSoundEnabled(e.target.checked)
              if (e.target.checked && !audioRef.current) audioRef.current = getAudioContext()
            }}
            className="h-5 w-5 accent-rose-500"
          />
          Gentle star sounds
        </label>
      </Card>
    </div>
  )
}

export function StarsPage() {
  const { state } = useAppData()
  const profile = state.profile
  const week = state.currentWeekPlan

  if (!profile || !week) {
    return (
      <div className="p-6 text-center font-[Nunito] text-slate-700">
        Complete onboarding to unlock Today's Stars.
      </div>
    )
  }

  return <StarsContent profile={profile} week={week} />
}
