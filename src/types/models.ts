/**
 * Core domain models for Food Stars.
 * Structured for future analytics export (daily logs, rewards, plans).
 */

export type MealSlot = 'breakfast' | 'schoolSnack' | 'lunch' | 'eveningSnack' | 'dinner'

export type DietType = 'vegetarian' | 'eggetarian' | 'non_vegetarian'

/** Monday = 0 … Sunday = 6 */
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface FoodItem {
  id: string
  name: string
  emoji: string
  /** Nutrition / behavior tags for the planner */
  tags: string[]
  /** Which meal slots this item is appropriate for */
  slots: MealSlot[]
  /** Diets that may include this food */
  diets: DietType[]
  /** 0 = whole, higher = more processed (planner penalizes) */
  processedScore?: number
}

export interface PlannedMeal {
  foodId: string
  name: string
  emoji: string
  tags: string[]
  /** Short reminder shown on cards (hydration / dairy rotation) */
  note?: string
}

export interface DayPlan extends Record<MealSlot, PlannedMeal> {
  date: string
}

export interface WeekPlan {
  /** ISO Monday date for this plan week */
  weekStart: string
  days: DayPlan[]
  generatedAt: string
  version: 2
}

export interface ChildProfile {
  childName: string
  age: number
  favoriteFoods: string[]
  favoriteFruits: string[]
  favoriteVegetables: string[]
  dislikedFoods: string[]
  diet: DietType
  waterGoalMl: number
  /** School days: weekday indices */
  schoolDays: WeekdayIndex[]
  schoolStartTime?: string
  schoolEndTime?: string
  onboardingComplete: boolean
  createdAt: string
  /** Optional avatar emoji */
  avatarEmoji?: string
}

export type DailyMealCompletion = Record<MealSlot, boolean>

export interface DailyLog {
  date: string
  meals: DailyMealCompletion
  waterMl: number
  /** Snapshot after day interactions */
  starsEarned: number
  updatedAt: string
}

export interface AchievementUnlock {
  id: string
  unlockedAt: string
}

export interface AppSettings {
  soundEnabled: boolean
  /** SHA-256 hex of PIN + salt; null = not configured yet */
  parentPinHash: string | null
}

export interface AppStateV2 {
  profile: ChildProfile | null
  /** Current editable week (multiple weeks can exist in history) */
  currentWeekPlan: WeekPlan | null
  /** date -> log */
  dailyLogs: Record<string, DailyLog>
  achievements: AchievementUnlock[]
  settings: AppSettings
}

/** Analytics-ready daily rollup (derived or stored) */
export interface AnalyticsDayRollup {
  date: string
  stars: number
  waterMl: number
  waterGoalMl: number
  mealsCompleted: number
  mealsTotal: number
  fruitTagsCount: number
}
