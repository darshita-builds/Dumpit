import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type Ref } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CalendarClock, Check, GripVertical, Pencil, Trash } from 'lucide-react'
import type { Task } from '../types'
import { formatDue, type DueTone } from '../lib/nlp'

export interface TaskActions {
  onToggle: (id: string, el: Element) => void
  onUpdate: (id: string, patch: Partial<Task>) => void
  onDelete: (id: string) => void
}

const TONE: Record<DueTone, string> = {
  overdue: 'bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-200 dark:ring-rose-500/30',
  today: 'bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/30',
  soon: 'bg-indigo-50 text-indigo-800 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-200 dark:ring-indigo-500/30',
  later: 'bg-stone-100 text-stone-700 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700',
}

const toDateInput = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function DueBadge({ task }: { task: Task }) {
  if (!task.due) return null
  const { label, tone } = formatDue(task.due, task.hasTime)
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
        task.done ? TONE.later + ' opacity-70' : TONE[tone]
      }`}
    >
      <CalendarClock className="size-3" aria-hidden />
      {tone === 'overdue' && !task.done && <span className="sr-only">Overdue: </span>}
      {label}
    </span>
  )
}

interface CardProps extends Partial<TaskActions> {
  task: Task
  overlay?: boolean
  dragging?: boolean
  cardRef?: Ref<HTMLLIElement>
  style?: CSSProperties
  handleRef?: Ref<HTMLButtonElement>
  handleProps?: HTMLAttributes<HTMLButtonElement>
}

export function TaskCard({ task, overlay, dragging, cardRef, style, handleRef, handleProps, onToggle, onUpdate, onDelete }: CardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)
  const [draftDate, setDraftDate] = useState(task.due ? toDateInput(task.due) : '')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const startEdit = () => {
    if (!onUpdate) return
    setDraft(task.title)
    setDraftDate(task.due ? toDateInput(task.due) : '')
    setEditing(true)
  }

  const save = () => {
    const title = draft.trim()
    if (!title) return
    const patch: Partial<Task> = { title }
    const unchanged = task.due ? toDateInput(task.due) === draftDate : !draftDate
    if (!unchanged) {
      if (draftDate) {
        const [y, m, d] = draftDate.split('-').map(Number)
        patch.due = new Date(y, m - 1, d, 12).toISOString()
        patch.hasTime = false
      } else {
        patch.due = undefined
        patch.hasTime = undefined
      }
    }
    onUpdate?.(task.id, patch)
    setEditing(false)
  }

  const base =
    'group relative flex items-start gap-2 pointer-coarse:gap-1.5 rounded-xl border bg-white p-2.5 shadow-sm transition-shadow dark:bg-stone-900'
  const state = overlay
    ? 'border-indigo-300 shadow-xl ring-2 ring-indigo-400/40 dark:border-indigo-500/60 rotate-1'
    : dragging
      ? 'border-dashed border-stone-300 opacity-40 dark:border-stone-700'
      : 'border-stone-200 hover:shadow-md dark:border-stone-800'

  if (editing) {
    return (
      <li ref={cardRef} style={style} className={`${base} ${state} flex-col`}>
        <label className="sr-only" htmlFor={`edit-${task.id}`}>
          Task
        </label>
        <textarea
          id={`edit-${task.id}`}
          ref={inputRef}
          value={draft}
          rows={2}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              save()
            }
            if (e.key === 'Escape') setEditing(false)
          }}
          className="w-full resize-none rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-base outline-none sm:text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-stone-700 dark:bg-stone-950"
        />
        <div className="flex w-full flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
            Due
            <input
              type="date"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              className="rounded-md border border-stone-300 bg-white px-1.5 py-1 text-base sm:text-xs dark:border-stone-700 dark:bg-stone-950 dark:[color-scheme:dark]"
            />
          </label>
          <div className="ml-auto flex gap-1.5">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-md px-2.5 py-1 text-xs font-medium text-stone-600 pointer-coarse:px-3 pointer-coarse:py-2 pointer-coarse:text-sm hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold pointer-coarse:px-3 pointer-coarse:py-2 pointer-coarse:text-sm text-white hover:bg-indigo-500"
            >
              Save
            </button>
          </div>
        </div>
      </li>
    )
  }

  const iconBtn =
    'grid place-items-center rounded-md p-1 text-stone-400 pointer-coarse:-my-1.5 pointer-coarse:size-8 hover:bg-stone-100 hover:text-stone-700 focus-visible:opacity-100 dark:hover:bg-stone-800 dark:hover:text-stone-200'

  return (
    <li ref={cardRef} style={style} className={`${base} ${state}`}>
      <button
        type="button"
        ref={handleRef}
        {...handleProps}
        aria-label={`Drag “${task.title}”`}
        className="-ml-1 mt-0.5 cursor-grab touch-none rounded p-0.5 text-stone-300 pointer-coarse:-my-1 pointer-coarse:p-1 hover:text-stone-500 active:cursor-grabbing dark:text-stone-600 dark:hover:text-stone-400"
      >
        <GripVertical className="size-4" aria-hidden />
      </button>

      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? `Mark “${task.title}” as not done` : `Complete “${task.title}”`}
        onClick={(e) => onToggle?.(task.id, e.currentTarget)}
        className={`relative mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors after:absolute after:-inset-x-1 after:-inset-y-2 ${
          task.done
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-stone-300 hover:border-emerald-500 dark:border-stone-600'
        }`}
      >
        {task.done && <Check className="size-3" strokeWidth={3} aria-hidden />}
      </button>

      <div className="min-w-0 flex-1">
        <p
          onDoubleClick={startEdit}
          className={`text-sm leading-snug break-words ${
            task.done ? 'text-stone-400 line-through dark:text-stone-500' : 'text-stone-800 dark:text-stone-100'
          }`}
        >
          {task.title}
        </p>
        {task.due && (
          <div className="mt-1.5">
            <DueBadge task={task} />
          </div>
        )}
      </div>

      {!overlay && (
        <div className="flex shrink-0 gap-0.5 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
          <button type="button" onClick={startEdit} aria-label={`Edit “${task.title}”`} className={iconBtn}>
            <Pencil className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(task.id)}
            aria-label={`Delete “${task.title}”`}
            className={`${iconBtn} hover:!text-rose-600`}
          >
            <Trash className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
    </li>
  )
}

export function SortableTaskCard({ task, ...actions }: { task: Task } & TaskActions) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })
  return (
    <TaskCard
      task={task}
      {...actions}
      dragging={isDragging}
      cardRef={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      handleRef={setActivatorNodeRef}
      handleProps={{ ...attributes, ...listeners }}
    />
  )
}
