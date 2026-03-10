'use client'
// lib/hooks/useCategories.ts — kategoriyalar uchun hook

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/types'

function getSupabase() {
  return createClient()
}

/** Barcha kategoriyalarni olish */
export function useCategories() {
  const supabase = getSupabase()
  const queryClient = useQueryClient()

  // Realtime: kategoriyalar o'zgarganda avtomatik refetch
  useEffect(() => {
    const channel = supabase
      .channel('categories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['categories'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at')

      if (error) throw error
      return data ?? []
    },
  })

  return { categories, isLoading }
}

/** Kategoriya qo'shish */
export function useAddCategory() {
  const supabase = getSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (cat: Omit<Category, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('categories')
        .insert(cat)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

/** Kategoriyani o'chirish (faqat vazifasiz bo'lsa) */
export function useDeleteCategory() {
  const supabase = getSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Avval bu kategoriyada vazifa borligini tekshir
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id)

      if ((count ?? 0) > 0) {
        throw new Error("Bu kategoriyada vazifalar mavjud. Avval ularni o'chiring.")
      }

      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
