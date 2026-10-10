import { useState, type Dispatch, type SetStateAction } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Briefcase, Flame, House, Inbox, type LucideIcon } from 'lucide-react'
import { COLUMN_IDS, type ColumnId, type Task } from '../types'
import { SortableTaskCard, TaskCard, type TaskActions } from './TaskCard'

const COLUMNS: Record<ColumnId, { title: string; icon: LucideIcon; dot: string; tint: string; empty: string }> = {
  inbox: {
    title: 'Inbox',
    icon: Inbox,
    dot: 'text-stone-500 bg-stone-200 dark:bg-stone-800 dark:text-stone-300',
    tint: 'bg-stone-100/70 dark:bg-stone-900/60',
    empty: 'Split tasks land here first.',
  },
  urgent: {
    title: 'Urgent',
    icon: Flame,
    dot: 'text-rose-600 bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300',
    tint: 'bg-rose-50/70 dark:bg-rose-500/[0.06]',
    empty: 'Nothing on fire. Lovely.',
  },
  work: {
    title: 'Work',
    icon: Briefcase,
    dot: 'text-sky-600 bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300',
    tint: 'bg-sky-50/70 dark:bg-sky-500/[0.06]',
    empty: 'Meetings, emails, reports…',
  },
  personal: {
    title: 'Personal',
    icon: House,
    dot: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300',
    tint: 'bg-emerald-50/70 dark:bg-emerald-500/[0.06]',
    empty: 'Errands, family, health…',
  },
}

const isColumn = (id: string): id is ColumnId => (COLUMN_IDS as string[]).includes(id)

function Column({ id, tasks, actions }: { id: ColumnId; tasks: Task[]; actions: TaskActions }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const meta = COLUMNS[id]
  const Icon = meta.icon
  const open = tasks.filter((t) => !t.done).length

  return (
    <section
      aria-labelledby={`col-${id}`}
      className={`flex min-h-48 flex-col rounded-2xl p-3 transition-shadow ${meta.tint} ${
        isOver ? 'ring-2 ring-indigo-400/60' : ''
      }`}
    >
      <header className="mb-3 flex items-center gap-2 px-1">
        <span className={`grid size-7 place-items-center rounded-lg ${meta.dot}`}>
          <Icon className="size-4" aria-hidden />
        </span>
        <h3 id={`col-${id}`} className="font-display text-base font-semibold">
          {meta.title}
        </h3>
        <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium tabular-nums text-stone-600 dark:bg-stone-800 dark:text-stone-300">
          {open}
          {tasks.length !== open && <span className="text-stone-400"> / {tasks.length}</span>}
        </span>
      </header>

      <SortableContext id={id} items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex flex-1 flex-col gap-2">
          {tasks.map((t) => (
            <SortableTaskCard key={t.id} task={t} {...actions} />
          ))}
          {tasks.length === 0 && (
            <li className="grid flex-1 place-items-center rounded-xl border-2 border-dashed border-stone-300/70 p-4 text-center text-sm text-stone-500 dark:border-stone-700 dark:text-stone-400">
              {meta.empty}
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  )
}

interface BoardProps extends TaskActions {
  tasks: Task[]
  setTasks: Dispatch<SetStateAction<Task[]>>
}

export function Board({ tasks, setTasks, ...actions }: BoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const showInbox = tasks.some((t) => t.column === 'inbox')
  const columns = COLUMN_IDS.filter((c) => c !== 'inbox' || showInbox)
  const activeTask = tasks.find((t) => t.id === activeId)

  const onDragStart = ({ active }: DragStartEvent) => setActiveId(String(active.id))

  // Moving between columns happens live while dragging so the card previews in its new spot.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const activeKey = String(active.id)
    const overKey = String(over.id)
    setTasks((prev) => {
      const moving = prev.find((t) => t.id === activeKey)
      const target = isColumn(overKey) ? overKey : prev.find((t) => t.id === overKey)?.column
      if (!moving || !target || moving.column === target) return prev
      const rest = prev.filter((t) => t.id !== activeKey)
      const at = rest.findIndex((t) => t.id === overKey)
      const moved = { ...moving, column: target }
      return at === -1 ? [...rest, moved] : [...rest.slice(0, at), moved, ...rest.slice(at)]
    })
  }

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    setTasks((prev) => {
      const from = prev.findIndex((t) => t.id === active.id)
      const to = prev.findIndex((t) => t.id === over.id)
      if (from === -1 || to === -1 || prev[from].column !== prev[to].column) return prev
      return arrayMove(prev, from, to)
    })
  }

  const grid = columns.length === 4 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className={`grid gap-4 ${grid}`}>
        {columns.map((id) => (
          <Column key={id} id={id} tasks={tasks.filter((t) => t.column === id)} actions={actions} />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
        {activeTask ? (
          <ul>
            <TaskCard task={activeTask} overlay />
          </ul>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
