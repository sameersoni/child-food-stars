import { useMemo, useState } from 'react'
import { useAppData } from '../../context/AppDataContext'
import { MEAL_ORDER } from '../../constants/meals'
import { Card } from '../ui/Card'

interface NutrientCategory {
  key: string
  label: string
  emoji: string
  tags: string[]
  tip: string
}

const NUTRIENT_CATEGORIES: NutrientCategory[] = [
  {
    key: 'protein',
    label: 'Protein',
    emoji: '💪',
    tags: ['protein'],
    tip: 'Add dal, paneer, eggs, or chicken to boost protein tomorrow.',
  },
  {
    key: 'fruit',
    label: 'Fruit',
    emoji: '🍎',
    tags: ['fruit'],
    tip: 'Include a fruit as a snack — apples, bananas, or oranges work great.',
  },
  {
    key: 'vegetables',
    label: 'Vegetables',
    emoji: '🥦',
    tags: ['vegetables'],
    tip: 'Try adding a sabzi or salad to lunch or dinner tomorrow.',
  },
  {
    key: 'dairy',
    label: 'Dairy / Calcium',
    emoji: '🥛',
    tags: ['dairy', 'calcium'],
    tip: 'Add yogurt, milk, or paneer for strong bones.',
  },
  {
    key: 'fiber',
    label: 'Fiber',
    emoji: '🌾',
    tags: ['fiber', 'digestion'],
    tip: 'Oats, whole-grain roti, or fruits can improve digestion.',
  },
  {
    key: 'iron',
    label: 'Iron',
    emoji: '🫀',
    tags: ['iron'],
    tip: 'Spinach, rajma, or eggs are great iron sources for growing kids.',
  },
]

function getDateLabel(dateISO: string): string {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateISO === today) return 'Today'
  if (dateISO === yesterday) return 'Yesterday'
  return dateISO
}

export function NutritionReportPage() {
  const { state } = useAppData()
  const profile = state.profile
  const week = state.currentWeekPlan
  const logs = state.dailyLogs

  const weekDates = useMemo(() => week?.days.map((d) => d.date) ?? [], [week])

  const [selected, setSelected] = useState<string>(() => {
    const today = new Date().toISOString().slice(0, 10)
    if (weekDates.includes(today)) return today
    return weekDates[0] ?? ''
  })

  const activeDate = weekDates.includes(selected) ? selected : (weekDates[0] ?? '')

  const dayPlan = week?.days.find((d) => d.date === activeDate)
  const log = activeDate ? logs[activeDate] : undefined

  const { coverage, completedCount, totalCount, allDone } = useMemo(() => {
    if (!dayPlan || !log) {
      return { coverage: {} as Record<string, boolean>, completedCount: 0, totalCount: 0, allDone: false }
    }

    const coveredTags = new Set<string>()
    let completedCount = 0
    const totalCount = MEAL_ORDER.length

    MEAL_ORDER.forEach((slot) => {
      if (log.meals[slot]) {
        completedCount++
        dayPlan[slot].tags.forEach((t) => coveredTags.add(t))
      }
    })

    const coverage: Record<string, boolean> = {}
    NUTRIENT_CATEGORIES.forEach((cat) => {
      coverage[cat.key] = cat.tags.some((t) => coveredTags.has(t))
    })

    return {
      coverage,
      completedCount,
      totalCount,
      allDone: completedCount === totalCount,
    }
  }, [dayPlan, log])

  const missedCategories = NUTRIENT_CATEGORIES.filter((c) => !coverage[c.key])
  const hitCategories = NUTRIENT_CATEGORIES.filter((c) => coverage[c.key])

  const overallScore = Math.round((hitCategories.length / NUTRIENT_CATEGORIES.length) * 100)

  const scoreColor =
    overallScore >= 80 ? 'text-emerald-600' : overallScore >= 50 ? 'text-amber-500' : 'text-rose-600'

  const scoreLabel =
    overallScore >= 80 ? 'Excellent balance! 🌟' : overallScore >= 50 ? 'Pretty good! 👍' : 'Room to improve 💪'

  if (!profile) {
    return (
      <div className="p-6 text-center font-[Nunito] text-slate-700">
        Complete onboarding to see the nutrition report.
      </div>
    )
  }

  if (!week || weekDates.length === 0) {
    return (
      <div className="p-6 text-center font-[Nunito] text-slate-700">
        No meal plan found. Generate a plan first.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 pb-28 font-[Nunito]">
      <header>
        <p className="text-sm font-bold uppercase tracking-widest text-purple-600">Nutrition Report</p>
        <h1 className="text-3xl font-extrabold text-slate-900">
          How did {profile.childName} eat?
        </h1>
        <p className="mt-1 font-semibold text-slate-600">
          Based on completed meals for the selected day.
        </p>
      </header>

      {/* Day selector */}
      <Card>
        <p className="text-sm font-bold text-slate-600">Pick a day</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {weekDates.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelected(d)}
              className={`min-h-[44px] rounded-2xl px-4 py-2 text-sm font-extrabold transition ${
                d === activeDate ? 'bg-purple-500 text-white shadow-lg' : 'bg-white/70 text-slate-700'
              }`}
            >
              {getDateLabel(d)}
            </button>
          ))}
        </div>
      </Card>

      {/* Meal completion status */}
      {log ? (
        <Card className="flex items-center gap-4">
          <div className="text-5xl">{allDone ? '🎉' : '⏳'}</div>
          <div>
            <p className="font-extrabold text-slate-900">
              {completedCount} of {totalCount} meals completed
            </p>
            <p className="text-sm font-semibold text-slate-600">
              {allDone
                ? 'All meals done — full report below!'
                : 'Mark more meals done on the Stars page for a complete report.'}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="font-semibold text-slate-600">
            No meals logged for this day yet. Head to the Stars tab to mark meals as completed.
          </p>
        </Card>
      )}

      {/* Overall nutrition score */}
      {completedCount > 0 && (
        <>
          <Card className="text-center">
            <p className="text-xs font-bold uppercase text-slate-500">Nutrition score</p>
            <p className={`mt-2 text-6xl font-extrabold ${scoreColor}`}>{overallScore}%</p>
            <p className="mt-2 text-lg font-bold text-slate-700">{scoreLabel}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {hitCategories.length} of {NUTRIENT_CATEGORIES.length} nutrient groups covered
            </p>
          </Card>

          {/* Covered nutrients */}
          {hitCategories.length > 0 && (
            <Card>
              <h2 className="text-lg font-extrabold text-slate-900">What was covered ✅</h2>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {hitCategories.map((cat) => (
                  <div
                    key={cat.key}
                    className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2"
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="text-sm font-bold text-emerald-800">{cat.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Missed nutrients + suggestions */}
          {missedCategories.length > 0 && (
            <Card>
              <h2 className="text-lg font-extrabold text-slate-900">
                What to add tomorrow 💡
              </h2>
              <div className="mt-3 flex flex-col gap-3">
                {missedCategories.map((cat) => (
                  <div
                    key={cat.key}
                    className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{cat.emoji}</span>
                      <span className="font-extrabold text-amber-900">{cat.label} missing</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-amber-800">{cat.tip}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Water check */}
          {log && (
            <Card>
              <h2 className="text-lg font-extrabold text-slate-900">Hydration 💧</h2>
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                  <span>{log.waterMl} ml logged</span>
                  <span>Goal: {profile.waterGoalMl} ml</span>
                </div>
                <div className="mt-2 h-4 overflow-hidden rounded-full bg-white/70 shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-all"
                    style={{
                      width: `${Math.min(100, profile.waterGoalMl > 0 ? Math.round((log.waterMl / profile.waterGoalMl) * 100) : 0)}%`,
                    }}
                  />
                </div>
                {log.waterMl < profile.waterGoalMl ? (
                  <p className="mt-2 text-sm font-semibold text-sky-700">
                    Needs {profile.waterGoalMl - log.waterMl} ml more — keep sipping!
                  </p>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-emerald-700">
                    Water goal reached! Excellent hydration 🎉
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* All-green message */}
          {missedCategories.length === 0 && (
            <Card className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 text-center py-6">
              <p className="text-5xl">🌟</p>
              <p className="mt-3 text-xl font-extrabold text-emerald-800">
                Perfect nutrition balance today!
              </p>
              <p className="mt-2 text-sm font-semibold text-emerald-700">
                {profile.childName} covered all major nutrient groups. Amazing work!
              </p>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
