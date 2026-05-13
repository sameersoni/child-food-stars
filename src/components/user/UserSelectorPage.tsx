import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../../context/AppDataContext'
import { loadUserState } from '../../services/storageService'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

type Tab = 'about' | 'profiles'

function AboutTab() {
  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Hero */}
      <Card className="text-center !py-6 bg-gradient-to-b from-rose-50 to-white">
        <p className="text-5xl">⭐</p>
        <h2 className="mt-3 text-2xl font-extrabold text-slate-900">Turn Every Meal Into a Win</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600 leading-relaxed">
          The fun, free app that helps kids build healthy eating habits — one star at a time.
        </p>
      </Card>

      {/* The problem */}
      <Card>
        <p className="text-base font-extrabold text-slate-800">The Problem Every Parent Knows</p>
        <p className="mt-2 text-sm font-semibold text-slate-600 leading-relaxed">
          Negotiations at the dinner table. Untouched vegetables. The same three foods on repeat.
          And as a parent, you're left wondering — <em>are they actually getting the nutrition they need?</em>
        </p>
        <p className="mt-3 text-sm font-bold text-rose-600">
          Food Stars turns the dinner table into a game — and makes kids <em>want</em> to eat well.
        </p>
      </Card>

      {/* How it works */}
      <Card>
        <p className="text-base font-extrabold text-slate-800">How It Works</p>
        <p className="mt-2 text-sm font-semibold text-slate-600 leading-relaxed">
          Kids earn ⭐ stars for every meal they finish. Stars unlock weekly rewards <em>they chose themselves</em>.
          Healthy habits become their goal, not yours.
        </p>
        <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-wide">Simple enough for a 5-year-old. Powerful enough to actually work.</p>
      </Card>

      {/* Star system */}
      <Card>
        <p className="text-base font-extrabold text-slate-800">⭐ Stars Kids Actually Care About</p>
        <div className="mt-3 flex flex-col gap-2">
          {[
            ['🌅', 'Breakfast', '1 star'],
            ['🍎', 'School Snack', '1 star'],
            ['🍱', 'Lunch', '1 star'],
            ['🥪', 'Evening Snack', '1 star'],
            ['🍽️', 'Dinner', '2 stars'],
            ['💧', 'Hit Water Goal', '2 stars'],
            ['🎉', 'All Meals Bonus', '3 stars'],
          ].map(([emoji, label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-2xl bg-rose-50 px-3 py-2">
              <span className="text-sm font-bold text-slate-700">{emoji} {label}</span>
              <span className="text-xs font-extrabold text-rose-600">{value}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs font-bold text-slate-500 text-center">Up to 12 stars a day. Every day is a fresh chance to shine.</p>
      </Card>

      {/* Feature cards */}
      <p className="text-base font-extrabold text-slate-700 px-1">What's Inside</p>

      {[
        {
          emoji: '🍱',
          title: 'Smart Weekly Meal Plans',
          body: 'Personalised to your child\'s age, diet (vegetarian / eggetarian / non-veg), favourite foods, and dislikes. Swap any meal in one tap — or type in anything you want.',
        },
        {
          emoji: '🎁',
          title: 'Weekly Rewards',
          body: 'Your child picks a reward at the start of the week. Earn 80% of stars Mon–Sat and it\'s unlocked on Sunday. Kids work harder for goals they set themselves.',
        },
        {
          emoji: '🔥',
          title: 'Streaks That Hook Them',
          body: 'A streak counter tracks consecutive days of effort. Watch your child ask to log their meals so they don\'t break the chain.',
        },
        {
          emoji: '🏅',
          title: '6 Achievement Badges',
          body: 'First Sparkle · 3-Day Streak · Week Warrior · Hydration Hero · Super Healthy Day · Star Collector. Real milestones, real pride.',
        },
        {
          emoji: '🥗',
          title: 'Nutrition Reports',
          body: 'A daily score across 6 groups: Protein · Fruit · Vegetables · Dairy · Fiber · Iron. See what was covered and get specific suggestions for tomorrow.',
        },
        {
          emoji: '💧',
          title: 'Hydration Tracking',
          body: 'Set a daily water goal and log it in seconds. The app celebrates when they hit it — and nudges when they haven\'t.',
        },
        {
          emoji: '📊',
          title: 'Parent Dashboard',
          body: '7-day trends, meal completion rates, achievement progress, and CSV export — all behind a PIN so kids can\'t peek.',
        },
        {
          emoji: '👨‍👩‍👧',
          title: 'Multiple Kids, One App',
          body: 'Separate profiles for each child, each with their own meal plan, star history, and goals.',
        },
        {
          emoji: '🌿',
          title: 'Sunday is a Relax Day',
          body: 'No stars required. Because sustainable habits need breathing room, and kids need to be kids.',
        },
      ].map(({ emoji, title, body }) => (
        <Card key={title}>
          <p className="text-base font-extrabold text-slate-800">{emoji} {title}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600 leading-relaxed">{body}</p>
        </Card>
      ))}

      {/* Built by a parent */}
      <Card className="bg-gradient-to-b from-amber-50 to-white text-center !py-6">
        <p className="text-3xl">👨‍💻</p>
        <p className="mt-3 text-base font-extrabold text-slate-800">Built by a Parent Who Gets It</p>
        <p className="mt-2 text-sm font-semibold text-slate-600 leading-relaxed">
          Food Stars was built by a dad trying to make mealtimes less stressful and more joyful for his daughter.
          It's not a corporate product — it's a tool made with love, shared freely with every parent who needs it.
        </p>
        <p className="mt-4 text-sm font-bold text-rose-600">Free · No sign-up · Works on any phone or tablet</p>
      </Card>
    </div>
  )
}

export function UserSelectorPage() {
  const navigate = useNavigate()
  const { userList, createUser, switchUser, deleteUser } = useAppData()

  const [tab, setTab] = useState<Tab>('about')
  const [newName, setNewName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const handleSelectUser = (name: string) => {
    switchUser(name)
    const s = loadUserState(name)
    if (s.profile?.onboardingComplete) {
      navigate('/plan')
    } else {
      navigate('/onboarding')
    }
  }

  const handleCreate = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    const err = createUser(trimmed)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    setNewName('')
    setCreating(false)
    navigate('/onboarding')
  }

  const handleDelete = (name: string) => {
    deleteUser(name)
    setDeleteConfirm(null)
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col gap-4 p-4 pb-10 font-[Nunito]">
      <header className="pt-4 text-center">
        <p className="text-5xl">⭐</p>
        <h1 className="mt-3 text-3xl font-extrabold text-slate-900">Food Stars</h1>
      </header>

      {/* Tab bar */}
      <div className="flex rounded-2xl bg-slate-100 p-1 gap-1">
        {(['about', 'profiles'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-sm font-extrabold transition-all ${
              tab === t
                ? 'bg-white text-rose-600 shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'about' ? '✨ About' : '👤 Profiles'}
          </button>
        ))}
      </div>

      {tab === 'about' && <AboutTab />}

      {tab === 'profiles' && (
        <>
          {userList.length > 0 ? (
            <div className="flex flex-col gap-3">
              {userList.map((name) => {
                const profile = loadUserState(name).profile
                return (
                  <Card key={name} className="!p-0 overflow-hidden">
                    {deleteConfirm === name ? (
                      <div className="p-4">
                        <p className="font-bold text-slate-900">
                          Delete {name}'s profile? All stars and logs will be lost.
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Button
                            variant="danger"
                            className="flex-1"
                            onClick={() => handleDelete(name)}
                          >
                            Yes, delete
                          </Button>
                          <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setDeleteConfirm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4">
                        <span className="text-4xl">{profile?.avatarEmoji ?? '⭐'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-lg font-extrabold text-slate-900 truncate">{name}</p>
                          {profile ? (
                            <p className="text-xs font-semibold text-slate-500">
                              Age {profile.age} · {profile.diet}
                            </p>
                          ) : (
                            <p className="text-xs font-semibold text-slate-400">Setup not complete</p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            type="button"
                            className="rounded-2xl bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700"
                            onClick={() => setDeleteConfirm(name)}
                            aria-label={`Delete ${name}`}
                          >
                            🗑
                          </button>
                          <Button onClick={() => handleSelectUser(name)}>
                            Go ➜
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="text-center py-8">
              <p className="text-4xl">👋</p>
              <p className="mt-3 text-lg font-extrabold text-slate-900">No profiles yet</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Create your first profile below to get started!
              </p>
            </Card>
          )}

          <Card>
            {!creating ? (
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl border-2 border-dashed border-rose-200 px-4 py-4 text-rose-600 font-bold hover:border-rose-400 transition"
                onClick={() => {
                  setCreating(true)
                  setError(null)
                }}
              >
                <span className="text-2xl">➕</span>
                Add a new person
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-bold text-slate-600">Enter child's name</p>
                <input
                  autoFocus
                  className="min-h-[52px] rounded-2xl border border-white/60 bg-white/90 px-4 text-lg font-bold outline-none focus:ring-2 focus:ring-rose-300"
                  placeholder="e.g. Tanvi, Arjun…"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm font-bold text-red-700">{error}</p>
                    <p className="mt-1 text-xs font-semibold text-red-600">
                      Use the 🗑 button next to the existing profile if you want to remove it first.
                    </p>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleCreate} disabled={!newName.trim()}>
                    Create profile
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setCreating(false)
                      setNewName('')
                      setError(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
