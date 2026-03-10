'use client'
// components/TodayView.tsx — bugungi vazifalar ko'rinishi

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import { uz } from 'date-fns/locale'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTasks, useReorderTasks } from '@/lib/hooks/useTasks'
import { useCategories } from '@/lib/hooks/useCategories'
import { useDailyStats } from '@/lib/hooks/useStats'
import { useUIStore } from '@/lib/store/uiStore'
import { useEnsureRecurringInstances } from '@/lib/hooks/useRecurring'
import { useAuth } from '@/lib/hooks/useAuth'
import { TaskCard } from './TaskCard'
import { TaskModal } from './TaskModal'
import { ProgressRing } from './ProgressRing'
import { TaskSkeleton } from './Skeleton'
import { todayStr, formatDate, formatDay } from '@/lib/utils'
import type { Task } from '@/lib/types'

function SortableTaskCard({
  task,
  onEdit,
}: {
  task: Task
  onEdit: (task: Task) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const { categories } = useCategories()
  const category = categories.find(c => c.id === task.category_id) ?? null

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <TaskCard task={task} category={category} onEdit={onEdit} />
    </div>
  )
}

export function TodayView() {
  const { selectedDate, setSelectedDate, filterCategoryId, setFilterCategoryId } = useUIStore()
  const { tasks, isLoading } = useTasks(selectedDate)
  const { categories } = useCategories()
  const stats = useDailyStats(selectedDate)
  const reorderTasks = useReorderTasks()
  const { user } = useAuth()
  // Takrorlanuvchi vazifalar instancelarini avtomatik yaratish
  useEnsureRecurringInstances(selectedDate, user?.id)

  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const isToday = selectedDate === todayStr()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // 22:00 eslatmasi
  useEffect(() => {
    if (typeof window === 'undefined' || !isToday) return

    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const checkTime = setInterval(() => {
      const now = new Date()
      if (now.getHours() === 22 && now.getMinutes() === 0 && Notification.permission === 'granted') {
        new Notification('TaskFlow', {
          body: "Ertangi kun uchun vazifalaringizni rejalashtiring! 📋",
          icon: '/icon-192.png',
        })
      }
    }, 60_000)

    return () => clearInterval(checkTime)
  }, [isToday])

  function prevDay() {
    setSelectedDate(format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))
  }

  function nextDay() {
    setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const pendingTasks = tasks.filter(t => t.status !== 'completed')
    const oldIndex = pendingTasks.findIndex(t => t.id === active.id)
    const newIndex = pendingTasks.findIndex(t => t.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(pendingTasks, oldIndex, newIndex)
      const doneTasks = tasks.filter(t => t.status === 'completed')
      reorderTasks.mutate({ tasks: [...reordered, ...doneTasks], date: selectedDate })
    }
  }

  const filteredTasks = filterCategoryId
    ? tasks.filter(t => t.category_id === filterCategoryId)
    : tasks

  const pendingTasks = filteredTasks.filter(t => t.status !== 'completed')
  const doneTasks = filteredTasks.filter(t => t.status === 'completed')

  const completionRate = stats?.completion_rate ?? 0

  return (
    <div style={{ paddingBottom: 90 }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <button
            onClick={prevDay}
            style={navBtnStyle}
            aria-label="Oldingi kun"
          >
            <ChevronLeft size={20} />
          </button>

          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                fontFamily: 'Instrument Serif, serif',
                fontSize: '1.6rem',
                color: 'var(--text)',
                lineHeight: 1.1,
              }}
            >
              {format(new Date(selectedDate), 'd MMMM', { locale: uz })}
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '0.85rem', marginTop: 2 }}>
              {formatDay(selectedDate)}
              {isToday && (
                <span
                  style={{
                    marginLeft: 6,
                    padding: '1px 7px',
                    background: 'var(--accent-light)',
                    color: 'var(--accent)',
                    borderRadius: 20,
                    fontSize: '0.72rem',
                    fontWeight: 600,
                  }}
                >
                  Bugun
                </span>
              )}
            </p>
          </div>

          <button
            onClick={nextDay}
            style={navBtnStyle}
            aria-label="Keyingi kun"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {!isToday && (
          <button
            onClick={() => setSelectedDate(todayStr())}
            style={{
              display: 'block',
              margin: '8px auto 0',
              padding: '4px 14px',
              background: 'var(--accent-light)',
              color: 'var(--accent)',
              border: 'none',
              borderRadius: 20,
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Bugunga qaytish
          </button>
        )}
      </div>

      {/* Progress kartasi */}
      <div
        style={{
          margin: '12px 16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: 'var(--shadow)',
        }}
      >
        <ProgressRing rate={completionRate} />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            {stats ? `${stats.completed_tasks}/${stats.total_tasks} bajarildi` : "Vazifalar yo'q"}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {categories.slice(0, 4).map(cat => {
              const catTasks = tasks.filter(t => t.category_id === cat.id)
              if (catTasks.length === 0) return null
              const done = catTasks.filter(t => t.status === 'completed').length
              return (
                <span
                  key={cat.id}
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: cat.color + '18',
                    color: cat.color,
                    fontWeight: 500,
                  }}
                >
                  {cat.name} {done}/{catTasks.length}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Kategoriya filterlari */}
      {categories.length > 0 && (
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: 8,
            padding: '0 16px',
            overflowX: 'auto',
            marginBottom: 12,
          }}
        >
          <button
            onClick={() => setFilterCategoryId(null)}
            style={filterChipStyle(!filterCategoryId, 'var(--accent)')}
          >
            Barchasi
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategoryId(filterCategoryId === cat.id ? null : cat.id)}
              style={filterChipStyle(filterCategoryId === cat.id, cat.color)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Vazifalar ro'yxati */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <TaskSkeleton key={i} />)
        ) : pendingTasks.length === 0 && doneTasks.length === 0 ? (
          <div
            className="animate-fade-in"
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: 'var(--text2)',
            }}
          >
            <p style={{ fontSize: '2rem', marginBottom: 8 }}>📋</p>
            <p style={{ fontWeight: 500, marginBottom: 4 }}>Hali vazifalar yo&apos;q</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>
              + tugmasini bosib yangi vazifa qo&apos;shing
            </p>
          </div>
        ) : (
          <>
            {/* Bajarilmagan vazifalar (drag & drop) */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={pendingTasks.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {pendingTasks.map((task, i) => (
                  <div key={task.id} className={`stagger-${Math.min(i + 1, 5)}`}>
                    <SortableTaskCard task={task} onEdit={setEditingTask} />
                  </div>
                ))}
              </SortableContext>
            </DndContext>

            {/* Bajarilgan vazifalar */}
            {doneTasks.length > 0 && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    margin: '4px 0',
                    color: 'var(--text3)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  Bajarildi ({doneTasks.length})
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                {doneTasks.map((task, i) => {
                  const category = categories.find(c => c.id === task.category_id) ?? null
                  return (
                    <div key={task.id} className={`stagger-${Math.min(i + 1, 5)}`}>
                      <TaskCard task={task} category={category} onEdit={setEditingTask} />
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}
      </div>

      {/* FAB (+) tugmasi */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{
          position: 'fixed',
          bottom: 90,
          right: 'calc(50% - 240px + 16px)',
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--accent)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(79,127,255,0.4)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          zIndex: 30,
        }}
        onMouseOver={e => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'
        }}
        onMouseOut={e => {
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
        }}
        aria-label="Yangi vazifa qo'shish"
      >
        <Plus size={24} />
      </button>

      {/* Modalar */}
      {showAddModal && (
        <TaskModal
          defaultDate={selectedDate}
          onClose={() => setShowAddModal(false)}
        />
      )}
      {editingTask && (
        <TaskModal
          task={editingTask}
          defaultDate={selectedDate}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  )
}

const navBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: 'var(--text2)',
}

function filterChipStyle(active: boolean, color: string): React.CSSProperties {
  return {
    flexShrink: 0,
    padding: '5px 14px',
    borderRadius: 20,
    border: active ? `1.5px solid ${color}` : '1.5px solid var(--border)',
    background: active ? color + '18' : 'var(--surface)',
    color: active ? color : 'var(--text2)',
    fontSize: '0.82rem',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  }
}
