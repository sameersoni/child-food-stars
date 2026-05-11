const SESSION_KEY = 'food_stars_parent_ok'
export const PARENT_SESSION_EVENT = 'food-stars-parent-session'

export function readParentSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function setParentSessionUnlocked(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* private mode etc. */
  }
  window.dispatchEvent(new Event(PARENT_SESSION_EVENT))
}

export function clearParentSessionUnlocked(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(PARENT_SESSION_EVENT))
}
