import { useMemo } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { Card } from '../ui/Card'
import { ACHIEVEMENTS, computeStreak, totalStarsEver } from '../../utils/achievements'
import { computeStarsEarned, countCompletedMeals } from '../../utils/stars'
import { MEAL_ORDER } from '../../constants/meals'

function BarChart({
  data,
  max,
  label,
}: {
  data: { key: string; value: number; color: string }[]
  max: number
  label: string
}) {
  return (
    <div className="mt-3 space-y-2" aria-label={label}>
      {data.map((row) => (
        <div key={row.key} className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-xs font-bold text-slate-600">{row.key}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/70">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${max <= 0 ? 0 : Math.min(100, (row.value / max) * 100)}%`,
                backgroundColor: row.color,
              }}
            />
          </div>
          <span className="w-8 text-right text-xs font-extrabold text-slate-800">{row.value}</span>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsPage() {
  const { state } = useAppData()
  const profile = state.profile
  const week = state.currentWeekPlan
  const logs = state.dailyLogs

  const waterGoal = profile?.waterGoalMl ?? 1250

  const last7 = useMemo(() => {
    const out: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      out.push(
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      )
    }
    return out
  }, [])

  const rollups = useMemo(() => {
    return last7.map((date) => {
      const log = logs[date]
      const stars = log ? computeStarsEarned(log.meals, log.waterMl, waterGoal) : 0
      const water = log?.waterMl ?? 0
      const mealsDone = log ? countCompletedMeals(log.meals) : 0
      return { date, stars, water, mealsDone }
    })
  }, [last7, logs, waterGoal])

  const maxStars = Math.max(1, ...rollups.map((r) => r.stars))
  const maxWater = Math.max(1, ...rollups.map((r) => r.water), waterGoal)

  const streak = profile ? computeStreak(logs, waterGoal) : 0
  const totalStars = profile ? totalStarsEver(logs, waterGoal) : 0

  const fruitDiversity = useMemo(() => {
    if (!week) return 0
    const fruits = new Set<string>()
    week.days.forEach((d) => {
      MEAL_ORDER.forEach((slot) => {
        if (d[slot].tags.includes('fruit')) fruits.add(d[slot].name)
      })
    })
    return fruits.size
  }, [week])

  const skippedMeals = useMemo(() => {
    let skipped = 0
    last7.forEach((date) => {
      const log = logs[date]
      if (!log) return
      MEAL_ORDER.forEach((slot) => {
        if (!log.meals[slot]) skipped++
      })
    })
    return skipped
  }, [last7, logs])

  const completionPct = useMemo(() => {
    let total = 0
    let done = 0
    last7.forEach((date) => {
      const log = logs[date]
      if (!log) return
      MEAL_ORDER.forEach((slot) => {
        total++
        if (log.meals[slot]) done++
      })
    })
    return total === 0 ? 0 : Math.round((done / total) * 100)
  }, [last7, logs])

  if (!profile) {
    return <div className="p-6 text-center font-[Nunito]">Set up a profile to see analytics.</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-28 font-[Nunito]">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">Parent view</p>
        <h1 className="text-3xl font-extrabold text-slate-900">Analytics</h1>
        <p className="mt-1 font-semibold text-slate-600">
          Lightweight signals — designed to export cleanly later.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <p className="text-xs font-bold uppercase text-slate-500">Current streak</p>
          <p className="mt-1 text-4xl font-extrabold text-amber-600">{streak} days</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Days with strong participation (about 40%+ of max stars).
          </p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase text-slate-500">All-time stars</p>
          <p className="mt-1 text-4xl font-extrabold text-rose-600">{totalStars}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Every sparkle counts.</p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase text-slate-500">Meal completion (7d)</p>
          <p className="mt-1 text-4xl font-extrabold text-emerald-600">{completionPct}%</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Logged taps on planned meals.</p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase text-slate-500">Skipped meal slots (7d)</p>
          <p className="mt-1 text-4xl font-extrabold text-slate-800">{skippedMeals}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">No guilt — just visibility.</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-extrabold text-slate-900">Stars / day</h2>
        <BarChart
          label="Stars per day"
          max={maxStars}
          data={rollups.map((r) => ({
            key: r.date.slice(5),
            value: r.stars,
            color: '#fb7185',
          }))}
        />
      </Card>

      <Card>
        <h2 className="text-lg font-extrabold text-slate-900">Water / day</h2>
        <BarChart
          label="Water per day"
          max={maxWater}
          data={rollups.map((r) => ({
            key: r.date.slice(5),
            value: r.water,
            color: '#38bdf8',
          }))}
        />
      </Card>

      <Card>
        <h2 className="text-lg font-extrabold text-slate-900">Favorites in profile</h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {[...profile.favoriteFoods, ...profile.favoriteFruits, ...profile.favoriteVegetables].map(
            (f) => (
              <li
                key={f}
                className="rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-800"
              >
                {f}
              </li>
            ),
          )}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-extrabold text-slate-900">Fruit diversity (this plan week)</h2>
        <p className="mt-2 text-4xl font-extrabold text-purple-600">{fruitDiversity}</p>
        <p className="text-sm font-semibold text-slate-600">Distinct fruit-tagged meals in the grid.</p>
      </Card>

      <Card>
        <h2 className="text-lg font-extrabold text-slate-900">Achievements</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = state.achievements.some((x) => x.id === a.id)
            return (
              <div
                key={a.id}
                className={`rounded-2xl border-2 p-3 ${unlocked ? 'border-amber-300 bg-amber-50' : 'border-white/50 bg-white/40 opacity-70'}`}
              >
                <div className="text-2xl">{a.emoji}</div>
                <p className="font-extrabold text-slate-900">{a.title}</p>
                <p className="text-xs font-semibold text-slate-600">{a.description}</p>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
