'use client'
// components/TaskCard.tsx — bitta vazifa kartasi

import { useState } from 'react'
import { PenLine, Trash2, Clock } from 'lucide-react'
import { useToggleTask, useDeleteTask } from '@/lib/hooks/useTasks'
import { PRIORITY_COLORS, formatTime } from '@/lib/utils'
import type { Task, Category } from '@/lib/types'

interface TaskCardProps {
  task: Task
  category?: Category | null
  onEdit: (task: Task) => void
  animClass?: string
}

export function TaskCard({ task, category, onEdit, animClass = 'animate-fade-up' }: TaskCardProps) {
  const toggleTask = useToggleTask()
  const deleteTask = useDeleteTask()
  const [showActions, setShowActions] = useState(false)
  // Mobil qurilmalarda (touch) tugmalar har doim ko'rinib turishi
  const [isTouchDevice] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  )

  const isDone = task.status === 'completed'
  const isSkipped = task.status === 'skipped'
  const priorityColor = PRIORITY_COLORS[task.priority]

  async function handleToggle() {
    await toggleTask.mutateAsync({ task })
  }

  async function handleDelete() {
    if (confirm("Bu vazifani o'chirishni tasdiqlaysizmi?")) {
      await deleteTask.mutateAsync({ id: task.id, date: task.date })
    }
  }

  return (
    <div
      className={animClass}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '13px 14px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${isDone || isSkipped ? 'var(--border2)' : priorityColor}`,
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        opacity: isDone || isSkipped ? 0.55 : 1,
        position: 'relative',
      }}
      onMouseOver={e => {
        if (isTouchDevice) return
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseOut={e => {
        if (isTouchDevice) return
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={toggleTask.isPending}
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: `2px solid ${isDone ? '#16A34A' : 'var(--border2)'}`,
          background: isDone ? '#16A34A' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          marginTop: 1,
          transition: 'all 0.2s',
        }}
        aria-label={isDone ? "Bajarilmagan deb belgilash" : "Bajarilgan deb belgilash"}
      >
        {isDone && (
          <svg width="11" height="11" viewBox="0 0 12 12" className="animate-scale-in">
            <path
              d="M2 6l3 3 5-5"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        )}
      </button>

      {/* Kontent */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: '0.95rem',
            fontWeight: 500,
            color: 'var(--text)',
            textDecoration: isDone || isSkipped ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.4,
          }}
        >
          {task.title}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontSize: '0.76rem',
              color: 'var(--text3)',
              fontFamily: 'Geist Mono, monospace',
            }}
          >
            <Clock size={11} strokeWidth={1.5} />
            {formatTime(task.start_time)} – {formatTime(task.end_time)}
          </span>

          {category && (
            <span
              style={{
                fontSize: '0.71rem',
                padding: '1px 7px',
                borderRadius: 20,
                background: category.color + '18',
                color: category.color,
                fontWeight: 600,
                letterSpacing: '0.01em',
              }}
            >
              {category.name}
            </span>
          )}

          {/* Priority dot (faqat muhim darajalar uchun) */}
          {task.priority >= 4 && !isDone && (
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: priorityColor,
                flexShrink: 0,
                display: 'inline-block',
              }}
              title={task.priority === 5 ? 'Juda muhim' : 'Muhim'}
            />
          )}
        </div>
      </div>

      {/* Amallar tugmalari */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          opacity: showActions || isTouchDevice ? 1 : 0,
          transition: 'opacity 0.15s',
          flexShrink: 0,
          alignSelf: 'center',
        }}
      >
        <button
          onClick={e => { e.stopPropagation(); onEdit(task) }}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: 'none',
            background: 'var(--surface2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text3)',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseOver={e => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-light)'
          }}
          onMouseOut={e => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
          }}
          aria-label="Tahrirlash"
        >
          <PenLine size={13} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); handleDelete() }}
          disabled={deleteTask.isPending}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: 'none',
            background: 'var(--surface2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text3)',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseOver={e => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--danger-light)'
          }}
          onMouseOut={e => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)'
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--surface2)'
          }}
          aria-label="O'chirish"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
