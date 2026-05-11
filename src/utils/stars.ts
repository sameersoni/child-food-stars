import type { DailyMealCompletion, MealSlot } from '../types/models'

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

export function emptyMeals(): DailyMealCompletion {
  return {
    breakfast: false,
    schoolSnack: false,
    lunch: false,
    eveningSnack: false,
    dinner: false,
  }
}
