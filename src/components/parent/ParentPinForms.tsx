import { useState } from 'react'
import { hashParentPin, isValidPinFormat, verifyParentPin } from '../../utils/pin'
import { Button } from '../ui/Button'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'] as const

export function PinKeypad({
  value,
  onChange,
  maxLength = 6,
}: {
  value: string
  onChange: (next: string) => void
  maxLength?: number
}) {
  const press = (k: string) => {
    if (k === '' || k === '⌫') {
      if (k === '⌫') onChange(value.slice(0, -1))
      return
    }
    if (value.length >= maxLength) return
    onChange(value + k)
  }

  return (
    <div className="mx-auto grid max-w-[280px] grid-cols-3 gap-2">
      {KEYS.map((k, i) =>
        k === '' ? (
          <span key={`e-${i}`} className="min-h-[52px]" />
        ) : (
          <button
            key={k + String(i)}
            type="button"
            onClick={() => press(k)}
            className="min-h-[52px] rounded-2xl bg-white/90 text-xl font-extrabold text-slate-800 shadow-md active:scale-[0.97]"
          >
            {k}
          </button>
        ),
      )}
    </div>
  )
}

export function PinDots({ length, max = 6 }: { length: number; max?: number }) {
  return (
    <div className="flex justify-center gap-2 py-2">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className={`h-3 w-3 rounded-full ${i < length ? 'bg-rose-500' : 'bg-slate-300/80'}`}
        />
      ))}
    </div>
  )
}

export function ParentPinUnlockForm({
  storedHash,
  onVerified,
  title = 'Parent PIN',
  subtitle = 'Enter your PIN to continue.',
}: {
  storedHash: string
  onVerified: () => void
  title?: string
  subtitle?: string
}) {
  const [digits, setDigits] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setError(null)
    if (digits.length < 4) {
      setError('PIN must be at least 4 digits.')
      return
    }
    setBusy(true)
    try {
      const ok = await verifyParentPin(digits, storedHash)
      if (ok) {
        setDigits('')
        onVerified()
      } else {
        setError('That PIN does not match. Try again.')
        setDigits('')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
      <p className="text-sm font-semibold text-slate-600">{subtitle}</p>
      <PinDots length={digits.length} />
      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
      <PinKeypad value={digits} onChange={setDigits} />
      <Button className="w-full max-w-xs" disabled={busy || digits.length < 4} onClick={() => void submit()}>
        {busy ? 'Checking…' : 'Unlock'}
      </Button>
    </div>
  )
}

export function ParentPinSetupForm({
  onHashed,
}: {
  onHashed: (hash: string) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const nextFromStep1 = () => {
    setError(null)
    if (!isValidPinFormat(first)) {
      setError('Use 4–6 digits only.')
      return
    }
    setStep(2)
    setSecond('')
  }

  const finish = async () => {
    setError(null)
    if (first !== second) {
      setError('PINs did not match. Start again.')
      setStep(1)
      setFirst('')
      setSecond('')
      return
    }
    setBusy(true)
    try {
      const hash = await hashParentPin(first)
      onHashed(hash)
      setFirst('')
      setSecond('')
      setStep(1)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-extrabold text-slate-900">Create parent PIN</h2>
      <p className="text-sm font-semibold text-slate-600">
        {step === 1
          ? 'Choose 4–6 digits. Only adults need this for parent views and editing the plan.'
          : 'Enter the same PIN again to confirm.'}
      </p>
      <PinDots length={step === 1 ? first.length : second.length} />
      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
      <PinKeypad
        value={step === 1 ? first : second}
        onChange={step === 1 ? setFirst : setSecond}
      />
      {step === 1 ? (
        <Button className="w-full max-w-xs" onClick={nextFromStep1} disabled={!isValidPinFormat(first)}>
          Next
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            className="w-full max-w-xs"
            disabled={busy || !isValidPinFormat(second)}
            onClick={() => void finish()}
          >
            {busy ? 'Saving…' : 'Save PIN'}
          </Button>
          <button
            type="button"
            className="text-sm font-bold text-rose-600 underline"
            onClick={() => {
              setStep(1)
              setSecond('')
              setError(null)
            }}
          >
            Back
          </button>
        </div>
      )}
    </div>
  )
}

export function ParentPinChangeForm({
  currentHash,
  onHashed,
  onCancel,
}: {
  currentHash: string
  onHashed: (hash: string) => void
  onCancel: () => void
}) {
  const [phase, setPhase] = useState<'old' | 'new' | 'confirm'>('old')
  const [oldPin, setOldPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const checkOld = async () => {
    setError(null)
    const ok = await verifyParentPin(oldPin, currentHash)
    if (!ok) {
      setError('Current PIN incorrect.')
      setOldPin('')
      return
    }
    setPhase('new')
    setNewPin('')
  }

  const goConfirm = () => {
    setError(null)
    if (!isValidPinFormat(newPin)) {
      setError('Use 4–6 digits.')
      return
    }
    setPhase('confirm')
    setConfirm('')
  }

  const saveNew = async () => {
    setError(null)
    if (newPin !== confirm) {
      setError('New PINs did not match.')
      setConfirm('')
      return
    }
    setBusy(true)
    try {
      const hash = await hashParentPin(newPin)
      onHashed(hash)
      setPhase('old')
      setOldPin('')
      setNewPin('')
      setConfirm('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 text-center">
      <h3 className="text-lg font-extrabold text-slate-900">Change PIN</h3>
      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
      {phase === 'old' ? (
        <>
          <p className="text-xs font-semibold text-slate-600">Current PIN</p>
          <PinDots length={oldPin.length} />
          <PinKeypad value={oldPin} onChange={setOldPin} />
          <Button className="w-full" disabled={oldPin.length < 4} onClick={() => void checkOld()}>
            Continue
          </Button>
        </>
      ) : null}
      {phase === 'new' ? (
        <>
          <p className="text-xs font-semibold text-slate-600">New PIN</p>
          <PinDots length={newPin.length} />
          <PinKeypad value={newPin} onChange={setNewPin} />
          <Button className="w-full" disabled={!isValidPinFormat(newPin)} onClick={goConfirm}>
            Next
          </Button>
        </>
      ) : null}
      {phase === 'confirm' ? (
        <>
          <p className="text-xs font-semibold text-slate-600">Confirm new PIN</p>
          <PinDots length={confirm.length} />
          <PinKeypad value={confirm} onChange={setConfirm} />
          <Button
            className="w-full"
            disabled={busy || !isValidPinFormat(confirm)}
            onClick={() => void saveNew()}
          >
            {busy ? 'Saving…' : 'Save new PIN'}
          </Button>
        </>
      ) : null}
      <button type="button" className="text-sm font-bold text-slate-500 underline" onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}

export function ParentPinRemoveForm({
  currentHash,
  onRemoved,
  onCancel,
}: {
  currentHash: string
  onRemoved: () => void
  onCancel: () => void
}) {
  const [digits, setDigits] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const remove = async () => {
    setError(null)
    setBusy(true)
    try {
      const ok = await verifyParentPin(digits, currentHash)
      if (!ok) {
        setError('PIN incorrect.')
        setDigits('')
        return
      }
      onRemoved()
      setDigits('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3 text-center">
      <h3 className="text-lg font-extrabold text-slate-900">Remove PIN</h3>
      <p className="text-xs font-semibold text-slate-600">
        Parent lock will be turned off until you set a PIN again.
      </p>
      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
      <PinDots length={digits.length} />
      <PinKeypad value={digits} onChange={setDigits} />
      <Button variant="danger" className="w-full" disabled={busy || digits.length < 4} onClick={() => void remove()}>
        {busy ? '…' : 'Remove PIN'}
      </Button>
      <button type="button" className="text-sm font-bold text-slate-500 underline" onClick={onCancel}>
        Cancel
      </button>
    </div>
  )
}
