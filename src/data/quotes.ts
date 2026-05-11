/** Random encouraging lines for parents and kids (positive only). */
export const ENCOURAGEMENT_QUOTES = [
  'You are building healthy habits one bite at a time!',
  'Small steps make super stars!',
  'Trying new foods is an adventure!',
  'Your body loves water — keep sipping!',
  'Every colorful plate is a win!',
  'Healthy fuel helps you play longer and smile bigger!',
  'Consistency beats perfection — great job showing up!',
  'Stars shine brightest when you are kind to yourself!',
]

export function randomQuote(): string {
  return ENCOURAGEMENT_QUOTES[Math.floor(Math.random() * ENCOURAGEMENT_QUOTES.length)]
}

export const MOTIVATIONAL_BY_TIME: Record<string, string> = {
  morning: 'Rise and shine — breakfast powers your morning!',
  midday: 'Lunch is your midday rocket fuel!',
  afternoon: 'Snack smart to keep energy steady!',
  evening: 'Dinner helps your body rest and grow overnight!',
}

export function timeBucket(hour: number): keyof typeof MOTIVATIONAL_BY_TIME {
  if (hour < 11) return 'morning'
  if (hour < 15) return 'midday'
  if (hour < 18) return 'afternoon'
  return 'evening'
}
