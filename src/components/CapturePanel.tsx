import { useEffect, useRef } from 'react'
import {
  CalendarClock,
  Columns3,
  Eraser,
  GripVertical,
  Keyboard,
  Lightbulb,
  Mic,
  MicOff,
  Scissors,
  Square,
  TriangleAlert,
  WandSparkles,
  X,
  type LucideIcon,
} from 'lucide-react'

interface Props {
  text: string
  onTextChange: (text: string) => void
  listening: boolean
  interim: string
  micSupported: boolean
  micError: string | null
  onToggleMic: () => void
  onExample: () => void
  onRemoveFillers: () => void
  onSplit: () => void
  onDeadlines: () => void
  onSort: () => void
  onOrganize: () => void
  onDoAll: () => void
}

function Step({ n, icon: Icon, label, onClick }: { n: number; icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left text-sm font-medium shadow-sm transition hover:-translate-y-px hover:border-indigo-300 hover:shadow-md active:translate-y-0 dark:border-stone-800 dark:bg-stone-900 dark:hover:border-indigo-500/60"
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/15 dark:text-indigo-300">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-stone-400">Step {n}</span>
        {label}
      </span>
    </button>
  )
}

function UnsupportedNotice({ onType }: { onType: () => void }) {
  return (
    <div
      role="note"
      className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
        <MicOff className="size-5" aria-hidden />
      </span>
      <div className="flex-1">
        <p className="font-semibold">Voice input isn’t available in this browser</p>
        <p className="mt-0.5 text-amber-900/80 dark:text-amber-100/80">
          No worries. Open Dumpit in Chrome or Edge to talk it out, or just type your brain dump below. Everything else
          works exactly the same.
        </p>
      </div>
      <button
        type="button"
        onClick={onType}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-900 px-3.5 py-2 font-semibold text-white hover:bg-amber-800 dark:bg-amber-200 dark:text-amber-950 dark:hover:bg-amber-100"
      >
        <Keyboard className="size-4" aria-hidden /> Start typing
      </button>
    </div>
  )
}

export function CapturePanel(p: Props) {
  const areaRef = useRef<HTMLTextAreaElement>(null)

  // Keep the newest dictated words in view.
  useEffect(() => {
    const el = areaRef.current
    if (el && p.listening) el.scrollTop = el.scrollHeight
  }, [p.text, p.listening])

  return (
    <section
      aria-label="Brain dump"
      className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6 dark:border-stone-800 dark:bg-stone-900/60"
    >
      <div className={`grid gap-6 ${p.micSupported ? 'md:grid-cols-[auto_1fr] md:items-start' : ''}`}>
        {/* Mic, or a friendly fallback where speech recognition is missing (e.g. Firefox) */}
        {!p.micSupported ? (
          <UnsupportedNotice onType={() => areaRef.current?.focus()} />
        ) : (
          <div className="flex flex-col items-center gap-3 md:w-48 md:pt-2">
            <button
              type="button"
              onClick={p.onToggleMic}
              aria-pressed={p.listening}
              aria-label={p.listening ? 'Stop listening' : 'Start listening'}
              className={`relative grid size-28 place-items-center rounded-full text-white shadow-lg transition focus-visible:ring-4 focus-visible:ring-indigo-400/50 focus-visible:outline-none sm:size-36 ${
                p.listening
                  ? 'bg-rose-500 shadow-rose-500/30 hover:bg-rose-600'
                  : 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/30 hover:scale-[1.03]'
              }`}
            >
              {p.listening && (
                <>
                  <span className="absolute inset-0 rounded-full bg-rose-500/40 motion-safe:animate-ping" aria-hidden />
                  <span className="absolute -inset-2 rounded-full border-2 border-rose-400/50" aria-hidden />
                </>
              )}
              {p.listening ? (
                <Square className="relative size-10 fill-current" aria-hidden />
              ) : (
                <Mic className="relative size-14" strokeWidth={1.75} aria-hidden />
              )}
            </button>
            <p className="text-center text-sm font-medium" aria-live="polite">
              {p.listening ? (
                <span className="text-rose-600 dark:text-rose-400">Listening… tap to stop</span>
              ) : (
                <span className="text-stone-600 dark:text-stone-300">Tap to start talking</span>
              )}
            </p>
          </div>
        )}

        {/* Transcript + typing box */}
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="dump" className="font-display text-lg font-semibold">
              Your brain dump
            </label>
            <div className="flex gap-1.5">
              {p.text && (
                <button
                  type="button"
                  onClick={() => p.onTextChange('')}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <X className="size-3.5" aria-hidden /> Clear
                </button>
              )}
              <button
                type="button"
                onClick={p.onExample}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/25"
              >
                <Lightbulb className="size-3.5" aria-hidden /> Try an example
              </button>
            </div>
          </div>

          <div
            className={`rounded-2xl border bg-stone-50 transition-colors focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-400/30 dark:bg-stone-950 ${
              p.listening ? 'border-rose-300 dark:border-rose-500/50' : 'border-stone-200 dark:border-stone-800'
            }`}
          >
            <textarea
              id="dump"
              ref={areaRef}
              value={p.text}
              onChange={(e) => p.onTextChange(e.target.value)}
              rows={6}
              placeholder="Talk or type everything on your mind… “I need to email the client by Friday, call mom tomorrow, and um, book the dentist.”"
              className="block w-full resize-y rounded-2xl bg-transparent px-4 py-3 text-base leading-relaxed outline-none placeholder:text-stone-400"
            />
            {p.listening && (
              <div
                aria-live="polite"
                className="flex items-start gap-2 border-t border-dashed border-stone-200 px-4 py-2.5 text-sm dark:border-stone-800"
              >
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-rose-500 motion-safe:animate-pulse" aria-hidden />
                <span className="text-stone-500 italic dark:text-stone-400">
                  {p.interim || 'Live transcript appears here as you speak…'}
                </span>
              </div>
            )}
          </div>

          {p.micError && (
            <p role="alert" className="flex items-start gap-2 text-sm text-rose-700 dark:text-rose-300">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> {p.micError}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 border-t border-stone-200 pt-5 dark:border-stone-800">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-stone-600 dark:text-stone-300">Turn it into a plan</h2>
          <button
            type="button"
            onClick={p.onDoAll}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/30 hover:bg-indigo-500"
          >
            <WandSparkles className="size-4" aria-hidden /> Do it all
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Step n={1} icon={Eraser} label="Remove filler words" onClick={p.onRemoveFillers} />
          <Step n={2} icon={Scissors} label="Split my speech into tasks" onClick={p.onSplit} />
          <Step n={3} icon={CalendarClock} label="Detect deadlines as date badges" onClick={p.onDeadlines} />
          <Step n={4} icon={Columns3} label="Sort into work, personal & urgent" onClick={p.onSort} />
          <Step n={5} icon={GripVertical} label="Drag, edit, complete & delete" onClick={p.onOrganize} />
        </div>
      </div>
    </section>
  )
}
