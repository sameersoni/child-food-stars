import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../../context/AppDataContext'
import { loadUserState } from '../../services/storageService'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

export function UserSelectorPage() {
  const navigate = useNavigate()
  const { userList, createUser, switchUser, deleteUser } = useAppData()

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
        <p className="mt-2 text-base font-semibold text-slate-600">
          Who's eating today?
        </p>
      </header>

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
    </div>
  )
}
