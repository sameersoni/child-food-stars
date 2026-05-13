import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppDataProvider } from './context/AppDataContext'
import { AppShell } from './components/layout/AppShell'
import { HomeRedirect } from './components/layout/HomeRedirect'
import { OnboardingFlow } from './components/onboarding/OnboardingFlow'
import { UserSelectorPage } from './components/user/UserSelectorPage'
import { WeeklyPlanPage } from './components/timetable/WeeklyPlanPage'
import { StarsPage } from './components/stars/StarsPage'
import { AnalyticsPage } from './components/analytics/AnalyticsPage'
import { NutritionReportPage } from './components/nutrition/NutritionReportPage'

export default function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/users" element={<UserSelectorPage />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route element={<AppShell />}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/plan" element={<WeeklyPlanPage />} />
            <Route path="/stars" element={<StarsPage />} />
            <Route path="/report" element={<NutritionReportPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppDataProvider>
  )
}
