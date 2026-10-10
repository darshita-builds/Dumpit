import * as chrono from 'chrono-node'
import type { ColumnId } from '../types'

/* ------------------------------------------------------------------ */
/* Filler words                                                        */
/* ------------------------------------------------------------------ */

const FILLER_PATTERNS: RegExp[] = [
  /\b(?:u+m+|u+h+m*|e+r+m+|a+h+|h+m+|m+h*m+)\b,?/gi,
  /\byou know\b,?/gi,
  /\bi mean\b,?/gi,
  /\b(?:basically|literally|actually|honestly|totally|seriously)\b,?/gi,
  /\b(?:so yeah|or whatever|and stuff|or something(?: like that)?)\b/gi,
  // "kind of" / "sort of", but not "what kind of", "this sort of" ...
  /(?<!\b(?:what|this|that|any|some|a|the|every|which|one|no|same|different)\s+)\b(?:kind|sort) of\b,?/gi,
  // "like" only where it's clearly a verbal tic
  /(?<=^|[,.!?]\s*|\b(?:so|and|but|just|it's|was|is|um|uh)\s+)like\b,?/gim,
  // discourse markers at the start of a sentence or line
  /(?<=^|[.!?]\s+)(?:okay|ok|alright|so|well|right|anyway)\b,?(?=\s)/gim,
]

function tidy(text: string): string {
  return text
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([,.!?;])/g, '$1')
    .replace(/,\s*([,.!?;])/g, '$1')
    .replace(/(^|[.!?]\s+|\n)[ ,]+/g, '$1')
    .replace(/^[ \t]+|[ \t]+$/gm, '')
    .replace(/(^|[.!?]\s+|\n)([a-z])/g, (_, pre: string, ch: string) => pre + ch.toUpperCase())
    .trim()
}

export function removeFillers(text: string): { text: string; removed: number } {
  let removed = 0
  let out = text
  // Run twice so stacked markers ("okay so um") all go.
  for (let pass = 0; pass < 2; pass++) {
    for (const re of FILLER_PATTERNS) {
      out = out.replace(re, () => {
        removed++
        return ''
      })
    }
    out = tidy(out)
  }
  return { text: out, removed }
}

/* ------------------------------------------------------------------ */
/* Splitting speech into tasks                                         */
/* ------------------------------------------------------------------ */

const INTENT =
  "(?:i\\s+(?:really\\s+|also\\s+|still\\s+|just\\s+)?(?:need|have|gotta|got|should|must|want)(?:\\s+to)?|i've\\s+got\\s+to|i'?d\\s+like\\s+to|i'?ll|i\\s+will|i'm\\s+going\\s+to|i\\s+am\\s+going\\s+to|we\\s+need\\s+to|don'?t\\s+forget\\s+to|do\\s+not\\s+forget\\s+to|remember\\s+to|make\\s+sure\\s+(?:to|i)|need\\s+to|have\\s+to|gotta|let'?s)"

const SPLITTERS: RegExp[] = [
  // connectors that almost always start a new item
  /(?:,\s*|\s+)(?=(?:and then|and also|after that|oh and|oh also|plus|another thing)\b)/gi,
  /,\s*(?=(?:also|then)\b)/gi,
  // "... and I need to ...", or a fresh "I need to" without punctuation (speech rarely has any)
  new RegExp(`(?:,\\s*|\\s+)(?=${INTENT}\\s)`, 'gi'),
]

const LEADING = /^(?:and then|and also|after that|oh and also|oh and|oh also|another thing is|another thing|next|and|but|so|then|also|plus|oh|okay|ok|alright|well|um|uh|like|yeah|right|anyway)\b[\s,:-]*/i
const LEADING_INTENT = new RegExp(`^${INTENT}\\s+`, 'i')
const TRAILING = /[\s,;:-]*\b(?:and|but|so|or|then|also|plus|um|uh|like)\s*$|[\s,;:.!?-]+$/i
const JUNK = /^(?:yeah|yes|no|okay|ok|so|um|uh|right|anyway|that's it|that's all|i think that's it|and|thanks|thank you)$/i

function cleanChunk(chunk: string): string {
  let s = chunk.trim()
  let prev = ''
  while (s !== prev) {
    prev = s
    s = s.replace(LEADING, '').replace(LEADING_INTENT, '').replace(TRAILING, '').trim()
    s = s.replace(/^to\s+/i, '')
  }
  return s ? s[0].toUpperCase() + s.slice(1) : ''
}

// "... and go to the gym": split on "and" + an action verb, as long as the left side is a real phrase.
const AND_VERB =
  /\s+and\s+(?=(?:go|call|buy|pick|book|email|send|text|pay|clean|finish|schedule|write|fix|get|make|take|check|order|return|cancel|renew|submit|prepare|review|water|walk|feed|wash|visit|start|plan|update|reply|follow|set|sign|print|meet|grab|drop|watch|practice|study|file|apply|research|ask|tell|remind|clear|move|ship|deploy|draft|finalize|organize|wrap)\b)/gi

export function splitIntoTasks(text: string): string[] {
  let marked = text.replace(/\r/g, '')
  for (const re of SPLITTERS) marked = marked.replace(re, '\n')
  marked = marked.replace(AND_VERB, (m, offset: number, whole: string) => {
    const left = whole.slice(0, offset).split(/\n|[.!?;]\s/).pop() ?? ''
    return left.trim().split(/\s+/).length >= 2 ? '\n' : m
  })
  return marked
    .split(/\n+|(?<=[.!?;])\s+/)
    .map(cleanChunk)
    .filter((s) => /[a-z].*[a-z]/i.test(s) && s.length >= 3 && !JUNK.test(s))
}

/* ------------------------------------------------------------------ */
/* Deadlines                                                           */
/* ------------------------------------------------------------------ */

export interface Deadline {
  title: string
  due: string
  hasTime: boolean
}

export function detectDeadline(title: string, ref = new Date()): Deadline | null {
  const [hit] = chrono.parse(title, ref, { forwardDate: true })
  if (!hit) return null

  const hasTime = hit.start.isCertain('hour')
  const date = hit.start.date()
  if (!hasTime) date.setHours(12, 0, 0, 0)

  // Pull the phrase (and its preposition) out of the title so the badge carries it,
  // unless it's part of the sentence ("because the demo is today").
  const head = title.slice(0, hit.index)
  if (/\b(?:is|are|was|were|be|it's|that's)\s*$/i.test(head)) return { title, due: date.toISOString(), hasTime }
  const before = head.replace(/\b(?:due by|due on|due|by|on|before|until|no later than|at|for|this|in)\s*$/i, '')
  const after = title.slice(hit.index + hit.text.length)
  let cleaned = `${before} ${after}`
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .replace(/^[\s,]+|[\s,;:-]+$/g, '')
    .trim()
  if (cleaned.length < 3) cleaned = title
  cleaned = cleaned[0].toUpperCase() + cleaned.slice(1)

  return { title: cleaned, due: date.toISOString(), hasTime }
}

/** Whole days between today and the due date (negative = overdue). */
export function dayDiff(due: string, now = new Date()): number {
  const d = new Date(due)
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return Math.round((a - b) / 86_400_000)
}

export type DueTone = 'overdue' | 'today' | 'soon' | 'later'

export function formatDue(due: string, hasTime = false, now = new Date()): { label: string; tone: DueTone } {
  const d = new Date(due)
  const diff = dayDiff(due, now)
  let label: string
  if (diff === 0) label = 'Today'
  else if (diff === 1) label = 'Tomorrow'
  else if (diff === -1) label = 'Yesterday'
  else if (diff > 1 && diff < 7) label = d.toLocaleDateString(undefined, { weekday: 'long' })
  else
    label = d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      ...(d.getFullYear() !== now.getFullYear() && { year: 'numeric' }),
    })
  if (hasTime) label += ` · ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`

  const tone: DueTone =
    diff < 0 || (hasTime && diff === 0 && d < now) ? 'overdue' : diff === 0 ? 'today' : diff <= 2 ? 'soon' : 'later'
  return { label, tone }
}

/* ------------------------------------------------------------------ */
/* Sorting into columns                                                */
/* ------------------------------------------------------------------ */

const URGENT_WORDS = [
  'urgent', 'urgently', 'asap', 'a.s.a.p', 'immediately', 'right away', 'right now', 'emergency', 'critical',
  'top priority', 'high priority', 'important', 'overdue', 'deadline', 'today', 'tonight', 'this morning',
  'this afternoon', 'by noon', 'eod', 'end of day', 'first thing', 'before it closes', 'last day',
]

const WORK_WORDS = [
  'work', 'meeting', 'meetings', 'email', 'emails', 'client', 'clients', 'customer', 'boss', 'manager', 'team',
  'colleague', 'coworker', 'office', 'report', 'presentation', 'slides', 'deck', 'project', 'proposal', 'budget',
  'invoice', 'contract', 'deploy', 'release', 'ship', 'code', 'bug', 'bugs', 'fix', 'review', 'pr', 'pull request',
  'standup', 'stand-up', 'sprint', 'jira', 'ticket', 'spreadsheet', 'quarterly', 'q1', 'q2', 'q3', 'q4', 'demo',
  'interview', 'hiring', 'onboarding', 'stakeholder', 'roadmap', 'deadline', 'zoom', 'slack', 'docs', 'design',
  'linkedin', 'resume', 'payroll', 'expense', 'expenses', 'login', 'server', 'database', 'feature', 'launch',
]

const PERSONAL_WORDS = [
  'mom', 'mum', 'dad', 'parents', 'sister', 'brother', 'family', 'kids', 'son', 'daughter', 'partner', 'wife',
  'husband', 'friend', 'friends', 'birthday', 'anniversary', 'gift', 'dinner', 'lunch', 'groceries', 'grocery',
  'shopping', 'laundry', 'clean', 'cleaning', 'dishes', 'cook', 'gym', 'workout', 'run', 'yoga', 'doctor',
  'dentist', 'appointment', 'pharmacy', 'medicine', 'rent', 'bills', 'bank', 'car', 'haircut', 'vacation', 'trip',
  'flight', 'dog', 'cat', 'vet', 'plants', 'home', 'house', 'apartment', 'movie', 'book', 'read', 'meditate',
  'church', 'party', 'wedding', 'pick up', 'drop off',
]

function wordRegex(words: string[]): RegExp {
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'))
  return new RegExp(`(?<![\\w-])(?:${escaped.join('|')})(?![\\w-])`, 'gi')
}

const URGENT_RE = wordRegex(URGENT_WORDS)
const WORK_RE = wordRegex(WORK_WORDS)
const PERSONAL_RE = wordRegex(PERSONAL_WORDS)

const count = (re: RegExp, s: string) => s.match(re)?.length ?? 0

export function categorize(task: { title: string; due?: string }, now = new Date()): Exclude<ColumnId, 'inbox'> {
  if (count(URGENT_RE, task.title) > 0) return 'urgent'
  // Deadline phrases like "today" get moved into the badge, so check the date too.
  if (task.due && dayDiff(task.due, now) <= 0) return 'urgent'
  return count(WORK_RE, task.title) > count(PERSONAL_RE, task.title) ? 'work' : 'personal'
}

/* ------------------------------------------------------------------ */

export const EXAMPLE_DUMP =
  "Okay so um I need to finish the quarterly report for the client by Friday and uh I have to call mom tomorrow evening about her birthday dinner. " +
  "Also, like, book a dentist appointment next Tuesday. Oh and I need to fix the login bug ASAP because the demo is today. " +
  'Then, you know, pick up groceries tonight and basically go to the gym on Saturday morning. ' +
  "I should email Priya the presentation slides by Monday at 10am. Don't forget to pay the rent by October 31st, it's kind of important. " +
  'And I want to read that book Sam lent me.'
