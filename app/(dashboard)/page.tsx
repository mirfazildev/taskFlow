'use client'
// app/(dashboard)/page.tsx — asosiy dashboard sahifasi (SPA)
export const dynamic = 'force-dynamic'

import { useUIStore } from '@/lib/store/uiStore'
import { BottomNav } from '@/components/BottomNav'
import { TodayView } from '@/components/TodayView'
import { StatisticsView } from '@/components/StatisticsView'
import { AIView } from '@/components/AIView'
import { SettingsView } from '@/components/SettingsView'

export default function DashboardPage() {
  const { activeTab } = useUIStore()

  return (
    <main
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100svh',
        background: 'var(--bg)',
        position: 'relative',
      }}
    >
      {activeTab === 'today'      && <TodayView />}
      {activeTab === 'statistics' && <StatisticsView />}
      {activeTab === 'ai'         && <AIView />}
      {activeTab === 'settings'   && <SettingsView />}

      <BottomNav />
    </main>
  )
}
