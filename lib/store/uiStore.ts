// lib/store/uiStore.ts — Zustand (faqat UI holati)

import { create } from 'zustand'
import { format } from 'date-fns'

interface UIStore {
  activeTab: 'today' | 'statistics' | 'ai' | 'settings'
  selectedDate: string
  filterCategoryId: string | null
  setActiveTab: (tab: UIStore['activeTab']) => void
  setSelectedDate: (date: string) => void
  setFilterCategoryId: (id: string | null) => void
}

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'today',
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  filterCategoryId: null,
  setActiveTab: (activeTab) => set({ activeTab }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setFilterCategoryId: (filterCategoryId) => set({ filterCategoryId }),
}))
