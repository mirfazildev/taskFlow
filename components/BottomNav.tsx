'use client'
// components/BottomNav.tsx — pastki navigatsiya paneli

import { CalendarDays, TrendingUp, BrainCircuit, SlidersHorizontal } from 'lucide-react'
import { useUIStore } from '@/lib/store/uiStore'

const TABS = [
  { id: 'today' as const,      label: 'Bugun',       Icon: CalendarDays },
  { id: 'statistics' as const, label: "Ko'rsatkich", Icon: TrendingUp },
  { id: 'ai' as const,         label: 'AI Tahlil',   Icon: BrainCircuit },
  { id: 'settings' as const,   label: 'Sozlamalar',  Icon: SlidersHorizontal },
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
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--nav-border)',
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
              gap: 4,
              padding: '10px 4px 8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            {/* Active top indicator */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: isActive ? 24 : 0,
                height: 3,
                borderRadius: '0 0 3px 3px',
                background: 'var(--accent)',
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />

            {/* Icon container */}
            <div
              style={{
                width: 40,
                height: 36,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive ? 'var(--accent-light)' : 'transparent',
                transition: 'all 0.2s',
              }}
            >
              <Icon
                size={isActive ? 22 : 20}
                strokeWidth={isActive ? 2.2 : 1.8}
                color={isActive ? 'var(--accent)' : 'var(--text3)'}
                style={{ transition: 'all 0.2s' }}
              />
            </div>

            <span
              style={{
                fontSize: '0.65rem',
                color: isActive ? 'var(--accent)' : 'var(--text3)',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s',
                letterSpacing: '0.01em',
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
