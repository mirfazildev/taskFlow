'use client'
// components/TaskCard.tsx — bitta vazifa kartasi

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
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

  const isDone = task.status === 'completed'
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
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${priorityColor}`,
        borderRadius: 'var(--radius)',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        opacity: isDone ? 0.6 : 1,
        position: 'relative',
      }}
      onMouseOver={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        disabled={toggleTask.isPending}
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: `2px solid ${isDone ? '#16A34A' : 'var(--border2)'}`,
          background: isDone ? '#16A34A' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all 0.2s',
        }}
      >
        {isDone && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            className="animate-scale-in"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="white"
              strokeWidth="2"
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
            textDecoration: isDone ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {task.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          <span
            style={{
              fontSize: '0.78rem',
              color: 'var(--text3)',
              fontFamily: 'Geist Mono, monospace',
            }}
          >
            {formatTime(task.start_time)} – {formatTime(task.end_time)}
          </span>
          {category && (
            <span
              style={{
                fontSize: '0.72rem',
                padding: '1px 7px',
                borderRadius: 20,
                background: category.color + '18',
                color: category.color,
                fontWeight: 500,
              }}
            >
              {category.name}
            </span>
          )}
        </div>
      </div>

      {/* Amallar tugmalari */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          opacity: showActions ? 1 : 0,
          transition: 'opacity 0.15s',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => onEdit(task)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
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
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleteTask.isPending}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
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
            ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
