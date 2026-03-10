'use client'
// app/(dashboard)/ai-review/page.tsx — AI tahlil sahifasi

import { useEffect } from 'react'
import { useUIStore } from '@/lib/store/uiStore'
import DashboardPage from '../page'

export default function AIReviewPage() {
  const { setActiveTab } = useUIStore()

  useEffect(() => {
    setActiveTab('ai')
  }, [setActiveTab])

  return <DashboardPage />
}
