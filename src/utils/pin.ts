/** App-side salt so the stored hash is not a raw rainbow-table PIN. */
const PIN_SALT = 'food-stars-parent-pin-v1'

function normalizePin(pin: string): string {
  return pin.replace(/\D/g, '')
}

/** 4–6 digits only (easy on iPad, enough for a family lock). */
export function isValidPinFormat(pin: string): boolean {
  const d = normalizePin(pin)
  return d.length >= 4 && d.length <= 6
}

export async function hashParentPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${PIN_SALT}:${normalizePin(pin)}`)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifyParentPin(pin: string, storedHash: string): Promise<boolean> {
  if (!storedHash || !isValidPinFormat(pin)) return false
  const h = await hashParentPin(pin)
  return h === storedHash
}
