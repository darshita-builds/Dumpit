import { useCallback, useEffect, useRef, useState } from 'react'

// The Web Speech API isn't in TypeScript's DOM lib, so describe the bits we use.
interface RecognitionAlternative {
  transcript: string
}
interface RecognitionResult {
  isFinal: boolean
  0: RecognitionAlternative
}
interface RecognitionEvent {
  resultIndex: number
  results: ArrayLike<RecognitionResult>
}
interface Recognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type RecognitionCtor = new () => Recognition

function getRecognition(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

const ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser’s site settings and try again.',
  'service-not-allowed': 'Speech recognition is disabled in this browser.',
  'audio-capture': 'No microphone was found.',
  network: 'Speech recognition couldn’t reach its service. Check your connection, or type instead.',
}

/**
 * Continuous dictation. Browsers end a recognition session after a pause,
 * so we quietly restart it until the user presses stop.
 */
export function useSpeechRecognition(onFinal: (text: string) => void) {
  const [supported] = useState(() => typeof window !== 'undefined' && !!getRecognition())
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)

  const recRef = useRef<Recognition | null>(null)
  const wantRef = useRef(false)
  const onFinalRef = useRef(onFinal)
  useEffect(() => {
    onFinalRef.current = onFinal
  }, [onFinal])

  const start = useCallback(() => {
    const Ctor = getRecognition()
    if (!Ctor) return
    setError(null)

    const rec = new Ctor()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = navigator.language || 'en-US'

    rec.onresult = (e) => {
      let pending = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) onFinalRef.current(r[0].transcript)
        else pending += r[0].transcript
      }
      setInterim(pending)
    }
    rec.onerror = (e) => {
      const message = ERRORS[e.error]
      if (message) {
        wantRef.current = false
        setError(message)
      }
      // "no-speech" and "aborted" are routine; onend will restart if needed.
    }
    rec.onend = () => {
      setInterim('')
      if (wantRef.current && recRef.current === rec) {
        try {
          rec.start()
          return
        } catch {
          wantRef.current = false
        }
      }
      setListening(false)
    }

    recRef.current?.abort()
    recRef.current = rec
    wantRef.current = true
    try {
      rec.start()
      setListening(true)
    } catch {
      wantRef.current = false
      setError('Couldn’t start the microphone. Try again.')
    }
  }, [])

  const stop = useCallback(() => {
    wantRef.current = false
    recRef.current?.stop() // stop (not abort) so the last words are still delivered
    setListening(false)
  }, [])

  useEffect(
    () => () => {
      wantRef.current = false
      recRef.current?.abort()
    },
    [],
  )

  return { supported, listening, interim, error, start, stop }
}
