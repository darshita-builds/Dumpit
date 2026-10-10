import { ListChecks, RotateCcw, Volume2, VolumeX } from 'lucide-react'
import type { Task } from '../types'
import { boardStats } from '../lib/plan'

interface Props {
  tasks: Task[]
  speaking: boolean
  onReadPlan: () => void
  onClearDone: () => void
  onClearAll: () => void
}

function Stat({ label, value, tone = '' }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
      <span className={`font-display text-xl font-semibold tabular-nums ${tone}`}>{value}</span>
      <span className="text-xs text-stone-500 dark:text-stone-400">{label}</span>
    </div>
  )
}

export function SummaryBar({ tasks, speaking, onReadPlan, onClearDone, onClearAll }: Props) {
  const s = boardStats(tasks)
  const pct = s.total ? Math.round((s.done / s.total) * 100) : 0

  return (
    <div
      role="region"
      aria-label="Summary"
      className="z-20 -mx-4 border-y sm:sticky sm:top-0 border-stone-200 bg-stone-50/85 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border dark:border-stone-800 dark:bg-stone-950/85"
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex min-w-48 flex-1 items-center gap-3">
          <ListChecks className="size-5 shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden />
          <div className="flex-1">
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium">
                {s.done} of {s.total} done
              </span>
              <span className="tabular-nums text-stone-500 dark:text-stone-400">{pct}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label="Tasks completed"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-4 gap-x-3 sm:flex sm:w-auto sm:gap-x-5">
          <Stat label="open" value={s.open} />
          <Stat label="urgent" value={s.urgent} tone={s.urgent ? 'text-rose-600 dark:text-rose-400' : ''} />
          <Stat label="due today" value={s.dueToday} tone={s.dueToday ? 'text-amber-600 dark:text-amber-400' : ''} />
          <Stat label="overdue" value={s.overdue} tone={s.overdue ? 'text-rose-600 dark:text-rose-400' : ''} />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {s.done > 0 && (
            <button
              type="button"
              onClick={onClearDone}
              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-200/70 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Clear completed
            </button>
          )}
          {s.total > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-200/70 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <RotateCcw className="size-3.5" aria-hidden /> Start over
            </button>
          )}
          <button
            type="button"
            onClick={onReadPlan}
            aria-pressed={speaking}
            disabled={s.total === 0 && !speaking}
            title={s.total === 0 ? 'Add some tasks first' : undefined}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-stone-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-stone-900 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200 dark:disabled:hover:bg-white"
          >
            {speaking ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
            {speaking ? 'Stop reading' : 'Read my plan'}
          </button>
        </div>
      </div>
    </div>
  )
}
