'use client'
// components/AIView.tsx — Neyro Tarmoq tahlil ko'rinishi (kunlik/haftalik/oylik)

import { useState, useEffect } from 'react'
import { BrainCircuit, ChevronRight, CheckCircle, CalendarDays, Calendar, BarChart3 } from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { useWeeklyStats, useMonthlyStats } from '@/lib/hooks/useStats'
import { useTasks } from '@/lib/hooks/useTasks'
import { createClient } from '@/lib/supabase/client'
import { todayStr } from '@/lib/utils'
import type { AIQuestion, AISession } from '@/lib/types'

type Phase = 'intro' | 'questions' | 'answers' | 'advice'
type AnalysisType = 'daily' | 'weekly' | 'monthly'

const ANALYSIS_TABS: { id: AnalysisType; label: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { id: 'daily',   label: 'Kunlik',   Icon: CalendarDays },
  { id: 'weekly',  label: 'Haftalik', Icon: Calendar },
  { id: 'monthly', label: 'Oylik',    Icon: BarChart3 },
]

export function AIView() {
  const today = todayStr()
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd   = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const { data: weekStats }    = useWeeklyStats(today)
  const { data: monthStats }   = useMonthlyStats()
  const { tasks: todayTasks }  = useTasks(today)

  const [analysisType, setAnalysisType] = useState<AnalysisType>('weekly')
  const [phase, setPhase]       = useState<Phase>('intro')
  const [questions, setQuestions] = useState<AIQuestion[]>([])
  const [answers, setAnswers]   = useState<Record<string, string>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [advice, setAdvice]     = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]       = useState('')
  const [pastSessions, setPastSessions] = useState<AISession[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => { loadPastSessions() }, [])

  // Tanlangan davrga qarab statistika hisoblash
  const stats = (() => {
    if (analysisType === 'daily') {
      const total     = todayTasks.length
      const completed = todayTasks.filter(t => t.status === 'completed').length
      return { total, completed, rate: total > 0 ? (completed / total) * 100 : 0 }
    }
    if (analysisType === 'weekly') {
      const total     = weekStats.reduce((s, d) => s + d.total_tasks, 0)
      const completed = weekStats.reduce((s, d) => s + d.completed_tasks, 0)
      return { total, completed, rate: total > 0 ? (completed / total) * 100 : 0 }
    }
    // monthly
    const total     = monthStats.reduce((s, d) => s + d.total_tasks, 0)
    const completed = monthStats.reduce((s, d) => s + d.completed_tasks, 0)
    return { total, completed, rate: total > 0 ? (completed / total) * 100 : 0 }
  })()

  const missedTasks = (() => {
    if (analysisType === 'daily') {
      return todayTasks
        .filter(t => t.status === 'pending' || t.status === 'skipped')
        .map(t => t.title)
    }
    // weekly/monthly — missed = total - completed (list unavailable, use count)
    return []
  })()

  const periodLabel = analysisType === 'daily' ? 'bugungi kun' : analysisType === 'weekly' ? 'bu hafta' : 'bu oy'

  async function loadPastSessions() {
    const supabase = createClient()
    const { data } = await supabase
      .from('ai_sessions')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(3)
    if (data) setPastSessions(data as AISession[])
  }

  async function startAnalysis() {
    setIsLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: session } = await supabase
        .from('ai_sessions')
        .insert({ user_id: user.id, week_start: weekStart, week_end: weekEnd, status: 'in_progress' })
        .select().single()
      if (session) setSessionId(session.id)

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'questions',
          period: analysisType,
          missedTasks,
          weekStats: { completionRate: stats.rate, totalTasks: stats.total, completedTasks: stats.completed },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuestions(data.questions)
      setPhase('questions')
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    } finally {
      setIsLoading(false)
    }
  }

  async function getAdvice() {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'advice',
          period: analysisType,
          questions,
          answers,
          weekStats: { completionRate: stats.rate, totalTasks: stats.total, completedTasks: stats.completed },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAdvice(data.advice)
      setPhase('advice')

      if (sessionId) {
        const supabase = createClient()
        await supabase.from('ai_sessions').update({
          questions, answers, advice: data.advice,
          status: 'completed', completed_at: new Date().toISOString(),
        }).eq('id', sessionId)
      }
      loadPastSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    } finally {
      setIsLoading(false)
    }
  }

  function handleAnswer(qId: string, answer: string) {
    setAnswers(prev => ({ ...prev, [qId]: answer }))
  }

  function resetToIntro() {
    setPhase('intro')
    setQuestions([])
    setAnswers({})
    setCurrentQ(0)
    setAdvice('')
    setError('')
  }

  function renderMarkdown(text: string): React.ReactNode {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## '))
        return (
          <h3 key={i} style={{
            fontFamily: 'Inter, sans-serif', fontSize: '1.05rem',
            marginTop: 14, marginBottom: 5, color: 'var(--text)', fontWeight: 700,
          }}>
            {line.slice(3)}
          </h3>
        )
      if (line.startsWith('- ') || line.startsWith('* '))
        return (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
            <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }}>▸</span>
            <p style={{ fontSize: '0.9rem', color: 'var(--text2)', lineHeight: 1.65 }}>{line.slice(2)}</p>
          </div>
        )
      if (line.trim() === '') return <div key={i} style={{ height: 6 }} />
      return <p key={i} style={{ fontSize: '0.9rem', color: 'var(--text2)', lineHeight: 1.65, marginBottom: 4 }}>{line}</p>
    })
  }

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <BrainCircuit size={22} color="var(--accent)" />
        <h1 style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.6rem' }}>
          Neyro Tarmoq Tahlil
        </h1>
      </div>

      {/* Period tabs — faqat intro da ko'rsatish */}
      {phase === 'intro' && (
        <div style={{
          display: 'flex', background: 'var(--surface2)',
          borderRadius: 'var(--radius-sm)', padding: 3, marginBottom: 16,
        }}>
          {ANALYSIS_TABS.map(({ id, label, Icon }) => {
            const isActive = analysisType === id
            return (
              <button key={id} onClick={() => setAnalysisType(id)} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 5, padding: '8px 4px', border: 'none', borderRadius: 6,
                background: isActive ? 'var(--surface)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text2)',
                fontWeight: isActive ? 600 : 400, fontSize: '0.85rem',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: isActive ? 'var(--shadow)' : 'none',
              }}>
                <Icon size={14} color={isActive ? 'var(--accent)' : 'var(--text3)'} />
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* Xato xabari */}
      {error && (
        <div style={{
          background: 'var(--danger-light)', border: '1px solid var(--danger)',
          borderRadius: 'var(--radius)', padding: '12px 14px',
          color: 'var(--danger)', fontSize: '0.88rem', marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* ===== INTRO ===== */}
      {phase === 'intro' && (
        <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Statistika kartasi */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '18px',
          }}>
            <p style={{ fontWeight: 600, marginBottom: 12, color: 'var(--text)', fontSize: '0.95rem' }}>
              {analysisType === 'daily' ? '📅 Bugungi natija' : analysisType === 'weekly' ? '📆 Haftalik natija' : '🗓️ Oylik natija'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: missedTasks.length > 0 ? 14 : 0 }}>
              {[
                { label: 'Jami', value: stats.total, color: 'var(--text)' },
                { label: 'Bajarildi', value: stats.completed, color: 'var(--success)' },
                { label: 'Foiz', value: `${stats.rate.toFixed(0)}%`, color: getRateColorLocal(stats.rate) },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
                  padding: '10px 8px', textAlign: 'center',
                }}>
                  <p style={{ fontSize: '1.35rem', fontWeight: 700, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {missedTasks.length > 0 && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text2)', marginBottom: 6 }}>
                  Bajarilmagan:
                </p>
                {missedTasks.slice(0, 4).map((t, i) => (
                  <div key={i} style={{
                    fontSize: '0.84rem', color: 'var(--text)',
                    padding: '5px 10px', background: 'var(--surface2)',
                    borderRadius: 'var(--radius-xs)', marginBottom: 3,
                    borderLeft: '2px solid var(--danger)',
                  }}>
                    {t}
                  </div>
                ))}
                {missedTasks.length > 4 && (
                  <p style={{ fontSize: '0.76rem', color: 'var(--text3)', marginTop: 3 }}>
                    + yana {missedTasks.length - 4} ta
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Boshlash tugmasi */}
          <button onClick={startAnalysis} disabled={isLoading} style={primaryBtnStyle(isLoading)}>
            <BrainCircuit size={18} />
            {isLoading ? 'Savollar tayyorlanmoqda...' : `${analysisType === 'daily' ? 'Kunlik' : analysisType === 'weekly' ? 'Haftalik' : 'Oylik'} tahlilni boshlash`}
          </button>

          {/* O'tgan tahlillar */}
          {pastSessions.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <p style={{ fontWeight: 600, marginBottom: 10, color: 'var(--text2)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                O&apos;tgan tahlillar
              </p>
              {pastSessions.map(session => (
                <div key={session.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '12px 14px', marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text2)', fontWeight: 500 }}>
                      {session.week_start} — {session.week_end}
                    </span>
                    <CheckCircle size={15} color="var(--success)" />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text3)', lineHeight: 1.5 }}>
                    {session.advice?.slice(0, 110)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== SAVOLLAR ===== */}
      {phase === 'questions' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {questions.map((_, i) => (
              <div key={i} style={{
                width: 28, height: 5, borderRadius: 3,
                background: i <= currentQ ? 'var(--accent)' : 'var(--border)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          {questions[currentQ] && (
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '20px',
            }}>
              <p style={{ fontSize: '0.76rem', color: 'var(--text3)', marginBottom: 8 }}>
                Savol {currentQ + 1}/{questions.length} · {periodLabel}
              </p>
              <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6, lineHeight: 1.5 }}>
                {questions[currentQ].question}
              </p>
              {questions[currentQ].context && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text3)', marginBottom: 14 }}>
                  {questions[currentQ].context}
                </p>
              )}
              <textarea
                value={answers[questions[currentQ].id] ?? ''}
                onChange={e => handleAnswer(questions[currentQ].id, e.target.value)}
                placeholder="Javobingizni yozing..."
                rows={4}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem', background: 'var(--surface2)',
                  color: 'var(--text)', outline: 'none', resize: 'none', fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          <button
            onClick={() => {
              if (currentQ < questions.length - 1) setCurrentQ(p => p + 1)
              else setPhase('answers')
            }}
            style={{ ...primaryBtnStyle(false), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {currentQ < questions.length - 1 ? 'Keyingisi' : "Javoblarni ko'rish"}
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ===== JAVOBLAR ===== */}
      {phase === 'answers' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>Sizning javoblaringiz</p>
          {questions.map(q => (
            <div key={q.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '14px',
            }}>
              <p style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: 5, color: 'var(--text)' }}>
                {q.question}
              </p>
              <p style={{ fontSize: '0.86rem', color: 'var(--text2)', lineHeight: 1.6 }}>
                {answers[q.id] || <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Javob berilmadi</span>}
              </p>
            </div>
          ))}
          <button onClick={getAdvice} disabled={isLoading} style={primaryBtnStyle(isLoading)}>
            <BrainCircuit size={18} />
            {isLoading ? 'Tahlil qilinmoqda...' : 'Neyro Tarmoq Tahlilini olish'}
          </button>
        </div>
      )}

      {/* ===== MASLAHAT ===== */}
      {phase === 'advice' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Maslahat kartasi — to'liq CSS variable ranglar */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '3px solid var(--accent)',
            borderRadius: 'var(--radius)',
            padding: '16px 18px',
            boxShadow: 'var(--shadow)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
              paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: 'var(--accent-light)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <BrainCircuit size={16} color="var(--accent)" />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>
                  Neyro Tarmoq Maslahat
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                  {periodLabel} tahlili
                </p>
              </div>
            </div>
            <div>{renderMarkdown(advice)}</div>
          </div>

          <button onClick={resetToIntro} style={{
            width: '100%', padding: '12px',
            background: 'var(--surface2)', color: 'var(--text)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius)',
            fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer',
          }}>
            Boshiga qaytish
          </button>
        </div>
      )}
    </div>
  )
}

function getRateColorLocal(rate: number): string {
  if (rate >= 80) return 'var(--success)'
  if (rate >= 60) return 'var(--warning)'
  if (rate >= 40) return '#F97316'
  return 'var(--danger)'
}

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '13px',
    background: disabled ? 'var(--surface2)' : 'var(--accent)',
    color: disabled ? 'var(--text2)' : 'white',
    border: 'none', borderRadius: 'var(--radius)',
    fontSize: '1rem', fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'all 0.2s',
  }
}
