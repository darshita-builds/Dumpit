export type ColumnId = 'inbox' | 'urgent' | 'work' | 'personal'

export interface Task {
  id: string
  title: string
  column: ColumnId
  /** ISO timestamp. Date-only deadlines are stored at local noon with hasTime = false. */
  due?: string
  hasTime?: boolean
  done: boolean
  createdAt: number
}

export const COLUMN_IDS: ColumnId[] = ['inbox', 'urgent', 'work', 'personal']
