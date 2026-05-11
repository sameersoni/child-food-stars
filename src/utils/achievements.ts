import type { AchievementUnlock, DailyLog, WeekPlan } from '../types/models'
import { computeStarsEarned, maxStarsForDay } from './stars'

export interface AchievementDef {
  id: string
  title: string
  description: string
  emoji: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_star',
    title: 'First Sparkle',
    description: 'Earned your first stars!',
    emoji: '✨',
  },
  {
    id: 'streak_3',
    title: '3-Day Streak',
    description: 'Three days in a row of great effort!',
    emoji: '🔥',
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Seven day streak!',
    emoji: '🏅',
  },
  {
    id: 'super_healthy_day',
    title: 'Super Healthy Day',
    description: 'All meals, water goal, and colorful fruits!',
    emoji: '🌈',
  },
  {
    id: 'hydration_hero',
    title: 'Hydration Hero',
    description: 'Hit water goal 5 times in a week!',
    emoji: '💧',
  },
  {
    id: 'star_collector',
    title: 'Star Collector',
    description: 'Earned 50 total stars!',
    emoji: '⭐',
  },
]

export function hasAchievement(list: AchievementUnlock[], id: string): boolean {
  return list.some((a) => a.id === id)
}

function sortedLogDates(logs: Record<string, DailyLog>): string[] {
  return Object.keys(logs).sort()
}

/** Streak: consecutive calendar days (ending today or yesterday) with stars >= 40% of max */
export function computeStreak(logs: Record<string, DailyLog>, waterGoalMl: number): number {
  const threshold = Math.ceil(maxStarsForDay() * 0.4)
  const dates = sortedLogDates(logs).filter((d) => {
    const log = logs[d]
    const stars = computeStarsEarned(log.meals, log.waterMl, waterGoalMl)
    return stars >= threshold
  })
  if (dates.length === 0) return 0

  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  const has = (iso: string) => dates.includes(iso)

  // Allow streak if "today" not logged yet — start from yesterday
  const fmt = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  if (!has(fmt(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
  }

  while (has(fmt(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function totalStarsEver(logs: Record<string, DailyLog>, waterGoalMl: number): number {
  return Object.values(logs).reduce(
    (acc, log) => acc + computeStarsEarned(log.meals, log.waterMl, waterGoalMl),
    0,
  )
}

/** Evaluate new achievements from current logs + optional week plan for fruit diversity */
export function evaluateAchievements(
  logs: Record<string, DailyLog>,
  waterGoalMl: number,
  weekPlan: WeekPlan | null,
  existing: AchievementUnlock[],
): AchievementUnlock[] {
  const now = new Date().toISOString()
  const next = [...existing]
  const push = (id: string) => {
    if (!hasAchievement(next, id)) next.push({ id, unlockedAt: now })
  }

  const total = totalStarsEver(logs, waterGoalMl)
  if (total >= 1) push('first_star')
  if (total >= 50) push('star_collector')

  const streak = computeStreak(logs, waterGoalMl)
  if (streak >= 3) push('streak_3')
  if (streak >= 7) push('streak_7')

  // Hydration hero: 5 distinct days in last 7 days hit water
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return iso
  })
  let waterHits = 0
  last7.forEach((iso) => {
    const l = logs[iso]
    if (l && waterGoalMl > 0 && l.waterMl >= waterGoalMl) waterHits++
  })
  if (waterHits >= 5) push('hydration_hero')

  // Super healthy day: any day with all meals + water + (optional) fruit diversity from plan
  Object.entries(logs).forEach(([iso, log]) => {
    const all =
      log.meals.breakfast &&
      log.meals.schoolSnack &&
      log.meals.lunch &&
      log.meals.eveningSnack &&
      log.meals.dinner
    const waterOk = waterGoalMl > 0 && log.waterMl >= waterGoalMl
    let fruitDiversity = 0
    if (weekPlan) {
      const day = weekPlan.days.find((x) => x.date === iso)
      if (day) {
        const meals = [day.breakfast, day.schoolSnack, day.lunch, day.eveningSnack, day.dinner]
        fruitDiversity = new Set(meals.filter((m) => m.tags.includes('fruit')).map((m) => m.name)).size
      }
    }
    if (all && waterOk && fruitDiversity >= 2) push('super_healthy_day')
  })

  return next
}
