import type { DailyLog, DailyMealCompletion, MealSlot } from '../types/models'

/** Star rules: positive rewards only. */
export const STARS_PER_SLOT: Record<MealSlot, number> = {
  breakfast: 1,
  schoolSnack: 1,
  lunch: 1,
  eveningSnack: 1,
  dinner: 2,
}

export const STARS_WATER_GOAL = 2
/** Bonus when all five meal slots are completed */
export const STARS_ALL_MEALS_BONUS = 3

export function maxStarsForDay(): number {
  let m = 0
  ;(Object.keys(STARS_PER_SLOT) as MealSlot[]).forEach((s) => {
    m += STARS_PER_SLOT[s]
  })
  m += STARS_WATER_GOAL + STARS_ALL_MEALS_BONUS
  return m
}

export function countCompletedMeals(meals: DailyMealCompletion): number {
  return Object.values(meals).filter(Boolean).length
}

export function computeStarsEarned(
  meals: DailyMealCompletion,
  waterMl: number,
  waterGoalMl: number,
): number {
  let stars = 0
  ;(Object.keys(STARS_PER_SLOT) as MealSlot[]).forEach((slot) => {
    if (meals[slot]) stars += STARS_PER_SLOT[slot]
  })
  if (waterGoalMl > 0 && waterMl >= waterGoalMl) stars += STARS_WATER_GOAL
  const allMeals =
    meals.breakfast &&
    meals.schoolSnack &&
    meals.lunch &&
    meals.eveningSnack &&
    meals.dinner
  if (allMeals) stars += STARS_ALL_MEALS_BONUS
  return stars
}

/**
 * Mon–Sat eligibility for the weekly reward.
 * Sunday (index 6) is a relaxed day and excluded from the target.
 */
export function computeWeekEligibility(
  weekDays: { date: string }[],
  dailyLogs: Record<string, DailyLog>,
  waterGoalMl: number,
): { earned: number; max: number; pct: number; eligible: boolean } {
  const monToSat = weekDays.slice(0, 6)
  const max = maxStarsForDay() * monToSat.length
  let earned = 0
  monToSat.forEach(({ date }) => {
    const log = dailyLogs[date]
    if (log) earned += computeStarsEarned(log.meals, log.waterMl, waterGoalMl)
  })
  const pct = max > 0 ? Math.round((earned / max) * 100) : 0
  return { earned, max, pct, eligible: pct >= 80 }
}

export function emptyMeals(): DailyMealCompletion {
  return {
    breakfast: false,
    schoolSnack: false,
    lunch: false,
    eveningSnack: false,
    dinner: false,
  }
}
