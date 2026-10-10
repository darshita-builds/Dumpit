import type { Task } from '../types'
import { dayDiff, formatDue } from './nlp'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function list(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export function boardStats(tasks: Task[], now = new Date()) {
  const open = tasks.filter((t) => !t.done)
  return {
    total: tasks.length,
    done: tasks.length - open.length,
    open: open.length,
    urgent: open.filter((t) => t.column === 'urgent').length,
    dueToday: open.filter((t) => t.due && dayDiff(t.due, now) === 0).length,
    overdue: open.filter((t) => t.due && dayDiff(t.due, now) < 0).length,
  }
}

/** A short, speakable rundown of the board. */
export function planSummary(tasks: Task[], now = new Date()): string {
  if (tasks.length === 0) return 'Your board is empty. Tap the mic and dump everything on your mind.'
  const open = tasks.filter((t) => !t.done)
  if (open.length === 0) return `All ${plural(tasks.length, 'task')} are done. Nice work. Go enjoy the break.`

  const s = boardStats(tasks, now)
  const parts = [`You have ${plural(s.open, 'open task')}${s.done ? `, and ${s.done} already done` : ''}.`]

  const urgent = open.filter((t) => t.column === 'urgent')
  if (urgent.length) {
    const names = urgent.slice(0, 3).map((t) => t.title.replace(/[.!?]+$/, ''))
    parts.push(`${urgent.length} urgent: ${list(names)}${urgent.length > 3 ? ', and more' : ''}.`)
  }

  const work = open.filter((t) => t.column === 'work').length
  const personal = open.filter((t) => t.column === 'personal').length
  if (work || personal) parts.push(`${work} for work and ${personal} personal.`)

  const inbox = open.filter((t) => t.column === 'inbox').length
  if (inbox) parts.push(`${inbox} still waiting in your inbox.`)
  if (s.overdue) parts.push(`${s.overdue} ${s.overdue === 1 ? 'is' : 'are'} overdue.`)

  const next = open
    .filter((t) => t.due && dayDiff(t.due, now) >= 0)
    .sort((a, b) => +new Date(a.due!) - +new Date(b.due!))[0]
  if (next) parts.push(`Next deadline: ${next.title.replace(/[.!?]+$/, '')}, ${formatDue(next.due!, next.hasTime, now).label.replace(' · ', ' at ')}.`)

  parts.push(urgent.length ? 'Start with the urgent one at the top.' : 'You’ve got this.')
  return parts.join(' ')
}
