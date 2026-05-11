/** Tiny optional UI blip — no external assets. */
export function playStarChime(ctx?: AudioContext | null): void {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = 880
  g.gain.value = 0.0001
  osc.connect(g)
  g.connect(ctx.destination)
  const now = ctx.currentTime
  g.gain.exponentialRampToValueAtTime(0.08, now + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
  osc.start(now)
  osc.stop(now + 0.22)
}

export function getAudioContext(): AudioContext | null {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    return new Ctx()
  } catch {
    return null
  }
}
