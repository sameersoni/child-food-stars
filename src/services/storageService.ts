import type { AchievementUnlock, AppStateV2, ChildProfile, DailyLog, WeekPlan } from '../types/models'
import { evaluateAchievements } from '../utils/achievements'
import { computeStarsEarned } from '../utils/stars'
import { isSheetsConfigured, sheetsRequest } from './sheetsClient'

// ─── Storage keys ───────────────────────────────────────────────────────────

const USER_LIST_KEY = 'food_stars_user_list'
const USER_DATA_PREFIX = 'food_stars_data_'
const ACTIVE_USER_SESSION_KEY = 'food_stars_active_user'
/** Legacy single-user key from V2 */
const LEGACY_KEY = 'tanvi_food_stars_v2'

// ─── Default state ───────────────────────────────────────────────────────────

const defaultState = (): AppStateV2 => ({
  profile: null,
  currentWeekPlan: null,
  dailyLogs: {},
  achievements: [],
  settings: { soundEnabled: false, parentPinHash: null },
})

// ─── User list ───────────────────────────────────────────────────────────────

export function getUserList(): string[] {
  try {
    const raw = localStorage.getItem(USER_LIST_KEY)
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

export function saveUserList(list: string[]): void {
  localStorage.setItem(USER_LIST_KEY, JSON.stringify(list))
}

export function addUserToList(name: string): void {
  const list = getUserList()
  if (!list.includes(name)) saveUserList([...list, name])
}

export function removeUserFromList(name: string): void {
  saveUserList(getUserList().filter((n) => n !== name))
}

// ─── Per-user state ──────────────────────────────────────────────────────────

export function loadUserState(name: string): AppStateV2 {
  try {
    const raw = localStorage.getItem(USER_DATA_PREFIX + name)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as AppStateV2
    if (!parsed || typeof parsed !== 'object') return defaultState()
    return {
      ...defaultState(),
      ...parsed,
      settings: { ...defaultState().settings, ...parsed.settings },
    }
  } catch {
    return defaultState()
  }
}

export function saveUserState(name: string, state: AppStateV2): void {
  localStorage.setItem(USER_DATA_PREFIX + name, JSON.stringify(state))
}

export function deleteUserData(name: string): void {
  localStorage.removeItem(USER_DATA_PREFIX + name)
  removeUserFromList(name)
}

// ─── Active user session ─────────────────────────────────────────────────────

export function getActiveUser(): string | null {
  return sessionStorage.getItem(ACTIVE_USER_SESSION_KEY)
}

export function setActiveUser(name: string | null): void {
  if (name) sessionStorage.setItem(ACTIVE_USER_SESSION_KEY, name)
  else sessionStorage.removeItem(ACTIVE_USER_SESSION_KEY)
}

// ─── Legacy migration ─────────────────────────────────────────────────────────

/** Migrate old tanvi_food_stars_v2 data into the new multi-user format. */
export function migrateLegacyIfNeeded(): void {
  const legacy = localStorage.getItem(LEGACY_KEY)
  if (!legacy) return
  const userList = getUserList()
  if (userList.length > 0) {
    // New format already initialised — just drop the legacy key
    localStorage.removeItem(LEGACY_KEY)
    return
  }
  try {
    const parsed = JSON.parse(legacy) as AppStateV2
    if (parsed?.profile?.childName && parsed.profile.onboardingComplete) {
      const name = parsed.profile.childName
      const migrated: AppStateV2 = {
        ...defaultState(),
        ...parsed,
        settings: { ...defaultState().settings, ...parsed.settings },
      }
      saveUserList([name])
      saveUserState(name, migrated)
      setActiveUser(name)
    }
  } catch {
    // migration failed — start fresh
  }
  localStorage.removeItem(LEGACY_KEY)
}

// ─── Sheets sync (unchanged) ──────────────────────────────────────────────────

export function mergeRemoteIntoLocal(local: AppStateV2, remote: Partial<AppStateV2>): AppStateV2 {
  return {
    ...local,
    profile: remote.profile ?? local.profile,
    currentWeekPlan: remote.currentWeekPlan ?? local.currentWeekPlan,
    dailyLogs: { ...local.dailyLogs, ...remote.dailyLogs },
    achievements: remote.achievements?.length ? remote.achievements : local.achievements,
    settings: { ...local.settings, ...(remote.settings ?? {}) },
  }
}

export async function tryHydrateFromSheets(local: AppStateV2): Promise<AppStateV2> {
  if (!isSheetsConfigured()) return local
  const res = await sheetsRequest<{ ok?: boolean; data?: Partial<AppStateV2> }>('loadAll', {})
  if (res && typeof res === 'object' && 'data' in res && res.data) {
    return mergeRemoteIntoLocal(local, res.data)
  }
  return local
}

export async function pushProfileToSheets(profile: ChildProfile): Promise<void> {
  await sheetsRequest('saveProfile', { profile })
}

export async function pushWeekToSheets(week: WeekPlan): Promise<void> {
  await sheetsRequest('saveWeekPlan', { weekPlan: week })
}

export async function pushDailyLogToSheets(log: DailyLog): Promise<void> {
  await sheetsRequest('saveDailyLog', { dailyLog: log, date: log.date })
}

export async function pushAchievementsToSheets(list: AchievementUnlock[]): Promise<void> {
  await sheetsRequest('saveAchievements', { achievements: list })
}

// ─── Star recompute ───────────────────────────────────────────────────────────

export function recomputeLogStars(log: DailyLog, waterGoalMl: number): DailyLog {
  const stars = computeStarsEarned(log.meals, log.waterMl, waterGoalMl)
  return { ...log, starsEarned: stars, updatedAt: new Date().toISOString() }
}

export function withEvaluatedAchievements(state: AppStateV2): AppStateV2 {
  if (!state.profile?.onboardingComplete) return state
  const waterGoal = state.profile.waterGoalMl
  const nextAch = evaluateAchievements(
    state.dailyLogs,
    waterGoal,
    state.currentWeekPlan,
    state.achievements,
  )
  return { ...state, achievements: nextAch }
}

// ─── CSV export ───────────────────────────────────────────────────────────────

export function exportDailyLogsCSV(state: AppStateV2): void {
  const childName = sanitizeCSVField(state.profile?.childName ?? 'Unknown')
  const rows: string[] = [
    'Date,Child,Breakfast,School Snack,Lunch,Evening Snack,Dinner,Water (ml),Stars',
  ]
  const sorted = Object.values(state.dailyLogs).sort((a, b) => a.date.localeCompare(b.date))
  for (const log of sorted) {
    rows.push(
      [
        log.date,
        childName,
        log.meals.breakfast ? 'yes' : 'no',
        log.meals.schoolSnack ? 'yes' : 'no',
        log.meals.lunch ? 'yes' : 'no',
        log.meals.eveningSnack ? 'yes' : 'no',
        log.meals.dinner ? 'yes' : 'no',
        log.waterMl,
        log.starsEarned,
      ].join(','),
    )
  }
  downloadCSV(`food_stars_logs_${childName}.csv`, rows.join('\n'))
}

export function exportMealPlanCSV(state: AppStateV2): void {
  const childName = sanitizeCSVField(state.profile?.childName ?? 'Unknown')
  const week = state.currentWeekPlan
  if (!week) return
  const rows: string[] = ['Date,Breakfast,School Snack,Lunch,Evening Snack,Dinner']
  for (const day of week.days) {
    rows.push(
      [
        day.date,
        `"${sanitizeCSVField(day.breakfast.name)}"`,
        `"${sanitizeCSVField(day.schoolSnack.name)}"`,
        `"${sanitizeCSVField(day.lunch.name)}"`,
        `"${sanitizeCSVField(day.eveningSnack.name)}"`,
        `"${sanitizeCSVField(day.dinner.name)}"`,
      ].join(','),
    )
  }
  downloadCSV(`food_stars_plan_${childName}.csv`, rows.join('\n'))
}

/** Prevent spreadsheet formula injection (=, +, -, @, tab, CR at start of field). */
function sanitizeCSVField(value: string): string {
  const trimmed = value.trim()
  if (/^[=+\-@\t\r]/.test(trimmed)) return `'${trimmed}`
  return trimmed
}

function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
