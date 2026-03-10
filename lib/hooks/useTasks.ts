'use client'
// lib/hooks/useTasks.ts — vazifalar uchun TanStack Query + Supabase + Optimistic Updates + Realtime

import { useEffect } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Task, TaskStatus } from '@/lib/types'

function getSupabase() {
  return createClient()
}

/** Berilgan sana uchun vazifalarni olish */
export function useTasks(date: string) {
  const supabase = getSupabase()
  const queryClient = useQueryClient()

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`tasks:${date}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `date=eq.${date}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks', date] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [date])

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', date],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, categories(*)')
        .eq('date', date)
        .order('sort_order')
        .order('start_time')

      if (error) throw error
      return (data ?? []) as Task[]
    },
  })

  return { tasks, isLoading }
}

/** Vazifa qo'shish */
export function useAddTask() {
  const supabase = getSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(task)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.date] })
    },
  })
}

/** Vazifani yangilash (optimistic update) */
export function useUpdateTask() {
  const supabase = getSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates, date }: { id: string; updates: Partial<Task>; date: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ id, updates, date }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', date] })
      const prev = queryClient.getQueryData<Task[]>(['tasks', date])
      queryClient.setQueryData<Task[]>(['tasks', date], (old = []) =>
        old.map(t => t.id === id ? { ...t, ...updates } : t)
      )
      return { prev }
    },
    onError: (_err, { date }, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['tasks', date], ctx.prev)
    },
    onSettled: (_data, _err, { date }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', date] })
    },
  })
}

/** Vazifani o'chirish */
export function useDeleteTask() {
  const supabase = getSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string }) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      return { id, date }
    },
    onSuccess: ({ date }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', date] })
    },
  })
}

/** Vazifa statusini tez almashtiris (optimistic) */
export function useToggleTask() {
  const supabase = getSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ task }: { task: Task }) => {
      const newStatus: TaskStatus =
        task.status === 'completed' ? 'pending' : 'completed'
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onMutate: async ({ task }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', task.date] })
      const prev = queryClient.getQueryData<Task[]>(['tasks', task.date])
      const newStatus: TaskStatus =
        task.status === 'completed' ? 'pending' : 'completed'
      queryClient.setQueryData<Task[]>(['tasks', task.date], (old = []) =>
        old.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
      )
      return { prev }
    },
    onError: (_err, { task }, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['tasks', task.date], ctx.prev)
    },
    onSettled: (_data, _err, { task }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.date] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

/** Vazifalar tartibini o'zgartirish (drag & drop) */
export function useReorderTasks() {
  const supabase = getSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tasks, date }: { tasks: Task[]; date: string }) => {
      const updates = tasks.map((t, i) => ({
        id: t.id,
        sort_order: i,
        // minimal update
        user_id: t.user_id,
        title: t.title,
        start_time: t.start_time,
        end_time: t.end_time,
        date: t.date,
        status: t.status,
        priority: t.priority,
      }))

      // batch upsert
      const { error } = await supabase.from('tasks').upsert(updates)
      if (error) throw error
      return { date }
    },
    onMutate: async ({ tasks, date }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', date] })
      const prev = queryClient.getQueryData<Task[]>(['tasks', date])
      queryClient.setQueryData<Task[]>(['tasks', date], tasks)
      return { prev }
    },
    onError: (_err, { date }, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['tasks', date], ctx.prev)
    },
    onSettled: (_data, _err, { date }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', date] })
    },
  })
}
