import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../../context/AppDataContext'

export function HomeRedirect() {
  const navigate = useNavigate()
  const { state } = useAppData()

  useEffect(() => {
    if (state.profile?.onboardingComplete) navigate('/plan', { replace: true })
    else navigate('/onboarding', { replace: true })
  }, [navigate, state.profile?.onboardingComplete])

  return (
    <div className="flex min-h-dvh items-center justify-center font-[Nunito] text-lg font-bold text-slate-600">
      Loading your stars…
    </div>
  )
}
