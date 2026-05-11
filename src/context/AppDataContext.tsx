import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import type { AppStateV2, ChildProfile, DailyLog, MealSlot, PlannedMeal } from '../types/models'
import { generateWeekPlan, regenerateFullDay, regenerateSingleMeal } from '../engine/timetableEngine'
import {
  loadLocalState,
  pushAchievementsToSheets,
  pushDailyLogToSheets,
  pushProfileToSheets,
  pushWeekToSheets,
  recomputeLogStars,
  saveLocalState,
  tryHydrateFromSheets,
  withEvaluatedAchievements,
} from '../services/storageService'
import { emptyMeals } from '../utils/stars'

type Action =
  | { type: 'HYDRATE'; state: AppStateV2 }
  | { type: 'SET_PROFILE'; profile: ChildProfile }
  | { type: 'SET_WEEK'; week: AppStateV2['currentWeekPlan'] }
  | { type: 'UPSERT_LOG'; log: DailyLog }
  | { type: 'REGEN_WEEK' }
  | { type: 'REGEN_DAY'; dayIndex: number }
  | { type: 'REGEN_MEAL'; dayIndex: number; slot: MealSlot }
  | { type: 'SWAP_MEAL'; dayIndex: number; slot: MealSlot; meal: PlannedMeal }
  | { type: 'SET_SOUND'; enabled: boolean }

function reducer(state: AppStateV2, action: Action): AppStateV2 {
  switch (action.type) {
    case 'HYDRATE':
      return withEvaluatedAchievements(action.state)
    case 'SET_PROFILE':
      return withEvaluatedAchievements({ ...state, profile: action.profile })
    case 'SET_WEEK':
      return withEvaluatedAchievements({ ...state, currentWeekPlan: action.week })
    case 'UPSERT_LOG': {
      const waterGoal = state.profile?.waterGoalMl ?? 1500
      const log = recomputeLogStars(action.log, waterGoal)
      const dailyLogs = { ...state.dailyLogs, [log.date]: log }
      return withEvaluatedAchievements({ ...state, dailyLogs })
    }
    case 'REGEN_WEEK': {
      if (!state.profile) return state
      const week = generateWeekPlan(state.profile)
      return withEvaluatedAchievements({ ...state, currentWeekPlan: week })
    }
    case 'REGEN_DAY': {
      if (!state.profile || !state.currentWeekPlan) return state
      const week = regenerateFullDay(state.profile, state.currentWeekPlan, action.dayIndex)
      return withEvaluatedAchievements({ ...state, currentWeekPlan: week })
    }
    case 'REGEN_MEAL': {
      if (!state.profile || !state.currentWeekPlan) return state
      const week = regenerateSingleMeal(
        state.profile,
        state.currentWeekPlan,
        action.dayIndex,
        action.slot,
      )
      return withEvaluatedAchievements({ ...state, currentWeekPlan: week })
    }
    case 'SWAP_MEAL': {
      if (!state.currentWeekPlan) return state
      const days = state.currentWeekPlan.days.map((d, i) => {
        if (i !== action.dayIndex) return d
        return { ...d, [action.slot]: action.meal }
      })
      return withEvaluatedAchievements({
        ...state,
        currentWeekPlan: { ...state.currentWeekPlan, days, generatedAt: new Date().toISOString() },
      })
    }
    case 'SET_SOUND':
      return { ...state, settings: { ...state.settings, soundEnabled: action.enabled } }
    default:
      return state
  }
}

interface AppContextValue {
  state: AppStateV2
  completeOnboarding: (profile: ChildProfile) => void
  setWeekPlan: (week: AppStateV2['currentWeekPlan']) => void
  upsertLog: (log: DailyLog) => void
  regenWeek: () => void
  regenDay: (dayIndex: number) => void
  regenMeal: (dayIndex: number, slot: MealSlot) => void
  swapMeal: (dayIndex: number, slot: MealSlot, meal: PlannedMeal) => void
  setSoundEnabled: (enabled: boolean) => void
  getOrCreateLog: (date: string) => DailyLog
}

const AppDataContext = createContext<AppContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    withEvaluatedAchievements(loadLocalState()),
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const local = loadLocalState()
      const merged = await tryHydrateFromSheets(local)
      if (!cancelled) dispatch({ type: 'HYDRATE', state: merged })
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    saveLocalState(state)
  }, [state])

  useEffect(() => {
    if (state.profile) void pushProfileToSheets(state.profile)
    if (state.currentWeekPlan) void pushWeekToSheets(state.currentWeekPlan)
    void pushAchievementsToSheets(state.achievements)
  }, [state.profile, state.currentWeekPlan, state.achievements])

  const completeOnboarding = useCallback((profile: ChildProfile) => {
    const week = generateWeekPlan(profile)
    dispatch({ type: 'SET_PROFILE', profile })
    dispatch({ type: 'SET_WEEK', week })
  }, [])

  const setWeekPlan = useCallback((week: AppStateV2['currentWeekPlan']) => {
    dispatch({ type: 'SET_WEEK', week })
  }, [])

  const upsertLog = useCallback((log: DailyLog) => {
    dispatch({ type: 'UPSERT_LOG', log })
    void pushDailyLogToSheets(log)
  }, [])

  const regenWeek = useCallback(() => dispatch({ type: 'REGEN_WEEK' }), [])
  const regenDay = useCallback((dayIndex: number) => dispatch({ type: 'REGEN_DAY', dayIndex }), [])
  const regenMeal = useCallback(
    (dayIndex: number, slot: MealSlot) => dispatch({ type: 'REGEN_MEAL', dayIndex, slot }),
    [],
  )
  const swapMeal = useCallback(
    (dayIndex: number, slot: MealSlot, meal: PlannedMeal) =>
      dispatch({ type: 'SWAP_MEAL', dayIndex, slot, meal }),
    [],
  )
  const setSoundEnabled = useCallback(
    (enabled: boolean) => dispatch({ type: 'SET_SOUND', enabled }),
    [],
  )

  const getOrCreateLog = useCallback(
    (date: string): DailyLog => {
      const existing = state.dailyLogs[date]
      if (existing) return existing
      return {
        date,
        meals: emptyMeals(),
        waterMl: 0,
        starsEarned: 0,
        updatedAt: new Date().toISOString(),
      }
    },
    [state.dailyLogs],
  )

  const value = useMemo(
    () => ({
      state,
      completeOnboarding,
      setWeekPlan,
      upsertLog,
      regenWeek,
      regenDay,
      regenMeal,
      swapMeal,
      setSoundEnabled,
      getOrCreateLog,
    }),
    [
      state,
      completeOnboarding,
      setWeekPlan,
      upsertLog,
      regenWeek,
      regenDay,
      regenMeal,
      swapMeal,
      setSoundEnabled,
      getOrCreateLog,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

/** Hook used across routes; colocated with provider for clarity. */
// eslint-disable-next-line react-refresh/only-export-components
export function useAppData(): AppContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
