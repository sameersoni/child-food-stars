import type { ChildProfile, DayPlan, FoodItem, MealSlot, PlannedMeal, WeekPlan } from '../types/models'
import {
  expandWithCustomFavorites,
  foodsForSlot,
} from '../data/foodDatabase'
import { addDays, formatISO, startOfWeekMonday } from '../utils/dates'

const MEAL_ORDER: MealSlot[] = [
  'breakfast',
  'schoolSnack',
  'lunch',
  'eveningSnack',
  'dinner',
]

/** Deterministic PRNG for stable regen when seed fixed */
function hashString(s: string): number {
  let h = 1779033703
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function matchesDislike(name: string, dislikes: string[]): boolean {
  const lower = name.toLowerCase()
  return dislikes.some((d) => d.trim() && lower.includes(d.trim().toLowerCase()))
}

function matchesFavorite(name: string, favorites: string[]): boolean {
  const lower = name.toLowerCase()
  return favorites.some((f) => f.trim() && lower.includes(f.trim().toLowerCase()))
}

function buildPool(profile: ChildProfile, slot: MealSlot): FoodItem[] {
  let pool = foodsForSlot(slot, profile.diet)
  pool = pool.filter((f) => !matchesDislike(f.name, profile.dislikedFoods))

  const extras: string[] = [...profile.favoriteFoods]
  if (slot === 'schoolSnack' || slot === 'eveningSnack' || slot === 'breakfast') {
    extras.push(...profile.favoriteFruits)
  }
  if (slot === 'lunch' || slot === 'dinner' || slot === 'breakfast') {
    extras.push(...profile.favoriteVegetables)
  }

  pool = expandWithCustomFavorites(pool, extras, slot, profile.diet)

  if (pool.length === 0) {
    return foodsForSlot(slot, profile.diet).slice(0, 3)
  }
  return pool
}

interface PickContext {
  previousFoodId?: string
  usedTodayIds: Set<string>
  tagTally: Record<string, number>
  weekFoodCounts: Record<string, number>
  dairyToday: number
  fruitToday: number
  lunchWasHeavy: boolean
  rand: () => number
}

function scoreFood(
  f: FoodItem,
  slot: MealSlot,
  profile: ChildProfile,
  ctx: PickContext,
): number {
  let score = 50 + ctx.rand() * 8

  const fav =
    matchesFavorite(f.name, profile.favoriteFoods) ||
    (f.tags.includes('fruit') && matchesFavorite(f.name, profile.favoriteFruits)) ||
    (f.tags.includes('vegetables') && matchesFavorite(f.name, profile.favoriteVegetables))
  if (fav) score += 18

  if (f.id === ctx.previousFoodId) score -= 80
  if (ctx.usedTodayIds.has(f.id)) score -= 40

  const wc = ctx.weekFoodCounts[f.id] ?? 0
  score -= wc * 5

  const processed = f.processedScore ?? 0.2
  score -= processed * 12

  if (f.tags.includes('heavy') && (slot === 'dinner' || slot === 'schoolSnack')) score -= 8
  if (ctx.lunchWasHeavy && slot === 'dinner' && f.tags.includes('heavy')) score -= 25

  // Slot shaping
  if (slot === 'schoolSnack') {
    if (f.tags.includes('fruit')) score += 10
    if (f.tags.includes('hydration-friendly')) score += 6
    if (f.tags.includes('dairy')) {
      score += 4
      score -= ctx.dairyToday * 8
    }
  }
  if (slot === 'eveningSnack') {
    if (f.tags.includes('fruit') || f.tags.includes('vegetables')) score += 8
    if (f.tags.includes('dairy')) score -= ctx.dairyToday * 6
  }
  if (slot === 'breakfast') {
    if (f.tags.includes('dairy') || f.tags.includes('carbs')) score += 4
  }
  if (slot === 'lunch') {
    if (f.tags.includes('protein')) score += 6
    if (f.tags.includes('vegetables')) score += 5
  }
  if (slot === 'dinner') {
    if (f.tags.includes('light') || f.tags.includes('vegetables')) score += 5
    if (f.tags.includes('protein')) score += 3
  }

  // Variety: underrepresented tags get a nudge
  ;['protein', 'vegetables', 'fruit', 'fiber'].forEach((t) => {
    if (f.tags.includes(t)) {
      const tally = ctx.tagTally[t] ?? 0
      score += Math.max(0, 4 - tally) * 2
    }
  })

  // Penalize repeating same macro feel
  if (f.tags.includes('processed')) {
    const p = ctx.tagTally['processed'] ?? 0
    score -= p * 10
  }

  return score
}

function pickMeal(
  slot: MealSlot,
  profile: ChildProfile,
  ctx: PickContext,
): FoodItem {
  const pool = buildPool(profile, slot)
  let best: FoodItem = pool[0]
  let bestScore = -Infinity
  pool.forEach((f) => {
    const s = scoreFood(f, slot, profile, ctx)
    if (s > bestScore) {
      bestScore = s
      best = f
    }
  })
  return best
}

function toPlanned(f: FoodItem, slot: MealSlot): PlannedMeal {
  let note: string | undefined
  if (f.tags.includes('dairy') && (slot === 'schoolSnack' || slot === 'eveningSnack')) {
    note = 'Yogurt / dairy rotation'
  }
  if (f.tags.includes('fruit') || f.tags.includes('hydration-friendly')) {
    note = note ? `${note} · Hydrate!` : 'Hydration boost'
  }
  return {
    foodId: f.id,
    name: f.name,
    emoji: f.emoji,
    tags: f.tags,
    note,
  }
}

function updateAfterPick(f: FoodItem, ctx: PickContext): void {
  ctx.previousFoodId = f.id
  ctx.usedTodayIds.add(f.id)
  ctx.weekFoodCounts[f.id] = (ctx.weekFoodCounts[f.id] ?? 0) + 1
  f.tags.forEach((t) => {
    ctx.tagTally[t] = (ctx.tagTally[t] ?? 0) + 1
  })
  if (f.tags.includes('dairy')) ctx.dairyToday++
  if (f.tags.includes('fruit')) ctx.fruitToday++
}

export function generateDayPlan(
  profile: ChildProfile,
  dateISO: string,
  profileSeed: string,
  weekFoodCounts: Record<string, number>,
): DayPlan {
  const rand = mulberry32(hashString(`${profileSeed}_${dateISO}`))
  const ctx: PickContext = {
    usedTodayIds: new Set(),
    tagTally: {},
    weekFoodCounts: { ...weekFoodCounts },
    dairyToday: 0,
    fruitToday: 0,
    lunchWasHeavy: false,
    rand,
  }

  const day: Partial<Record<MealSlot, PlannedMeal>> = {}

  MEAL_ORDER.forEach((slot) => {
    const food = pickMeal(slot, profile, ctx)
    day[slot] = toPlanned(food, slot)
    if (slot === 'lunch') ctx.lunchWasHeavy = food.tags.includes('heavy')
    updateAfterPick(food, ctx)
  })

  return {
    date: dateISO,
    breakfast: day.breakfast!,
    schoolSnack: day.schoolSnack!,
    lunch: day.lunch!,
    eveningSnack: day.eveningSnack!,
    dinner: day.dinner!,
  }
}

export function generateWeekPlan(profile: ChildProfile, anchorDate?: Date): WeekPlan {
  const monday = startOfWeekMonday(anchorDate ?? new Date())
  const seed = `${profile.childName}_${profile.createdAt}`
  const weekFoodCounts: Record<string, number> = {}
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i)
    const iso = formatISO(d)
    const plan = generateDayPlan(profile, iso, seed, weekFoodCounts)
    return plan
  })
  return {
    weekStart: formatISO(monday),
    days,
    generatedAt: new Date().toISOString(),
    version: 2,
  }
}

export function regenerateSingleMeal(
  profile: ChildProfile,
  week: WeekPlan,
  dayIndex: number,
  slot: MealSlot,
): WeekPlan {
  const day = week.days[dayIndex]
  if (!day) return week
  const counts: Record<string, number> = {}
  week.days.forEach((d, di) => {
    MEAL_ORDER.forEach((s) => {
      if (di === dayIndex && s === slot) return
      const id = d[s].foodId
      counts[id] = (counts[id] ?? 0) + 1
    })
  })
  const rand = mulberry32(hashString(`regen_${day.date}_${slot}_${Date.now()}`))
  const slotIdx = MEAL_ORDER.indexOf(slot)
  const prevSlot = slotIdx > 0 ? MEAL_ORDER[slotIdx - 1] : undefined
  const prevId = prevSlot ? day[prevSlot].foodId : undefined
  const tagTally: Record<string, number> = {}
  MEAL_ORDER.forEach((s) => {
    if (s === slot) return
    day[s].tags.forEach((t) => {
      tagTally[t] = (tagTally[t] ?? 0) + 1
    })
  })
  const dairyToday = MEAL_ORDER.filter((s) => s !== slot).reduce(
    (acc, s) => acc + (day[s].tags.includes('dairy') ? 1 : 0),
    0,
  )
  const lunchWasHeavy = slot !== 'lunch' && day.lunch.tags.includes('heavy')

  const ctx: PickContext = {
    previousFoodId: prevId,
    usedTodayIds: new Set(
      MEAL_ORDER.filter((s) => s !== slot).map((s) => day[s].foodId),
    ),
    tagTally,
    weekFoodCounts: counts,
    dairyToday,
    fruitToday: MEAL_ORDER.filter((s) => s !== slot && day[s].tags.includes('fruit')).length,
    lunchWasHeavy,
    rand,
  }
  const food = pickMeal(slot, profile, ctx)
  const nextDay: DayPlan = { ...day, [slot]: toPlanned(food, slot) }
  const days = week.days.map((d, i) => (i === dayIndex ? nextDay : d))
  return { ...week, days, generatedAt: new Date().toISOString() }
}

export function regenerateFullDay(
  profile: ChildProfile,
  week: WeekPlan,
  dayIndex: number,
): WeekPlan {
  const day = week.days[dayIndex]
  if (!day) return week
  const counts: Record<string, number> = {}
  week.days.forEach((d, di) => {
    if (di === dayIndex) return
    MEAL_ORDER.forEach((s) => {
      const id = d[s].foodId
      counts[id] = (counts[id] ?? 0) + 1
    })
  })
  const newDay = generateDayPlan(profile, day.date, `${profile.childName}_day_${Date.now()}`, counts)
  const days = week.days.map((d, i) => (i === dayIndex ? newDay : d))
  return { ...week, days, generatedAt: new Date().toISOString() }
}

export function swapSuggestions(
  profile: ChildProfile,
  current: PlannedMeal,
  slot: MealSlot,
  limit = 6,
): PlannedMeal[] {
  const pool = buildPool(profile, slot).filter((f) => f.id !== current.foodId)
  const rand = mulberry32(hashString(`swap_${current.foodId}_${Date.now()}`))
  const scored = pool
    .map((f) => ({
      f,
      s: scoreFood(f, slot, profile, {
        previousFoodId: current.foodId,
        usedTodayIds: new Set([current.foodId]),
        tagTally: {},
        weekFoodCounts: {},
        dairyToday: 0,
        fruitToday: 0,
        lunchWasHeavy: false,
        rand,
      }),
    }))
    .sort((a, b) => b.s - a.s)
  return scored.slice(0, limit).map((x) => toPlanned(x.f, slot))
}

export { MEAL_ORDER }
