import type { MealSlot } from '../types/models'

export const MEAL_ORDER: MealSlot[] = [
  'breakfast',
  'schoolSnack',
  'lunch',
  'eveningSnack',
  'dinner',
]

export const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  schoolSnack: 'School snack',
  lunch: 'Lunch',
  eveningSnack: 'Evening snack',
  dinner: 'Dinner',
}

export const MEAL_EMOJI: Record<MealSlot, string> = {
  breakfast: '🌅',
  schoolSnack: '🎒',
  lunch: '🍱',
  eveningSnack: '🍪',
  dinner: '🌙',
}
