import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react'
import type { AppStateV2, ChildProfile, DailyLog, MealSlot, PlannedMeal } from '../types/models'
import { generateWeekPlan, regenerateFullDay, regenerateSingleMeal } from '../engine/timetableEngine'
import {
  addUserToList,
  deleteUserData,
  getActiveUser,
  getUserList,
  loadUserState,
  migrateLegacyIfNeeded,
  pushAchievementsToSheets,
  pushDailyLogToSheets,
  pushProfileToSheets,
  pushWeekToSheets,
  recomputeLogStars,
  saveUserState,
  setActiveUser,
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
  | { type: 'SET_PARENT_PIN_HASH'; hash: string | null }
  | { type: 'ADD_REWARD'; reward: string }
  | { type: 'REMOVE_REWARD'; reward: string }
  | { type: 'SET_WEEK_REWARD'; weekStart: string; reward: string }

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
    case 'SET_PARENT_PIN_HASH':
      return { ...state, settings: { ...state.settings, parentPinHash: action.hash } }
    case 'ADD_REWARD': {
      if (state.rewards.includes(action.reward)) return state
      return { ...state, rewards: [...state.rewards, action.reward] }
    }
    case 'REMOVE_REWARD':
      return { ...state, rewards: state.rewards.filter((r) => r !== action.reward) }
    case 'SET_WEEK_REWARD':
      return { ...state, weekRewards: { ...state.weekRewards, [action.weekStart]: action.reward } }
    default:
      return state
  }
}

interface AppContextValue {
  // Current user's data
  state: AppStateV2
  // User management
  activeUser: string | null
  userList: string[]
  /** Create a new user — returns an error string if the name already exists. */
  createUser: (name: string) => string | null
  switchUser: (name: string) => void
  deleteUser: (name: string) => void
  // Data operations
  completeOnboarding: (profile: ChildProfile) => void
  setWeekPlan: (week: AppStateV2['currentWeekPlan']) => void
  upsertLog: (log: DailyLog) => void
  regenWeek: () => void
  regenDay: (dayIndex: number) => void
  regenMeal: (dayIndex: number, slot: MealSlot) => void
  swapMeal: (dayIndex: number, slot: MealSlot, meal: PlannedMeal) => void
  setSoundEnabled: (enabled: boolean) => void
  setParentPinHash: (hash: string | null) => void
  getOrCreateLog: (date: string) => DailyLog
  addReward: (reward: string) => void
  removeReward: (reward: string) => void
  setWeekReward: (weekStart: string, reward: string) => void
}

const AppDataContext = createContext<AppContextValue | null>(null)

function initState(): AppStateV2 {
  migrateLegacyIfNeeded()
  const active = getActiveUser()
  if (active) return withEvaluatedAchievements(loadUserState(active))
  return { profile: null, currentWeekPlan: null, dailyLogs: {}, achievements: [], settings: { soundEnabled: false, parentPinHash: null }, rewards: [], weekRewards: {} }
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [activeUser, setActiveUserState] = useState<string | null>(() => getActiveUser())
  const [userList, setUserList] = useState<string[]>(() => getUserList())
  const [state, dispatch] = useReducer(reducer, undefined, initState)

  // Sync from sheets on mount
  useEffect(() => {
    if (!activeUser) return
    let cancelled = false
    ;(async () => {
      const local = loadUserState(activeUser)
      const merged = await tryHydrateFromSheets(local)
      if (!cancelled) dispatch({ type: 'HYDRATE', state: merged })
    })()
    return () => { cancelled = true }
  }, [activeUser])

  // Persist state to user-specific key whenever it changes
  useEffect(() => {
    if (activeUser) saveUserState(activeUser, state)
  }, [activeUser, state])

  // Push to sheets when key data changes
  useEffect(() => {
    if (state.profile) void pushProfileToSheets(state.profile)
    if (state.currentWeekPlan) void pushWeekToSheets(state.currentWeekPlan)
    void pushAchievementsToSheets(state.achievements)
  }, [state.profile, state.currentWeekPlan, state.achievements])

  // ── User management ────────────────────────────────────────────────────────

  const createUser = useCallback((name: string): string | null => {
    const trimmed = name.trim()
    const list = getUserList()
    if (list.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      return `A profile named "${trimmed}" already exists.`
    }
    addUserToList(trimmed)
    setUserList(getUserList())
    setActiveUser(trimmed)
    setActiveUserState(trimmed)
    // Load fresh empty state for new user
    dispatch({ type: 'HYDRATE', state: { profile: null, currentWeekPlan: null, dailyLogs: {}, achievements: [], settings: { soundEnabled: false, parentPinHash: null }, rewards: [], weekRewards: {} } })
    return null
  }, [])

  const switchUser = useCallback((name: string) => {
    setActiveUser(name)
    setActiveUserState(name)
    const loaded = loadUserState(name)
    dispatch({ type: 'HYDRATE', state: withEvaluatedAchievements(loaded) })
  }, [])

  const deleteUser = useCallback((name: string) => {
    deleteUserData(name)
    const newList = getUserList()
    setUserList(newList)
    if (activeUser === name) {
      setActiveUser(null)
      setActiveUserState(null)
      dispatch({ type: 'HYDRATE', state: { profile: null, currentWeekPlan: null, dailyLogs: {}, achievements: [], settings: { soundEnabled: false, parentPinHash: null }, rewards: [], weekRewards: {} } })
    }
  }, [activeUser])

  // ── Data operations ────────────────────────────────────────────────────────

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
  const setParentPinHash = useCallback((hash: string | null) => {
    dispatch({ type: 'SET_PARENT_PIN_HASH', hash })
  }, [])

  const addReward = useCallback((reward: string) => {
    dispatch({ type: 'ADD_REWARD', reward })
  }, [])
  const removeReward = useCallback((reward: string) => {
    dispatch({ type: 'REMOVE_REWARD', reward })
  }, [])
  const setWeekReward = useCallback((weekStart: string, reward: string) => {
    dispatch({ type: 'SET_WEEK_REWARD', weekStart, reward })
  }, [])

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
      activeUser,
      userList,
      createUser,
      switchUser,
      deleteUser,
      completeOnboarding,
      setWeekPlan,
      upsertLog,
      regenWeek,
      regenDay,
      regenMeal,
      swapMeal,
      setSoundEnabled,
      setParentPinHash,
      getOrCreateLog,
      addReward,
      removeReward,
      setWeekReward,
    }),
    [
      state, activeUser, userList,
      createUser, switchUser, deleteUser,
      completeOnboarding, setWeekPlan, upsertLog,
      regenWeek, regenDay, regenMeal, swapMeal,
      setSoundEnabled, setParentPinHash, getOrCreateLog,
      addReward, removeReward, setWeekReward,
    ],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppData(): AppContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider')
  return ctx
}
