'use client'
// components/CategoryModal.tsx — yangi kategoriya yaratish modal

import { useState } from 'react'
import { X, BookOpen, Briefcase, Heart, Star, Zap, Target, Music, Coffee, Home, Globe, Dumbbell, Camera, Code, ShoppingCart, Plane, User } from 'lucide-react'
import { useAddCategory } from '@/lib/hooks/useCategories'
import { CATEGORY_COLORS } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface CategoryModalProps {
  onClose: () => void
}

const EMOJI_ICONS: { name: string; icon: React.ReactNode }[] = [
  { name: 'user', icon: <User size={18} /> },
  { name: 'briefcase', icon: <Briefcase size={18} /> },
  { name: 'book', icon: <BookOpen size={18} /> },
  { name: 'heart', icon: <Heart size={18} /> },
  { name: 'star', icon: <Star size={18} /> },
  { name: 'zap', icon: <Zap size={18} /> },
  { name: 'target', icon: <Target size={18} /> },
  { name: 'music', icon: <Music size={18} /> },
  { name: 'coffee', icon: <Coffee size={18} /> },
  { name: 'home', icon: <Home size={18} /> },
  { name: 'globe', icon: <Globe size={18} /> },
  { name: 'dumbbell', icon: <Dumbbell size={18} /> },
  { name: 'camera', icon: <Camera size={18} /> },
  { name: 'code', icon: <Code size={18} /> },
  { name: 'shopping-cart', icon: <ShoppingCart size={18} /> },
  { name: 'plane', icon: <Plane size={18} /> },
]

export function CategoryModal({ onClose }: CategoryModalProps) {
  const addCategory = useAddCategory()
  const [name, setName] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('user')
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0])
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Kategoriya nomi kiritilishi shart')
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      await addCategory.mutateAsync({
        user_id: user.id,
        name: name.trim(),
        emoji: selectedEmoji,
        color: selectedColor,
        is_default: false,
      })
      onClose()
    } catch (err) {
      setError("Saqlashda xatolik yuz berdi")
    }
  }

  const previewIcon = EMOJI_ICONS.find(e => e.name === selectedEmoji)?.icon

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="animate-slide-up"
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--surface)',
          borderRadius: '20px 20px 0 0',
          padding: '20px 20px 40px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '1.25rem' }}>
            Yangi kategoriya
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Ko'rinish namunasi */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              background: 'var(--surface2)',
              borderRadius: 'var(--radius)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 20,
                background: selectedColor + '20',
                color: selectedColor,
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              {previewIcon}
              {name || 'Kategoriya nomi'}
            </span>
          </div>

          {/* Nom */}
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 6, display: 'block' }}>
              Nom *
            </label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              placeholder="Masalan: Ish, Sport, O'qish..."
              maxLength={30}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: error ? '1.5px solid var(--danger)' : '1.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                background: 'var(--surface)',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
            {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: 4 }}>{error}</p>}
          </div>

          {/* Emoji tanlash */}
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 8, display: 'block' }}>
              Ikonka
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
              {EMOJI_ICONS.map(({ name: iconName, icon }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setSelectedEmoji(iconName)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-sm)',
                    border: selectedEmoji === iconName ? `2px solid ${selectedColor}` : '2px solid transparent',
                    background: selectedEmoji === iconName ? selectedColor + '18' : 'var(--surface2)',
                    cursor: 'pointer',
                    color: selectedEmoji === iconName ? selectedColor : 'var(--text2)',
                    transition: 'all 0.15s',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Rang tanlash */}
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 8, display: 'block' }}>
              Rang
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORY_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: color,
                    border: selectedColor === color ? '3px solid var(--text)' : '3px solid transparent',
                    cursor: 'pointer',
                    outline: selectedColor === color ? `2px solid ${color}` : 'none',
                    outlineOffset: 2,
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Saqlash */}
          <button
            type="submit"
            disabled={addCategory.isPending}
            style={{
              width: '100%',
              padding: '13px',
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: addCategory.isPending ? 'not-allowed' : 'pointer',
              opacity: addCategory.isPending ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {addCategory.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </form>
      </div>
    </div>
  )
}
