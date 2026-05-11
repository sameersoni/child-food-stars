import { useCallback, useEffect, useState } from 'react'
import {
  PARENT_SESSION_EVENT,
  clearParentSessionUnlocked,
  readParentSessionUnlocked,
  setParentSessionUnlocked,
} from '../utils/parentSession'

export function useParentSessionUnlocked(): {
  unlocked: boolean
  setUnlocked: () => void
  lockAgain: () => void
} {
  const [unlocked, setU] = useState(readParentSessionUnlocked)

  useEffect(() => {
    const sync = () => setU(readParentSessionUnlocked())
    window.addEventListener(PARENT_SESSION_EVENT, sync)
    return () => window.removeEventListener(PARENT_SESSION_EVENT, sync)
  }, [])

  const setUnlocked = useCallback(() => {
    setParentSessionUnlocked()
    setU(true)
  }, [])

  const lockAgain = useCallback(() => {
    clearParentSessionUnlocked()
    setU(false)
  }, [])

  return { unlocked, setUnlocked, lockAgain }
}
