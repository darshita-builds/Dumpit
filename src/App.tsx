import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen, Mic } from 'lucide-react'
import type { Task } from './types'
import { usePersistentState } from './hooks/usePersistentState'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { EXAMPLE_DUMP, categorize, detectDeadline, removeFillers, splitIntoTasks } from './lib/nlp'
import { planSummary } from './lib/plan'
import { burstFrom, canSpeak, celebrate, speak, stopSpeaking } from './lib/effects'
import { CapturePanel } from './components/CapturePanel'
import { SummaryBar } from './components/SummaryBar'
import { Board } from './components/Board'
import { ReadMeDialog, README_SPOKEN } from './components/ReadMeDialog'

const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

const newTask = (title: string): Task => ({ id: uid(), title, column: 'inbox', done: false, createdAt: Date.now() })

function withDeadline(t: Task): Task {
  if (t.due || t.done) return t
  const d = detectDeadline(t.title)
  return d ? { ...t, ...d } : t
}

function withoutFillers(t: Task): [Task, number] {
  if (t.done) return [t, 0]
  const { text, removed } = removeFillers(t.title)
  return removed && text ? [{ ...t, title: text }, removed] : [t, 0]
}

export default function App() {
  const [text, setText] = usePersistentState('dumpit.text', '')
  const [tasks, setTasks] = usePersistentState<Task[]>('dumpit.tasks', [])
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null)
  const [speaking, setSpeaking] = useState<'plan' | 'readme' | null>(null)
  const [readmeOpen, setReadmeOpen] = useState(false)
  const boardRef = useRef<HTMLElement>(null)
  const speechToken = useRef(0)

  const notify = (message: string) => setToast({ id: Date.now(), message })

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3800)
    return () => clearTimeout(t)
  }, [toast])

  /* ---------- voice in ---------- */

  const appendSpeech = useCallback(
    (chunk: string) => {
      const words = chunk.trim()
      if (!words) return
      const line = words[0].toUpperCase() + words.slice(1)
      setText((prev) => (prev.trim() ? `${prev.replace(/\s+$/, '')}\n${line}` : line))
    },
    [setText],
  )
  const mic = useSpeechRecognition(appendSpeech)
  const toggleMic = () => (mic.listening ? mic.stop() : mic.start())

  /* ---------- voice out ---------- */

  const toggleSpeech = (kind: 'plan' | 'readme', words: string) => {
    if (speaking === kind) {
      stopSpeaking()
      setSpeaking(null)
      return
    }
    if (!canSpeak()) {
      notify(words)
      return
    }
    const token = ++speechToken.current
    speak(words, () => {
      if (speechToken.current === token) setSpeaking(null)
    })
    setSpeaking(kind)
  }

  useEffect(() => () => stopSpeaking(), [])

  /* ---------- pipeline ---------- */

  const showBoard = () => boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const tryExample = () => {
    if (mic.listening) mic.stop()
    setText(EXAMPLE_DUMP)
    notify('Example loaded. Try the steps one by one, or hit “Do it all”.')
  }

  const handleRemoveFillers = () => {
    if (!text.trim() && !tasks.length) return notify('Nothing to clean yet. Speak or type first.')
    const cleaned = removeFillers(text)
    let removed = cleaned.removed
    const next = tasks.map((t) => {
      const [task, n] = withoutFillers(t)
      removed += n
      return task
    })
    setText(cleaned.text)
    setTasks(next)
    notify(removed ? `Removed ${plural(removed, 'filler word')}.` : 'No filler words found. Crisp!')
  }

  const handleSplit = () => {
    if (!text.trim()) return notify('Nothing to split yet. Speak, type, or try the example.')
    const titles = splitIntoTasks(text)
    if (!titles.length) return notify('Couldn’t find any tasks in that. Try adding a little more detail.')
    setTasks((prev) => [...prev, ...titles.map(newTask)])
    setText('')
    notify(`Split into ${plural(titles.length, 'task')}. They’re waiting in your Inbox.`)
    showBoard()
  }

  const handleDeadlines = () => {
    if (!tasks.length) return notify(text.trim() ? 'Split your speech into tasks first.' : 'No tasks yet.')
    let found = 0
    const next = tasks.map((t) => {
      const updated = withDeadline(t)
      if (updated !== t) found++
      return updated
    })
    setTasks(next)
    notify(found ? `Found ${plural(found, 'deadline')}.` : 'No new deadlines found.')
  }

  const handleSort = () => {
    const inbox = tasks.filter((t) => t.column === 'inbox')
    if (!inbox.length)
      return notify(tasks.length ? 'Your Inbox is empty. Everything’s already sorted.' : 'No tasks to sort yet.')
    const counts = { urgent: 0, work: 0, personal: 0 }
    const next = tasks.map((t) => {
      if (t.column !== 'inbox') return t
      const column = categorize(t)
      counts[column]++
      return { ...t, column }
    })
    setTasks(next)
    notify(`Sorted: ${counts.urgent} urgent, ${counts.work} work, ${counts.personal} personal.`)
    showBoard()
  }

  const handleOrganize = () => {
    showBoard()
    notify(
      tasks.length
        ? 'Drag the ⋮⋮ handle to move a task. Double-click or ✎ to edit, tick the circle to complete, 🗑 to delete.'
        : 'Once you have tasks, you can drag, edit, complete and delete them here.',
    )
  }

  const handleDoAll = () => {
    const hasInbox = tasks.some((t) => t.column === 'inbox')
    if (!text.trim() && !hasInbox) return notify('Nothing to process yet. Speak, type, or try the example.')
    const created = splitIntoTasks(removeFillers(text).text).map(newTask)
    const next = [...tasks, ...created].map((t) => {
      if (t.column !== 'inbox') return t
      const task = withDeadline(withoutFillers(t)[0])
      return { ...task, column: categorize(task) }
    })
    setTasks(next)
    setText('')
    notify(created.length ? `Done! ${plural(created.length, 'task')} sorted onto your board.` : 'Inbox sorted.')
    showBoard()
  }

  /* ---------- task actions ---------- */

  const toggleTask = (id: string, el: Element) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const nowDone = !task.done
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: nowDone } : t)))
    if (!nowDone) return
    if (tasks.every((t) => t.done || t.id === id)) {
      celebrate()
      notify('Everything’s done. Brain: empty. 🎉')
    } else burstFrom(el)
  }

  const updateTask = (id: string, patch: Partial<Task>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

  const deleteTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id))

  const clearDone = () => setTasks((prev) => prev.filter((t) => !t.done))

  const clearAll = () => {
    if (window.confirm('Clear every task from the board?')) setTasks([])
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
            <Mic className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="font-display text-2xl leading-none font-extrabold tracking-tight">Dumpit</h1>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Brain dump in. Task board out.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setReadmeOpen(true)}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold whitespace-nowrap hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800"
        >
          <BookOpen className="size-4" aria-hidden /> Read me
        </button>
      </header>

      <CapturePanel
        text={text}
        onTextChange={setText}
        listening={mic.listening}
        interim={mic.interim}
        micSupported={mic.supported}
        micError={mic.error}
        onToggleMic={toggleMic}
        onExample={tryExample}
        onRemoveFillers={handleRemoveFillers}
        onSplit={handleSplit}
        onDeadlines={handleDeadlines}
        onSort={handleSort}
        onOrganize={handleOrganize}
        onDoAll={handleDoAll}
      />

      <SummaryBar
        tasks={tasks}
        speaking={speaking === 'plan'}
        onReadPlan={() => toggleSpeech('plan', planSummary(tasks))}
        onClearDone={clearDone}
        onClearAll={clearAll}
      />

      <main ref={boardRef} className="scroll-mt-28" aria-label="Task board">
        <Board tasks={tasks} setTasks={setTasks} onToggle={toggleTask} onUpdate={updateTask} onDelete={deleteTask} />
      </main>

      <footer className="mt-auto pt-6 text-center text-xs text-stone-500 dark:text-stone-400">
        Built by voice with Wispr Flow · Everything stays in your browser
      </footer>

      <ReadMeDialog
        open={readmeOpen}
        onClose={() => {
          setReadmeOpen(false)
          if (speaking === 'readme') toggleSpeech('readme', README_SPOKEN)
        }}
        speaking={speaking === 'readme'}
        onListen={() => toggleSpeech('readme', README_SPOKEN)}
      />

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
        {toast && (
          <div
            key={toast.id}
            className="toast-in max-w-md rounded-xl bg-stone-900 px-4 py-3 text-sm text-white shadow-xl dark:bg-white dark:text-stone-900"
          >
            {toast.message}
          </div>
        )}
      </div>
    </div>
  )
}
