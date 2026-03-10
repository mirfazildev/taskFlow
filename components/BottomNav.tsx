'use client'
// components/BottomNav.tsx — pastki navigatsiya paneli

import { Calendar, BarChart2, Sparkles, Settings } from 'lucide-react'
import { useUIStore } from '@/lib/store/uiStore'

const TABS = [
  { id: 'today' as const,      label: 'Bugun',       Icon: Calendar },
  { id: 'statistics' as const, label: "Ko'rsatkich", Icon: BarChart2 },
  { id: 'ai' as const,         label: 'AI Tahlil',   Icon: Sparkles },
  { id: 'settings' as const,   label: 'Sozlamalar',  Icon: Settings },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useUIStore()

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        zIndex: 40,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '10px 4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? 'var(--accent-light)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <Icon
                size={20}
                color={isActive ? 'var(--accent)' : 'var(--text3)'}
                style={{ transition: 'color 0.15s' }}
              />
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                color: isActive ? 'var(--accent)' : 'var(--text3)',
                fontWeight: isActive ? 600 : 400,
                transition: 'color 0.15s',
              }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
