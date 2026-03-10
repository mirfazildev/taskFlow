'use client'
// lib/hooks/useRecurring.ts — takrorlanuvchi vazifalar logikasi

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Task, RecurrenceType } from '@/lib/types'

/** Berilgan sana uchun takrorlanuvchi vazifa instance yaratish kerakmi? */
export function shouldRecurOnDate(template: Task, date: string): boolean {
  const d = new Date(date)
  const dayOfWeek = d.getDay() // 0=Yakshanba, 1=Dushanba...

  if (template.recurrence_end_date && date > template.recurrence_end_date) return false

  switch (template.recurrence_type) {
    case 'daily':
      return true

    case 'every_other_day': {
      const templateDate = new Date(template.date)
      const diffDays = Math.round((d.getTime() - templateDate.getTime()) / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays % 2 === 0
    }

    case 'weekly': {
      const days = template.recurrence_days ?? []
      return days.includes(dayOfWeek)
    }

    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5 // Du-Ju

    default:
      return false
  }
}

/** Takrorlanuvchi templatelarni olish va berilgan sana uchun instancelarni yaratish */
export function useEnsureRecurringInstances(date: string, userId: string | undefined) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['recurring', 'ensure', date, userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!userId) return []

      // Barcha template vazifalarni olish
      const { data: templates } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .eq('is_template', true)

      if (!templates || templates.length === 0) return []

      // Bu sana uchun mavjud instancelarni olish
      const { data: existing } = await supabase
        .from('tasks')
        .select('template_id')
        .eq('user_id', userId)
        .eq('date', date)
        .not('template_id', 'is', null)

      const existingTemplateIds = new Set((existing ?? []).map(e => e.template_id))

      // Kerakli instancelarni yaratish
      const toCreate: Omit<Task, 'id' | 'created_at' | 'updated_at'>[] = []

      for (const template of templates as Task[]) {
        // Template sanasidan oldingi sana uchun yaratmaymiz
        if (date < template.date) continue
        // Allaqon mavjud bo'lsa o'tkazib yuboramiz
        if (existingTemplateIds.has(template.id)) continue
        // Takrorlanish shartini tekshiramiz
        if (!shouldRecurOnDate(template, date)) continue

        // time_slots bo'lsa — har bir slot uchun alohida instance
        const slots = template.time_slots && template.time_slots.length > 0
          ? template.time_slots
          : [{ start_time: template.start_time, end_time: template.end_time }]

        slots.forEach((slot, idx) => {
          toCreate.push({
            user_id: userId,
            category_id: template.category_id,
            title: slot.label ? `${template.title} — ${slot.label}` : template.title,
            description: template.description,
            priority: template.priority,
            start_time: slot.start_time,
            end_time: slot.end_time,
            date,
            status: 'pending',
            sort_order: template.sort_order + idx,
            template_id: template.id,
            is_template: false,
            recurrence_type: 'none',
          })
        })
      }

      if (toCreate.length > 0) {
        await supabase.from('tasks').insert(toCreate)
        queryClient.invalidateQueries({ queryKey: ['tasks', date] })
      }

      return toCreate
    },
  })
}

/** Takrorlanuvchi template qo'shish */
export function useAddRecurringTask() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'> & {
    recurrence_type: RecurrenceType
    recurrence_days?: number[]
    recurrence_end_date?: string
  }) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...task, is_template: true })
      .select()
      .single()

    if (error) throw error

    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['recurring'] })
    return data
  }
}
