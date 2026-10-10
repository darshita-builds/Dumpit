import { useEffect, useRef } from 'react'
import { Mic, Volume2, VolumeX, X } from 'lucide-react'

export const README_SPOKEN =
  'Dumpit was built by voice with Wispr Flow. Talk through everything on your mind, and Dumpit turns it into a task board: ' +
  'it strips the ums and uhs, splits your speech into tasks, spots deadlines, and sorts everything into work, personal, and urgent. ' +
  'It all runs in your browser, with no accounts and no API keys.'

interface Props {
  open: boolean
  onClose: () => void
  speaking: boolean
  onListen: () => void
}

export function ReadMeDialog({ open, onClose, speaking, onListen }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="readme-title"
      className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-3xl bg-white p-0 text-stone-800 shadow-2xl backdrop:bg-stone-950/50 backdrop:backdrop-blur-sm dark:bg-stone-900 dark:text-stone-100"
    >
      <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-indigo-600 to-violet-600 px-6 pt-6 pb-5 text-white">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
        >
          <X className="size-5" aria-hidden />
        </button>
        <p className="mb-1 text-sm font-medium text-indigo-100">Read me</p>
        <h2 id="readme-title" className="font-display text-3xl font-extrabold tracking-tight">
          Dumpit
        </h2>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
          <Mic className="size-4" aria-hidden /> Built by voice with Wispr Flow
        </p>
      </div>

      <div className="space-y-4 px-6 py-5 text-sm leading-relaxed">
        <p>
          This app was dictated, not typed. Every feature started as a spoken idea through Wispr Flow, which felt like the
          right way to build a tool that turns talking into doing.
        </p>

        <div>
          <h3 className="mb-2 font-semibold">How it works</h3>
          <ol className="list-decimal space-y-1 pl-5 text-stone-600 dark:text-stone-300">
            <li>Press the mic and talk. It keeps listening until you press stop. Or just type.</li>
            <li>Remove filler words like “um”, “uh”, and “you know”.</li>
            <li>Split your speech into separate tasks.</li>
            <li>Detect deadlines (“by Friday”, “tomorrow at 3pm”) as date badges.</li>
            <li>Sort tasks into Urgent, Work, and Personal by keywords.</li>
            <li>Drag cards between columns, double-click to edit, tick to complete, and delete what you don’t need.</li>
          </ol>
        </div>

        <p className="rounded-xl bg-stone-100 px-4 py-3 text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          <strong className="text-stone-800 dark:text-stone-100">Private by default.</strong> Your board is saved in this
          browser’s local storage. No accounts, no servers of ours, no API keys. Voice input uses your browser’s built-in
          speech recognition.
        </p>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onListen}
            aria-pressed={speaking}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-3.5 py-2 font-semibold hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
          >
            {speaking ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
            {speaking ? 'Stop' : 'Listen'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
          >
            Got it
          </button>
        </div>
      </div>
    </dialog>
  )
}
