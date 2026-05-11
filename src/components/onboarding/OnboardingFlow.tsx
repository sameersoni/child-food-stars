import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ChildProfile, DietType, WeekdayIndex } from '../../types/models'
import { DEFAULT_FOODS, DEFAULT_FRUITS, DEFAULT_VEGGIES } from '../../data/foodDatabase'
import { useAppData } from '../../context/AppDataContext'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

const DIET_OPTIONS: { id: DietType; label: string; emoji: string; hint: string }[] = [
  { id: 'vegetarian', label: 'Vegetarian', emoji: '🥗', hint: 'No egg, no meat' },
  { id: 'eggetarian', label: 'Eggetarian', emoji: '🍳', hint: 'Eggs okay, no meat' },
  { id: 'non_vegetarian', label: 'Non-vegetarian', emoji: '🍗', hint: 'All foods' },
]

const WATER_PRESETS = [750, 1000, 1250, 1500, 1750, 2000]

const SCHOOL_DAY_OPTS: { d: WeekdayIndex; label: string }[] = [
  { d: 0, label: 'Mon' },
  { d: 1, label: 'Tue' },
  { d: 2, label: 'Wed' },
  { d: 3, label: 'Thu' },
  { d: 4, label: 'Fri' },
  { d: 5, label: 'Sat' },
  { d: 6, label: 'Sun' },
]

function ChipToggle({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition min-h-[44px] ${
        selected
          ? 'border-rose-400 bg-rose-100 text-rose-900 shadow-inner'
          : 'border-white/60 bg-white/50 text-slate-700'
      }`}
    >
      {label}
    </button>
  )
}

function MultiChips({
  options,
  values,
  onChange,
  allowCustom,
  customPlaceholder,
}: {
  options: string[]
  values: string[]
  onChange: (next: string[]) => void
  allowCustom?: boolean
  customPlaceholder?: string
}) {
  const [custom, setCustom] = useState('')
  const toggle = (o: string) => {
    if (values.includes(o)) onChange(values.filter((v) => v !== o))
    else onChange([...values, o])
  }
  const addCustom = () => {
    const t = custom.trim()
    if (!t) return
    if (!values.includes(t)) onChange([...values, t])
    setCustom('')
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <ChipToggle key={o} label={o} selected={values.includes(o)} onClick={() => toggle(o)} />
        ))}
      </div>
      {allowCustom ? (
        <div className="flex gap-2">
          <input
            className="min-h-[48px] flex-1 rounded-2xl border border-white/60 bg-white/80 px-4 text-base font-semibold outline-none focus:ring-2 focus:ring-rose-300"
            placeholder={customPlaceholder}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          />
          <Button type="button" variant="secondary" className="shrink-0 px-4" onClick={addCustom}>
            Add
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export function OnboardingFlow() {
  const navigate = useNavigate()
  const { completeOnboarding } = useAppData()
  const [step, setStep] = useState(0)
  const [childName, setChildName] = useState('')
  const [age, setAge] = useState(7)
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>([])
  const [favoriteFruits, setFavoriteFruits] = useState<string[]>([])
  const [favoriteVegetables, setFavoriteVegetables] = useState<string[]>([])
  const [dislikedFoods, setDislikedFoods] = useState<string[]>([])
  const [diet, setDiet] = useState<DietType>('vegetarian')
  const [waterGoalMl, setWaterGoalMl] = useState(1250)
  const [schoolDays, setSchoolDays] = useState<WeekdayIndex[]>([0, 1, 2, 3, 4])
  const [schoolStart, setSchoolStart] = useState('08:30')
  const [schoolEnd, setSchoolEnd] = useState('15:00')
  const [avatarEmoji, setAvatarEmoji] = useState('🙂')

  const canNext = useMemo(() => {
    if (step === 0) return childName.trim().length >= 2
    return true
  }, [step, childName])

  const finish = () => {
    const profile: ChildProfile = {
      childName: childName.trim(),
      age,
      favoriteFoods,
      favoriteFruits,
      favoriteVegetables,
      dislikedFoods,
      diet,
      waterGoalMl,
      schoolDays,
      schoolStartTime: schoolStart,
      schoolEndTime: schoolEnd,
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
      avatarEmoji,
    }
    completeOnboarding(profile)
    navigate('/plan')
  }

  const toggleSchool = (d: WeekdayIndex) => {
    if (schoolDays.includes(d)) setSchoolDays(schoolDays.filter((x) => x !== d))
    else setSchoolDays([...schoolDays, d].sort() as WeekdayIndex[])
  }

  const steps = [
    {
      title: 'Welcome to Food Stars',
      subtitle: 'Let’s set up a profile for your shining star.',
      body: (
        <div className="flex flex-col gap-4">
          <label className="text-sm font-bold text-slate-600">Child name</label>
          <input
            className="min-h-[52px] rounded-2xl border border-white/60 bg-white/90 px-4 text-lg font-bold outline-none focus:ring-2 focus:ring-rose-300"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="e.g. Arjun, Sofia…"
            autoComplete="given-name"
          />
          <div>
            <label className="text-sm font-bold text-slate-600">Age</label>
            <div className="mt-2 flex items-center gap-4">
              <input
                type="range"
                min={3}
                max={12}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="h-3 flex-1 accent-rose-500"
              />
              <span className="min-w-[3rem] rounded-2xl bg-white/80 px-3 py-2 text-center text-xl font-extrabold text-rose-600">
                {age}
              </span>
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-600">Avatar</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {['🙂', '😺', '🦄', '🐼', '🦊', '🐰', '🦁', '🐯'].map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setAvatarEmoji(e)}
                  className={`rounded-2xl border-2 p-3 text-3xl ${avatarEmoji === e ? 'border-rose-400 bg-rose-50' : 'border-transparent bg-white/60'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Favorite bites',
      subtitle: 'Favorites get gently woven into the weekly plan.',
      body: (
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-sm font-bold text-slate-600">Favorite foods</p>
            <MultiChips
              options={DEFAULT_FOODS}
              values={favoriteFoods}
              onChange={setFavoriteFoods}
              allowCustom
              customPlaceholder="Add a favorite food"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-slate-600">Favorite fruits</p>
            <MultiChips
              options={DEFAULT_FRUITS}
              values={favoriteFruits}
              onChange={setFavoriteFruits}
              allowCustom
              customPlaceholder="Add a fruit"
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-slate-600">Favorite vegetables</p>
            <MultiChips
              options={DEFAULT_VEGGIES}
              values={favoriteVegetables}
              onChange={setFavoriteVegetables}
              allowCustom
              customPlaceholder="Add a vegetable"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'Gentle boundaries',
      subtitle: 'We’ll avoid these — no pressure, just planning.',
      body: (
        <div>
          <p className="mb-2 text-sm font-bold text-slate-600">Foods to skip</p>
          <MultiChips
            options={['Very spicy', 'Mushrooms', 'Seafood', 'Peanuts']}
            values={dislikedFoods}
            onChange={setDislikedFoods}
            allowCustom
            customPlaceholder="Foods they dislike"
          />
        </div>
      ),
    },
    {
      title: 'Diet style',
      subtitle: 'Pick the card that matches your kitchen.',
      body: (
        <div className="grid gap-3 sm:grid-cols-3">
          {DIET_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDiet(opt.id)}
              className={`rounded-3xl border-2 p-4 text-left transition ${
                diet === opt.id
                  ? 'border-rose-400 bg-gradient-to-br from-rose-50 to-orange-50 shadow-lg'
                  : 'border-white/60 bg-white/60'
              }`}
            >
              <div className="text-4xl">{opt.emoji}</div>
              <div className="mt-2 text-lg font-extrabold text-slate-900">{opt.label}</div>
              <div className="text-sm font-medium text-slate-600">{opt.hint}</div>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'Water & school rhythm',
      subtitle: 'Hydration goals and school days shape reminders.',
      body: (
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-2 text-sm font-bold text-slate-600">Daily water goal</p>
            <div className="flex flex-wrap gap-2">
              {WATER_PRESETS.map((w) => (
                <ChipToggle
                  key={w}
                  label={`${w} ml`}
                  selected={waterGoalMl === w}
                  onClick={() => setWaterGoalMl(w)}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-slate-600">School days</p>
            <div className="flex flex-wrap gap-2">
              {SCHOOL_DAY_OPTS.map(({ d, label }) => (
                <ChipToggle
                  key={d}
                  label={label}
                  selected={schoolDays.includes(d)}
                  onClick={() => toggleSchool(d)}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500">School starts</label>
              <input
                type="time"
                className="mt-1 min-h-[48px] w-full rounded-2xl border border-white/60 bg-white/80 px-3 font-semibold"
                value={schoolStart}
                onChange={(e) => setSchoolStart(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">School ends</label>
              <input
                type="time"
                className="mt-1 min-h-[48px] w-full rounded-2xl border border-white/60 bg-white/80 px-3 font-semibold"
                value={schoolEnd}
                onChange={(e) => setSchoolEnd(e.target.value)}
              />
            </div>
          </div>
        </div>
      ),
    },
  ]

  const isLast = step === steps.length - 1

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 p-4 pb-28 font-[Nunito]">
      <header className="pt-2 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-rose-500">Version 2</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Food Stars</h1>
        <p className="mt-2 text-base font-semibold text-slate-600">Nutrition play, made simple.</p>
      </header>

      <Card className="flex-1">
        <div className="mb-4 flex gap-1">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-rose-400' : 'bg-slate-200'}`}
            />
          ))}
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">{steps[step].title}</h2>
        <p className="mt-1 text-base font-semibold text-slate-600">{steps[step].subtitle}</p>
        <div className="mt-6">{steps[step].body}</div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 flex justify-center gap-3 border-t border-white/40 bg-white/80 p-4 backdrop-blur-lg">
        <Button
          variant="secondary"
          className="flex-1"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </Button>
        {!isLast ? (
          <Button className="flex-1" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
            Next
          </Button>
        ) : (
          <Button className="flex-1" disabled={!canNext} onClick={finish}>
            Create my plan
          </Button>
        )}
      </div>
    </div>
  )
}
