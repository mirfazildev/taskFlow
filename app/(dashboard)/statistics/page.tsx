'use client'
// app/(dashboard)/statistics/page.tsx — statistika sahifasi (asosiy sahifaga redirect)
// Asosiy navigatsiya SPA usulida ishlaydi, bu fayl direct URL kirish uchun

import { useEffect } from 'react'
import { useUIStore } from '@/lib/store/uiStore'
import DashboardPage from '../page'

export default function StatisticsPage() {
  const { setActiveTab } = useUIStore()

  useEffect(() => {
    setActiveTab('statistics')
  }, [setActiveTab])

  return <DashboardPage />
}
