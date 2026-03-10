// lib/utils.ts — yordamchi funksiyalar

import { format, eachDayOfInterval, startOfWeek, endOfWeek, subDays } from 'date-fns'
import { uz } from 'date-fns/locale'
import type { Priority } from './types'

/** Bugungi sana string formatda */
export function todayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

/** Sanani O'zbek tilida chiroyli formatlash: "15 mart, 2026" */
export function formatDate(str: string): string {
  try {
    return format(new Date(str), 'd MMMM, yyyy', { locale: uz })
  } catch {
    return str
  }
}

/** Kun nomini O'zbek tilida qaytarish: "Dushanba" */
export function formatDay(str: string): string {
  try {
    return format(new Date(str), 'EEEE', { locale: uz })
  } catch {
    return str
  }
}

/** Qisqa kun nomi: "Du", "Se", ... */
export function formatDayShort(str: string): string {
  try {
    return format(new Date(str), 'EEE', { locale: uz })
  } catch {
    return str
  }
}

/** Berilgan sanadan haftaning barcha kunlari (Dushanba-Yakshanba) */
export function getWeekDays(date: string): string[] {
  const d = new Date(date)
  const start = startOfWeek(d, { weekStartsOn: 1 })
  const end = endOfWeek(d, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end }).map(day => format(day, 'yyyy-MM-dd'))
}

/** Oxirgi 30 kun ro'yxati */
export function getLast30Days(): string[] {
  const today = new Date()
  return Array.from({ length: 30 }, (_, i) =>
    format(subDays(today, 29 - i), 'yyyy-MM-dd')
  )
}

/** Bajarilish foiziga qarab rang qaytarish */
export function getRateColor(rate: number): string {
  if (rate >= 80) return '#16A34A'
  if (rate >= 60) return '#FBBF24'
  if (rate >= 40) return '#F97316'
  return '#EF4444'
}

/** Muhimlik darajasi ranglari */
export const PRIORITY_COLORS: Record<Priority, string> = {
  1: '#94A3B8',
  2: '#60A5FA',
  3: '#FBBF24',
  4: '#F97316',
  5: '#EF4444',
}

/** Muhimlik darajasi O'zbek nomlari */
export const PRIORITY_LABELS: Record<Priority, string> = {
  1: 'Juda past',
  2: 'Past',
  3: "O'rta",
  4: 'Muhim',
  5: 'Juda muhim',
}

/** Kategoriya emoji tanlov ro'yxati (16 ta) */
export const CATEGORY_EMOJIS: string[] = [
  'user', 'briefcase', 'book', 'heart', 'star', 'zap',
  'target', 'music', 'coffee', 'home', 'globe', 'dumbbell',
  'camera', 'code', 'shopping-cart', 'plane',
]

/** Kategoriya rang tanlov ro'yxati (10 ta) */
export const CATEGORY_COLORS: string[] = [
  '#4F7FFF', '#16A34A', '#D97706', '#DC2626', '#9333EA',
  '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#6366F1',
]

/** Vaqtni soat:daqiqa formatida formatlash */
export function formatTime(time: string): string {
  return time.slice(0, 5)
}

/** Ikki vaqt orasidagi daqiqalar soni */
export function getDurationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}
