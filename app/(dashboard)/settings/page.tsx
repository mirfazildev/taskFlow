'use client'
// app/(dashboard)/settings/page.tsx — sozlamalar sahifasi

import { useEffect } from 'react'
import { useUIStore } from '@/lib/store/uiStore'
import DashboardPage from '../page'

export default function SettingsPage() {
  const { setActiveTab } = useUIStore()

  useEffect(() => {
    setActiveTab('settings')
  }, [setActiveTab])

  return <DashboardPage />
}
