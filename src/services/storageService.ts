import type { AchievementUnlock, AppStateV2, ChildProfile, DailyLog, WeekPlan } from '../types/models'
import { evaluateAchievements } from '../utils/achievements'
import { computeStarsEarned } from '../utils/stars'
import { isSheetsConfigured, sheetsRequest } from './sheetsClient'

const STORAGE_KEY = 'tanvi_food_stars_v2'

const defaultState = (): AppStateV2 => ({
  profile: null,
  currentWeekPlan: null,
  dailyLogs: {},
  achievements: [],
  settings: { soundEnabled: false, parentPinHash: null },
})

export function loadLocalState(): AppStateV2 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
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

export function saveLocalState(state: AppStateV2): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/** Merge remote bundle if script returns { profile, weekPlan, dailyLogs, achievements } */
export function mergeRemoteIntoLocal(
  local: AppStateV2,
  remote: Partial<AppStateV2>,
): AppStateV2 {
  return {
    ...local,
    profile: remote.profile ?? local.profile,
    currentWeekPlan: remote.currentWeekPlan ?? local.currentWeekPlan,
    dailyLogs: { ...local.dailyLogs, ...remote.dailyLogs },
    achievements: remote.achievements?.length ? remote.achievements : local.achievements,
    settings: {
      ...local.settings,
      ...(remote.settings ?? {}),
    },
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

export function recomputeLogStars(
  log: DailyLog,
  waterGoalMl: number,
): DailyLog {
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
