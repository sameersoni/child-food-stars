export function getAudioContext(): AudioContext | null {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    return new Ctx()
  } catch {
    return null
  }
}

/** Cheerful two-tone star chime — audible on iPad/iPhone. */
export async function playStarChime(ctx?: AudioContext | null): Promise<void> {
  if (!ctx) return

  // Browsers suspend AudioContext until a user gesture; resume before playing
  if (ctx.state === 'suspended') {
    try { await ctx.resume() } catch { return }
  }

  const now = ctx.currentTime

  // Play two quick rising tones: C5 → E5 (like a "ding!")
  const notes = [523.25, 659.25]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq

    // Start quiet, peak at 0.35, fade out
    const start = now + i * 0.12
    g.gain.setValueAtTime(0.001, start)
    g.gain.linearRampToValueAtTime(0.35, start + 0.03)
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.28)

    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.3)
  })
}
