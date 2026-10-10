import confetti from 'canvas-confetti'

const COLORS = ['#4f46e5', '#f43f5e', '#0ea5e9', '#10b981', '#f59e0b']

/** A small burst from the element that was clicked. */
export function burstFrom(el: Element | null) {
  const rect = el?.getBoundingClientRect()
  const origin = rect
    ? { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight }
    : { x: 0.5, y: 0.6 }
  confetti({ particleCount: 60, spread: 70, startVelocity: 32, scalar: 0.9, origin, colors: COLORS, disableForReducedMotion: true })
}

/** Everything's done: a bigger two-sided celebration. */
export function celebrate() {
  const opts = { particleCount: 120, spread: 80, startVelocity: 55, colors: COLORS, disableForReducedMotion: true }
  confetti({ ...opts, angle: 60, origin: { x: 0, y: 0.75 } })
  confetti({ ...opts, angle: 120, origin: { x: 1, y: 0.75 } })
}

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/** Speak text aloud, replacing anything already being read. */
export function speak(text: string, onDone: () => void) {
  if (!canSpeak()) return false
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = 1.02
  u.onend = onDone
  u.onerror = onDone
  window.speechSynthesis.speak(u)
  return true
}

export function stopSpeaking() {
  if (canSpeak()) window.speechSynthesis.cancel()
}
