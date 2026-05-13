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
  maxStarsForDay,
} from '../../utils/stars'
import { getAudioContext, playStarChime } from '../../utils/sound'
import { randomQuote } from '../../data/quotes'
import { computeStreak } from '../../utils/achievements'
import type { ChildProfile, WeekPlan } from '../../types/models'

function StarsContent({
  profile,
  week,
}: {
  profile: ChildProfile
  week: WeekPlan
}) {
  const { state, upsertLog, getOrCreateLog, setSoundEnabled } = useAppData()
  const waterGoal = profile.waterGoalMl

  const weekDates = useMemo(() => week.days.map((d) => d.date), [week])
  const [selected, setSelected] = useState('')
  const activeDate = useMemo(() => {
    if (!weekDates.length) return ''
    if (selected && weekDates.includes(selected)) return selected
    const today = new Date().toISOString().slice(0, 10)
    return weekDates.includes(today) ? today : weekDates[0]
  }, [weekDates, selected])

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
        <p className="text-sm font-bold uppercase tracking-widest text-amber-600">Today’s Stars</p>
        <h1 className="text-3xl font-extrabold text-slate-900">Hi {profile.childName} {profile.avatarEmoji ?? '⭐'}</h1>
        <p className="mt-2 font-semibold text-slate-600">{quote}</p>
      </header>

      <Card className="flex items-center justify-between gap-3 !py-3">
        <div>
          <p className="text-xs font-bold uppercase text-orange-600">Streak</p>
          <p className="text-2xl font-extrabold text-slate-900">{streak} day{streak === 1 ? '' : 's'}</p>
          <p className="text-xs font-semibold text-slate-600">Keep the sparkle going!</p>
        </div>
        <span className="text-5xl">🔥</span>
      </Card>

      <Card>
        <p className="text-sm font-bold text-slate-600">Pick a day</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {weekDates.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelected(d)}
              className={`min-h-[44px] rounded-2xl px-4 py-2 text-sm font-extrabold ${
                d === activeDate ? 'bg-rose-500 text-white shadow-lg' : 'bg-white/70 text-slate-700'
              }`}
            >
              {d.slice(5)}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute -right-2 -top-2 animate-pulse-soft text-4xl">⭐</div>
          <ProgressRing value={stars} max={maxStars} size={140} stroke={12} label="stars" />
        </div>
        <div className="max-w-xs text-sm font-semibold text-slate-600">
          <p>
            Breakfast, snacks, lunch = <strong>1 star</strong> each. Dinner = <strong>2 stars</strong>.
          </p>
          <p className="mt-2">
            Water goal = <strong>{STARS_WATER_GOAL} stars</strong>. All meals bonus ={' '}
            <strong>{STARS_ALL_MEALS_BONUS} stars</strong>.
          </p>
        </div>
      </div>

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
                      <p className="font-extrabold text-slate-400 italic">No meal planned</p>
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
          <div className="flex rounded-2xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => addWater(-250)}
              disabled={log.waterMl === 0}
              className="flex-1 py-3 text-sm font-extrabold text-slate-500 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 transition"
            >
              −250
            </button>
            <span className="flex items-center px-2 text-xs font-bold text-slate-400">ml</span>
            <button
              type="button"
              onClick={() => addWater(250)}
              className="flex-1 py-3 text-sm font-extrabold text-sky-600 bg-sky-50 hover:bg-sky-100 transition"
            >
              +250
            </button>
          </div>
          <div className="flex rounded-2xl border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => addWater(-500)}
              disabled={log.waterMl === 0}
              className="flex-1 py-3 text-sm font-extrabold text-slate-500 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 transition"
            >
              −500
            </button>
            <span className="flex items-center px-2 text-xs font-bold text-slate-400">ml</span>
            <button
              type="button"
              onClick={() => addWater(500)}
              className="flex-1 py-3 text-sm font-extrabold text-sky-600 bg-sky-50 hover:bg-sky-100 transition"
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
        Complete onboarding to unlock Today’s Stars.
      </div>
    )
  }

  return <StarsContent profile={profile} week={week} />
}
