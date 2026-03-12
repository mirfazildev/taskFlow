'use client'
// lib/hooks/useStats.ts — statistika uchun hook

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getWeekDays, getLast30Days } from '@/lib/utils'
import type { DailyStats } from '@/lib/types'

function getSupabase() {
  return createClient()
}

/** Bitta kun statistikasi */
export function useDailyStats(date: string) {
  const supabase = getSupabase()

  const { data } = useQuery({
    queryKey: ['stats', 'daily', date],
    queryFn: async (): Promise<DailyStats | null> => {
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('date', date)
        .maybeSingle()
      if (error) return null
      return data as DailyStats | null
    },
  })

  return data ?? null
}

/** Haftalik statistika (7 kun) */
export function useWeeklyStats(date: string) {
  const supabase = getSupabase()
  const weekDays = getWeekDays(date)

  const { data = [], isLoading } = useQuery({
    queryKey: ['stats', 'weekly', date],
    queryFn: async (): Promise<DailyStats[]> => {
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .in('date', weekDays)
        .order('date')
      if (error) throw error
      // Mavjud bo'lmagan kunlar uchun bo'sh yozuv qo'shish
      return weekDays.map(d => {
        const found = (data ?? []).find(s => s.date === d)
        return found ?? {
          id: `placeholder-${d}`, user_id: '', date: d,
          total_tasks: 0, completed_tasks: 0,
          completion_rate: 0, by_category: {},
        } as DailyStats
      })
    },
  })

  return { data, isLoading }
}

/** Oylik statistika (30 kun) */
export function useMonthlyStats() {
  const supabase = getSupabase()
  const last30 = getLast30Days()

  const { data = [], isLoading } = useQuery({
    queryKey: ['stats', 'monthly'],
    queryFn: async (): Promise<DailyStats[]> => {
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .in('date', last30)
        .order('date')
      if (error) throw error

      return last30.map(d => {
        const found = (data ?? []).find(s => s.date === d)
        return found ?? {
          id: `placeholder-${d}`, user_id: '', date: d,
          total_tasks: 0, completed_tasks: 0,
          completion_rate: 0, by_category: {},
        } as DailyStats
      })
    },
  })

  return { data, isLoading }
}

/** Ketma-ket 70%+ bajarilish streaki */
export function useStreak() {
  const supabase = getSupabase()

  const { data: streak = 0 } = useQuery({
    queryKey: ['stats', 'streak'],
    queryFn: async (): Promise<number> => {
      const last30 = getLast30Days().reverse() // yangi -> eski

      const { data } = await supabase
        .from('daily_stats')
        .select('date, completion_rate, total_tasks')
        .in('date', last30)
        .order('date', { ascending: false })

      if (!data) return 0

      let count = 0
      for (const d of last30) {
        const stat = data.find(s => s.date === d)
        if (stat && stat.total_tasks > 0 && stat.completion_rate >= 70) {
          count++
        } else if (stat && stat.total_tasks === 0) {
          // Vazifa yo'q kun - hisobga olmaymiz
          continue
        } else {
          break
        }
      }
      return count
    },
  })

  return streak
}
