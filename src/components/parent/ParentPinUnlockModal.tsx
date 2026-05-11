import { Card } from '../ui/Card'
import { ParentPinUnlockForm } from './ParentPinForms'

export function ParentPinUnlockModal({
  open,
  storedHash,
  onVerified,
  onClose,
}: {
  open: boolean
  storedHash: string
  onVerified: () => void
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      role="dialog"
      aria-modal
      aria-labelledby="parent-pin-unlock-title"
    >
      <Card className="w-full max-w-md !p-6 shadow-2xl">
        <p id="parent-pin-unlock-title" className="sr-only">
          Parent PIN required
        </p>
        <ParentPinUnlockForm
          storedHash={storedHash}
          onVerified={onVerified}
          title="Unlock parent controls"
          subtitle="You need this to swap meals or regenerate the plan."
        />
        <button
          type="button"
          className="mt-4 w-full text-center text-sm font-bold text-slate-500 underline"
          onClick={onClose}
        >
          Cancel
        </button>
      </Card>
    </div>
  )
}
