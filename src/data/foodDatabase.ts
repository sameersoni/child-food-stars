import type { DietType, FoodItem, MealSlot } from '../types/models'

/**
 * Sample nutrition-tagged food database (Indian + universal kid-friendly).
 * Tags drive rotation, balance, and analytics (fruit diversity, processed load).
 */
export const FOOD_DATABASE: FoodItem[] = [
  // Breakfast
  {
    id: 'oat_porridge',
    name: 'Oat Porridge',
    emoji: '🥣',
    tags: ['carbs', 'fiber', 'comfort', 'digestion'],
    slots: ['breakfast'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.1,
  },
  {
    id: 'poha',
    name: 'Poha',
    emoji: '🍚',
    tags: ['carbs', 'vegetables', 'iron', 'light'],
    slots: ['breakfast'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.2,
  },
  {
    id: 'upma',
    name: 'Upma',
    emoji: '🥘',
    tags: ['carbs', 'vegetables', 'comfort'],
    slots: ['breakfast'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.2,
  },
  {
    id: 'idli_sambar',
    name: 'Idli + Sambar',
    emoji: '🫓',
    tags: ['carbs', 'protein', 'fermented', 'digestion', 'vegetables'],
    slots: ['breakfast'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.15,
  },
  {
    id: 'dosa',
    name: 'Masala Dosa',
    emoji: '🥞',
    tags: ['carbs', 'vegetables', 'potassium'],
    slots: ['breakfast'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.25,
  },
  {
    id: 'paratha_yogurt',
    name: 'Paratha + Yogurt',
    emoji: '🫓',
    tags: ['carbs', 'dairy', 'protein', 'comfort'],
    slots: ['breakfast'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.2,
  },
  {
    id: 'french_toast',
    name: 'French Toast',
    emoji: '🍞',
    tags: ['carbs', 'protein', 'comfort'],
    slots: ['breakfast'],
    diets: ['eggetarian', 'non_vegetarian'],
    processedScore: 0.35,
  },
  {
    id: 'egg_bhurji',
    name: 'Egg Bhurji + Toast',
    emoji: '🍳',
    tags: ['protein', 'carbs', 'iron'],
    slots: ['breakfast'],
    diets: ['eggetarian', 'non_vegetarian'],
    processedScore: 0.25,
  },
  {
    id: 'cereal_milk',
    name: 'Whole-grain Cereal + Milk',
    emoji: '🥛',
    tags: ['carbs', 'dairy', 'fiber'],
    slots: ['breakfast'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.4,
  },
  {
    id: 'banana_pancakes',
    name: 'Banana Pancakes',
    emoji: '🥞',
    tags: ['carbs', 'fruit', 'potassium', 'comfort'],
    slots: ['breakfast'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.3,
  },
  // Snacks — school
  {
    id: 'apple_slices',
    name: 'Apple Slices',
    emoji: '🍎',
    tags: ['fruit', 'fiber', 'hydration-friendly'],
    slots: ['schoolSnack', 'eveningSnack'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0,
  },
  {
    id: 'orange_wedges',
    name: 'Orange Wedges',
    emoji: '🍊',
    tags: ['fruit', 'vitamin-c', 'hydration-friendly'],
    slots: ['schoolSnack', 'eveningSnack'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0,
  },
  {
    id: 'grapes',
    name: 'Grapes',
    emoji: '🍇',
    tags: ['fruit', 'antioxidants'],
    slots: ['schoolSnack', 'eveningSnack'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0,
  },
  {
    id: 'papaya_cubes',
    name: 'Papaya (cubed)',
    emoji: '🥭',
    tags: ['fruit', 'digestion', 'vitamin-c'],
    slots: ['schoolSnack', 'eveningSnack'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0,
  },
  {
    id: 'watermelon',
    name: 'Watermelon',
    emoji: '🍉',
    tags: ['fruit', 'hydration-friendly'],
    slots: ['schoolSnack', 'eveningSnack'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0,
  },
  {
    id: 'yogurt_granola',
    name: 'Yogurt + Granola',
    emoji: '🥣',
    tags: ['dairy', 'protein', 'carbs', 'calcium'],
    slots: ['schoolSnack', 'eveningSnack', 'breakfast'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.25,
  },
  {
    id: 'cheese_crackers',
    name: 'Cheese + Crackers',
    emoji: '🧀',
    tags: ['dairy', 'protein', 'carbs'],
    slots: ['schoolSnack', 'eveningSnack'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.45,
  },
  {
    id: 'trail_mix',
    name: 'Trail Mix',
    emoji: '🥜',
    tags: ['protein', 'carbs', 'fiber'],
    slots: ['schoolSnack', 'eveningSnack'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.35,
  },
  {
    id: 'veg_sticks_hummus',
    name: 'Veg Sticks + Hummus',
    emoji: '🥕',
    tags: ['vegetables', 'fiber', 'protein'],
    slots: ['schoolSnack', 'eveningSnack'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.15,
  },
  {
    id: 'milk_badam',
    name: 'Badam Milk',
    emoji: '🥛',
    tags: ['dairy', 'protein', 'calcium', 'hydration-friendly'],
    slots: ['schoolSnack', 'eveningSnack'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.2,
  },
  {
    id: 'chikki',
    name: 'Peanut Chikki',
    emoji: '🍯',
    tags: ['protein', 'carbs', 'energy'],
    slots: ['schoolSnack', 'eveningSnack'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.4,
  },
  // Lunch — veg
  {
    id: 'rajma_chawal',
    name: 'Rajma Chawal',
    emoji: '🍛',
    tags: ['protein', 'carbs', 'fiber', 'iron', 'vegetables'],
    slots: ['lunch'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.2,
  },
  {
    id: 'dal_rice',
    name: 'Dal Tadka + Rice',
    emoji: '🍚',
    tags: ['protein', 'carbs', 'comfort', 'digestion'],
    slots: ['lunch', 'dinner'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.15,
  },
  {
    id: 'palak_paneer',
    name: 'Palak Paneer',
    emoji: '🥬',
    tags: ['protein', 'iron', 'vegetables', 'calcium', 'dairy'],
    slots: ['lunch', 'dinner'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.2,
  },
  {
    id: 'chole_bhature',
    name: 'Chole + Roti',
    emoji: '🫓',
    tags: ['protein', 'carbs', 'fiber', 'heavy'],
    slots: ['lunch'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.35,
  },
  {
    id: 'veg_biryani',
    name: 'Veg Biryani + Raita',
    emoji: '🍚',
    tags: ['carbs', 'vegetables', 'dairy', 'protein'],
    slots: ['lunch', 'dinner'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.3,
  },
  {
    id: 'khichdi',
    name: 'Khichdi + Ghee',
    emoji: '🥣',
    tags: ['comfort', 'carbs', 'digestion', 'protein'],
    slots: ['lunch', 'dinner'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.1,
  },
  {
    id: 'paneer_tikka_roll',
    name: 'Paneer Tikka + Roti',
    emoji: '🌯',
    tags: ['protein', 'carbs', 'calcium'],
    slots: ['lunch'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.25,
  },
  {
    id: 'egg_curry_rice',
    name: 'Egg Curry + Rice',
    emoji: '🍳',
    tags: ['protein', 'carbs', 'iron'],
    slots: ['lunch', 'dinner'],
    diets: ['eggetarian', 'non_vegetarian'],
    processedScore: 0.25,
  },
  {
    id: 'chicken_rice',
    name: 'Chicken Curry + Rice',
    emoji: '🍗',
    tags: ['protein', 'carbs', 'iron', 'heavy'],
    slots: ['lunch', 'dinner'],
    diets: ['non_vegetarian'],
    processedScore: 0.2,
  },
  {
    id: 'fish_curry',
    name: 'Fish Curry + Rice',
    emoji: '🐟',
    tags: ['protein', 'omega-3', 'carbs'],
    slots: ['lunch', 'dinner'],
    diets: ['non_vegetarian'],
    processedScore: 0.2,
  },
  {
    id: 'pasta_marinara',
    name: 'Pasta Marinara',
    emoji: '🍝',
    tags: ['carbs', 'vegetables', 'light'],
    slots: ['lunch'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.3,
  },
  // Dinner
  {
    id: 'missi_roti_sabzi',
    name: 'Missi Roti + Sabzi',
    emoji: '🫓',
    tags: ['carbs', 'vegetables', 'protein', 'fiber'],
    slots: ['dinner'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.2,
  },
  {
    id: 'mushroom_stirfry',
    name: 'Mushroom Stir-fry + Rice',
    emoji: '🍄',
    tags: ['vegetables', 'protein', 'carbs', 'light'],
    slots: ['dinner', 'lunch'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.2,
  },
  {
    id: 'grilled_sandwich',
    name: 'Grilled Veg Sandwich',
    emoji: '🥪',
    tags: ['carbs', 'vegetables', 'fiber', 'light'],
    slots: ['dinner', 'eveningSnack'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.35,
  },
  {
    id: 'soup_bread',
    name: 'Tomato Soup + Bread',
    emoji: '🍲',
    tags: ['vegetables', 'carbs', 'hydration-friendly', 'light'],
    slots: ['dinner'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.25,
  },
  {
    id: 'roti_dal',
    name: 'Roti + Mixed Dal',
    emoji: '🫓',
    tags: ['protein', 'carbs', 'digestion'],
    slots: ['dinner'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.15,
  },
  {
    id: 'baked_veg_cutlet',
    name: 'Baked Veg Cutlets + Salad',
    emoji: '🥗',
    tags: ['vegetables', 'protein', 'fiber', 'light'],
    slots: ['dinner'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.25,
  },
  {
    id: 'chicken_soup',
    name: 'Chicken Soup + Toast',
    emoji: '🍲',
    tags: ['protein', 'hydration-friendly', 'light'],
    slots: ['dinner'],
    diets: ['non_vegetarian'],
    processedScore: 0.2,
  },
  // Treats (low frequency via scoring)
  {
    id: 'pizza_homemade',
    name: 'Homemade Veg Pizza',
    emoji: '🍕',
    tags: ['carbs', 'dairy', 'vegetables', 'processed', 'comfort'],
    slots: ['dinner', 'lunch'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.55,
  },
  {
    id: 'burger_veg',
    name: 'Veg Burger + Oven Fries',
    emoji: '🍔',
    tags: ['carbs', 'vegetables', 'processed', 'comfort'],
    slots: ['dinner'],
    diets: ['vegetarian', 'eggetarian', 'non_vegetarian'],
    processedScore: 0.6,
  },
]

export const DEFAULT_FRUITS = ['Apple', 'Banana', 'Mango', 'Orange', 'Grapes', 'Papaya', 'Watermelon', 'Pear']
export const DEFAULT_VEGGIES = ['Carrot', 'Broccoli', 'Peas', 'Spinach', 'Cucumber', 'Corn', 'Beans', 'Tomato']
export const DEFAULT_FOODS = ['Pasta', 'Pizza', 'Khichdi', 'Dosa', 'Paratha', 'Noodles', 'Sandwich', 'Rice bowl']

export function foodById(id: string): FoodItem | undefined {
  return FOOD_DATABASE.find((f) => f.id === id)
}

export function foodsForDiet(diet: DietType): FoodItem[] {
  return FOOD_DATABASE.filter((f) => f.diets.includes(diet))
}

export function foodsForSlot(slot: MealSlot, diet: DietType): FoodItem[] {
  return foodsForDiet(diet).filter((f) => f.slots.includes(slot))
}

/** Merge custom names from profile into synthetic FoodItems for the engine */
export function expandWithCustomFavorites(
  base: FoodItem[],
  names: string[],
  slot: MealSlot,
  diet: DietType,
): FoodItem[] {
  const existing = new Set(base.map((b) => b.name.toLowerCase()))
  const extras: FoodItem[] = []
  names.forEach((name, i) => {
    const n = name.trim()
    if (!n || existing.has(n.toLowerCase())) return
    existing.add(n.toLowerCase())
    extras.push({
      id: `custom_${slot}_${i}_${n.toLowerCase().replace(/\s+/g, '_')}`,
      name: n,
      emoji: '⭐',
      tags: ['favorite', 'comfort'],
      slots: [slot],
      diets: [diet],
      processedScore: 0.25,
    })
  })
  return [...base, ...extras]
}
