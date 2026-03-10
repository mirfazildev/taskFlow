'use client'
// components/TaskModal.tsx — vazifa qo'shish/tahrirlash modal (bottom sheet)

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Plus, RefreshCw, Clock, Trash2 } from 'lucide-react'
import { useAddTask, useUpdateTask } from '@/lib/hooks/useTasks'
import { useCategories } from '@/lib/hooks/useCategories'
import { CategoryModal } from './CategoryModal'
import { PRIORITY_COLORS, PRIORITY_LABELS, todayStr } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useAddRecurringTask } from '@/lib/hooks/useRecurring'
import type { Task, Priority, RecurrenceType, TimeSlot } from '@/lib/types'

const taskSchema = z.object({
  title: z.string().min(1, 'Sarlavha kiritilishi shart').max(100),
  description: z.string().max(500).optional(),
  date: z.string().min(1, 'Sana tanlanishi shart'),
  category_id: z.string().optional(),
  start_time: z.string().min(1, 'Boshlanish vaqti kiritilishi shart'),
  end_time: z.string().min(1, 'Tugash vaqti kiritilishi shart'),
  priority: z.number().min(1).max(5),
})

type TaskFormData = z.infer<typeof taskSchema>

interface TaskModalProps {
  task?: Task | null
  defaultDate?: string
  onClose: () => void
}

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string; desc: string }[] = [
  { value: 'none',            label: 'Bir marta',    desc: 'Takrorlanmaydi' },
  { value: 'daily',           label: 'Har kuni',     desc: 'Har kuni' },
  { value: 'every_other_day', label: 'Kun ora',      desc: 'Har ikkinchi kuni' },
  { value: 'weekdays',        label: 'Du–Ju',        desc: 'Ish kunlari' },
  { value: 'weekly',          label: 'Haftalik',     desc: 'Tanlangan kunlar' },
]

const WEEK_DAYS = [
  { label: 'Ya', value: 0 },
  { label: 'Du', value: 1 },
  { label: 'Se', value: 2 },
  { label: 'Ch', value: 3 },
  { label: 'Pa', value: 4 },
  { label: 'Ju', value: 5 },
  { label: 'Sh', value: 6 },
]

export function TaskModal({ task, defaultDate, onClose }: TaskModalProps) {
  const addTask = useAddTask()
  const updateTask = useUpdateTask()
  const addRecurring = useAddRecurringTask()
  const { categories } = useCategories()
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState<Priority>(task?.priority ?? 3)
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(task?.recurrence_type ?? 'none')
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>(task?.recurrence_days ?? [1, 2, 3, 4, 5])
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(task?.recurrence_end_date ?? '')
  const [showRecurrence, setShowRecurrence] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Bir kunda bir necha vaqt
  const [useMultipleSlots, setUseMultipleSlots] = useState(false)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { start_time: '09:00', end_time: '09:30', label: '' },
  ])

  const { register, handleSubmit, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      date: task?.date ?? defaultDate ?? todayStr(),
      category_id: task?.category_id ?? (categories[0]?.id ?? ''),
      start_time: task?.start_time?.slice(0, 5) ?? '09:00',
      end_time: task?.end_time?.slice(0, 5) ?? '10:00',
      priority: task?.priority ?? 3,
    },
  })

  function toggleDay(day: number) {
    setRecurrenceDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  function addSlot() {
    setTimeSlots(prev => [...prev, { start_time: '09:00', end_time: '09:30', label: '' }])
  }

  function removeSlot(idx: number) {
    setTimeSlots(prev => prev.filter((_, i) => i !== idx))
  }

  function updateSlot(idx: number, field: keyof TimeSlot, value: string) {
    setTimeSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))
  }

  async function onSubmit(data: TaskFormData) {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const baseTask = {
        user_id: user.id,
        title: data.title,
        description: data.description ?? '',
        date: data.date,
        category_id: data.category_id || null,
        start_time: useMultipleSlots ? (timeSlots[0]?.start_time ?? data.start_time) : data.start_time,
        end_time: useMultipleSlots ? (timeSlots[0]?.end_time ?? data.end_time) : data.end_time,
        priority: selectedPriority,
        status: task?.status ?? 'pending' as const,
        sort_order: task?.sort_order ?? 0,
      }

      if (task) {
        await updateTask.mutateAsync({ id: task.id, updates: baseTask, date: task.date })
      } else if (recurrenceType !== 'none' && showRecurrence) {
        const slots = useMultipleSlots && timeSlots.length > 1
          ? timeSlots.map(s => ({ start_time: s.start_time, end_time: s.end_time, label: s.label || undefined }))
          : null

        await addRecurring({
          ...baseTask,
          is_template: true,
          recurrence_type: recurrenceType,
          recurrence_days: recurrenceType === 'weekly' ? recurrenceDays : undefined,
          recurrence_end_date: recurrenceEndDate || undefined,
          template_id: null,
          time_slots: slots,
        })
      } else {
        await addTask.mutateAsync({
          ...baseTask,
          is_template: false,
          recurrence_type: 'none',
          template_id: null,
        })
      }
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div
        className="animate-fade-in"
        style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="animate-slide-up"
          style={{
            width: '100%', maxWidth: 480,
            background: 'var(--surface)', borderRadius: '20px 20px 0 0',
            padding: '20px 20px 40px', maxHeight: '92svh', overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '1.25rem' }}>
              {task ? 'Vazifani tahrirlash' : 'Yangi vazifa'}
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)' }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Sarlavha */}
            <div>
              <label style={labelStyle}>Sarlavha *</label>
              <input {...register('title')} placeholder="Vazifa nomi..." style={inputStyle(!!errors.title)} />
              {errors.title && <p style={errorStyle}>{errors.title.message}</p>}
            </div>

            {/* Tavsif */}
            <div>
              <label style={labelStyle}>Tavsif</label>
              <textarea {...register('description')} placeholder="Qo'shimcha ma'lumot..."
                rows={2} style={{ ...inputStyle(false), resize: 'none' }} />
            </div>

            {/* Sana */}
            <div>
              <label style={labelStyle}>Sana *</label>
              <input {...register('date')} type="date" style={inputStyle(!!errors.date)} />
            </div>

            {/* Vaqt — yagona yoki bir nechta slot */}
            {!useMultipleSlots ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Boshlanish *</label>
                  <input {...register('start_time')} type="time" style={inputStyle(!!errors.start_time)} />
                </div>
                <div>
                  <label style={labelStyle}>Tugash *</label>
                  <input {...register('end_time')} type="time" style={inputStyle(!!errors.end_time)} />
                </div>
              </div>
            ) : (
              <div>
                <label style={labelStyle}>Vaqtlar</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {timeSlots.map((slot, idx) => (
                    <div key={idx} style={{
                      padding: '10px', background: 'var(--surface2)',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6, alignItems: 'flex-end' }}>
                        <div>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 3 }}>Nom</p>
                          <input
                            value={slot.label ?? ''}
                            onChange={e => updateSlot(idx, 'label', e.target.value)}
                            placeholder={`${idx + 1}-vaqt`}
                            style={{ ...inputStyle(false), padding: '6px 8px', fontSize: '0.82rem' }}
                          />
                        </div>
                        <div>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 3 }}>Boshlanish</p>
                          <input
                            type="time" value={slot.start_time}
                            onChange={e => updateSlot(idx, 'start_time', e.target.value)}
                            style={{ ...inputStyle(false), padding: '6px 8px', fontSize: '0.82rem' }}
                          />
                        </div>
                        <div>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 3 }}>Tugash</p>
                          <input
                            type="time" value={slot.end_time}
                            onChange={e => updateSlot(idx, 'end_time', e.target.value)}
                            style={{ ...inputStyle(false), padding: '6px 8px', fontSize: '0.82rem' }}
                          />
                        </div>
                        <button type="button" onClick={() => removeSlot(idx)}
                          disabled={timeSlots.length === 1}
                          style={{
                            background: 'none', border: 'none', cursor: timeSlots.length === 1 ? 'not-allowed' : 'pointer',
                            color: timeSlots.length === 1 ? 'var(--border)' : 'var(--danger)', padding: '6px',
                          }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addSlot}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '8px', borderRadius: 'var(--radius-sm)',
                      border: '1.5px dashed var(--border)', background: 'transparent',
                      color: 'var(--accent)', fontSize: '0.85rem', cursor: 'pointer',
                    }}>
                    <Plus size={15} /> Vaqt qo&apos;shish
                  </button>
                </div>
              </div>
            )}

            {/* Toggle: bir nechta vaqt */}
            <button type="button"
              onClick={() => setUseMultipleSlots(prev => !prev)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                border: useMultipleSlots ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                background: useMultipleSlots ? 'var(--accent-light)' : 'transparent',
                color: useMultipleSlots ? 'var(--accent)' : 'var(--text3)',
                fontSize: '0.82rem', cursor: 'pointer', width: 'fit-content',
              }}>
              <Clock size={14} />
              {useMultipleSlots ? "Bir vaqtga o'tish" : 'Bir kunda bir necha vaqt (namoz kabi)'}
            </button>

            {/* Muhimlik */}
            <div>
              <label style={labelStyle}>Muhimlik darajasi</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([1, 2, 3, 4, 5] as Priority[]).map(p => (
                  <button key={p} type="button" onClick={() => setSelectedPriority(p)}
                    title={PRIORITY_LABELS[p]}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 'var(--radius-sm)',
                      border: selectedPriority === p ? `2px solid ${PRIORITY_COLORS[p]}` : '2px solid var(--border)',
                      background: selectedPriority === p ? PRIORITY_COLORS[p] + '18' : 'transparent',
                      color: selectedPriority === p ? PRIORITY_COLORS[p] : 'var(--text3)',
                      cursor: 'pointer', fontSize: '1rem', fontWeight: 700, transition: 'all 0.15s',
                    }}
                  >{p}</button>
                ))}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 4 }}>
                {PRIORITY_LABELS[selectedPriority]}
              </p>
            </div>

            {/* Kategoriya */}
            <div>
              <label style={labelStyle}>Kategoriya</label>
              <select {...register('category_id')} style={inputStyle(false)}>
                <option value="">Kategoriyasiz</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowCategoryModal(true)}
                style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: '0.82rem', color: 'var(--accent)', background: 'none', border: 'none',
                  cursor: 'pointer', padding: 0 }}>
                <Plus size={14} /> Yangi kategoriya qo&apos;shish
              </button>
            </div>

            {/* Takrorlanish (faqat yangi vazifa uchun) */}
            {!task && (
              <div>
                <button type="button"
                  onClick={() => setShowRecurrence(prev => !prev)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '10px 14px',
                    background: showRecurrence ? 'var(--accent-light)' : 'var(--surface2)',
                    border: showRecurrence ? '1.5px solid var(--accent)' : '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    color: showRecurrence ? 'var(--accent)' : 'var(--text2)',
                    fontSize: '0.9rem', fontWeight: 500, transition: 'all 0.15s',
                  }}
                >
                  <RefreshCw size={16} />
                  Takrorlanuvchi vazifa
                  {showRecurrence && recurrenceType !== 'none' && (
                    <span style={{
                      marginLeft: 'auto', fontSize: '0.75rem',
                      background: 'var(--accent)', color: 'white',
                      padding: '2px 8px', borderRadius: 20,
                    }}>
                      {RECURRENCE_OPTIONS.find(r => r.value === recurrenceType)?.label}
                    </span>
                  )}
                </button>

                {showRecurrence && (
                  <div className="animate-fade-in"
                    style={{
                      marginTop: 10, padding: '14px',
                      background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      display: 'flex', flexDirection: 'column', gap: 12,
                    }}
                  >
                    {/* Takrorlanish turi */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                      {RECURRENCE_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setRecurrenceType(opt.value)}
                          style={{
                            padding: '8px 4px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                            border: recurrenceType === opt.value ? '2px solid var(--accent)' : '2px solid var(--border)',
                            background: recurrenceType === opt.value ? 'var(--accent-light)' : 'var(--surface)',
                            color: recurrenceType === opt.value ? 'var(--accent)' : 'var(--text2)',
                            fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s', textAlign: 'center',
                          }}
                        >
                          {opt.label}
                          <br />
                          <span style={{ fontSize: '0.65rem', fontWeight: 400, opacity: 0.8 }}>{opt.desc}</span>
                        </button>
                      ))}
                    </div>

                    {/* Haftalik: kun tanlash */}
                    {recurrenceType === 'weekly' && (
                      <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: 6 }}>Kunlarni tanlang:</p>
                        <div style={{ display: 'flex', gap: 5 }}>
                          {WEEK_DAYS.map(d => (
                            <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                              style={{
                                flex: 1, padding: '7px 0', borderRadius: 8, cursor: 'pointer',
                                border: recurrenceDays.includes(d.value) ? '2px solid var(--accent)' : '2px solid var(--border)',
                                background: recurrenceDays.includes(d.value) ? 'var(--accent)' : 'transparent',
                                color: recurrenceDays.includes(d.value) ? 'white' : 'var(--text2)',
                                fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.15s',
                              }}
                            >{d.label}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tugash sanasi */}
                    {recurrenceType !== 'none' && (
                      <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: 4, display: 'block' }}>
                          Tugash sanasi (ixtiyoriy)
                        </label>
                        <input type="date" value={recurrenceEndDate}
                          onChange={e => setRecurrenceEndDate(e.target.value)}
                          style={{ ...inputStyle(false), fontSize: '0.88rem' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Saqlash */}
            <button type="submit" disabled={isSubmitting}
              style={{
                width: '100%', padding: '13px', background: 'var(--accent)', color: 'white',
                border: 'none', borderRadius: 'var(--radius)', fontSize: '1rem', fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, marginTop: 4,
              }}
            >
              {isSubmitting ? 'Saqlanmoqda...' : task ? 'Yangilash' : "Qo'shish"}
            </button>
          </form>
        </div>
      </div>

      {showCategoryModal && <CategoryModal onClose={() => setShowCategoryModal(false)} />}
    </>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 6, fontWeight: 500,
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '10px 12px',
    border: hasError ? '1.5px solid var(--danger)' : '1.5px solid var(--border)',
    borderRadius: 'var(--radius-sm)', fontSize: '0.95rem',
    background: 'var(--surface)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
  }
}

const errorStyle: React.CSSProperties = { color: 'var(--danger)', fontSize: '0.78rem', marginTop: 4 }
