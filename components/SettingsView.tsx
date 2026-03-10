'use client'
// components/SettingsView.tsx — sozlamalar ko'rinishi

import { useState } from 'react'
import { LogOut, Trash2, Plus, Bell } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { useCategories, useDeleteCategory } from '@/lib/hooks/useCategories'
import { CategoryModal } from './CategoryModal'
import { createClient } from '@/lib/supabase/client'

export function SettingsView() {
  const { user, profile, signOut } = useAuth()
  const { categories } = useCategories()
  const deleteCategory = useDeleteCategory()
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [reminderTime, setReminderTime] = useState(profile?.reminder_time ?? '22:00')
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [deleteError, setDeleteError] = useState('')

  async function saveReminderTime(time: string) {
    setReminderTime(time)
    const supabase = createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return

    await supabase
      .from('profiles')
      .update({ reminder_time: time })
      .eq('id', currentUser.id)

    // Brauzerni yangilash
    if (reminderEnabled && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  async function handleDeleteCategory(id: string, name: string) {
    setDeleteError('')
    if (!confirm(`"${name}" kategoriyasini o'chirishni tasdiqlaysizmi?`)) return
    try {
      await deleteCategory.mutateAsync(id)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "O'chirishda xatolik")
    }
  }

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <h1
        style={{
          fontFamily: 'Instrument Serif, serif',
          fontSize: '1.6rem',
          marginBottom: 20,
        }}
      >
        Sozlamalar
      </h1>

      {/* Profil */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Profil</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt="Avatar"
              width={52}
              height={52}
              style={{ borderRadius: '50%', border: '2px solid var(--border)' }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                fontWeight: 700,
                fontSize: '1.1rem',
              }}
            >
              {profile?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '1rem' }}>
              {profile?.full_name ?? 'Foydalanuvchi'}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
              {user?.email}
            </p>
          </div>
        </div>
      </section>

      {/* Eslatma vaqti */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Kunlik eslatma</h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={16} color="var(--text2)" />
            <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>Eslatmani yoqish</span>
          </div>
          {/* Toggle switch */}
          <button
            onClick={() => {
              const newVal = !reminderEnabled
              setReminderEnabled(newVal)
              if (newVal && Notification.permission === 'default') {
                Notification.requestPermission()
              }
            }}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: 'none',
              background: reminderEnabled ? 'var(--accent)' : 'var(--border2)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'white',
                position: 'absolute',
                top: 3,
                left: reminderEnabled ? 23 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </div>

        {reminderEnabled && (
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 6, display: 'block' }}>
              Eslatma vaqti
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={e => saveReminderTime(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                background: 'var(--surface)',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 6 }}>
              Har kuni {reminderTime} da ertangi kun uchun eslatma keladi
            </p>
          </div>
        )}
      </section>

      {/* Kategoriyalar */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ ...sectionTitleStyle, marginBottom: 0 }}>Kategoriyalar</h2>
          <button
            onClick={() => setShowCategoryModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 12px',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Qo&apos;shish
          </button>
        </div>

        {deleteError && (
          <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: 8 }}>
            {deleteError}
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {categories.map(cat => (
            <div
              key={cat.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'var(--surface2)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: cat.color + '20',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: cat.color,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                  }}
                >
                  {cat.emoji?.[0]?.toUpperCase() ?? '●'}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                  {cat.name}
                </span>
                {cat.is_default && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '1px 6px',
                      borderRadius: 20,
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                    }}
                  >
                    Default
                  </span>
                )}
              </div>

              {!cat.is_default && (
                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  disabled={deleteCategory.isPending}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text3)',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => {
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--danger-light)'
                  }}
                  onMouseOut={e => {
                    ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'
                    ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Chiqish */}
      <section style={sectionStyle}>
        <button
          onClick={signOut}
          style={{
            width: '100%',
            padding: '13px',
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius)',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <LogOut size={18} />
          Chiqish
        </button>
      </section>

      {showCategoryModal && (
        <CategoryModal onClose={() => setShowCategoryModal(false)} />
      )}
    </div>
  )
}

const sectionStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: '16px',
  marginBottom: 12,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  fontWeight: 600,
  color: 'var(--text2)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 12,
}
