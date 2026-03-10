'use client'
// components/AIView.tsx — Gemini AI haftalik tahlil ko'rinishi

import { useState, useEffect } from 'react'
import { Sparkles, ChevronRight, CheckCircle } from 'lucide-react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { useWeeklyStats } from '@/lib/hooks/useStats'
import { useTasks } from '@/lib/hooks/useTasks'
import { createClient } from '@/lib/supabase/client'
import { todayStr, getWeekDays } from '@/lib/utils'
import type { AIQuestion, AISession } from '@/lib/types'

type Phase = 'intro' | 'questions' | 'answers' | 'advice' | 'done'

export function AIView() {
  const today = todayStr()
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const { data: weekStats } = useWeeklyStats(today)
  const { tasks } = useTasks(today)

  const [phase, setPhase] = useState<Phase>('intro')
  const [questions, setQuestions] = useState<AIQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [advice, setAdvice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [pastSessions, setPastSessions] = useState<AISession[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    loadPastSessions()
  }, [])

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

  // Haftalik statistika yig'ish
  const totalTasks = weekStats.reduce((s, d) => s + d.total_tasks, 0)
  const completedTasks = weekStats.reduce((s, d) => s + d.completed_tasks, 0)
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const missedTasks = tasks
    .filter(t => t.status === 'pending' || t.status === 'skipped')
    .map(t => t.title)

  async function startAnalysis() {
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // AI sessiya yaratish
      const { data: session } = await supabase
        .from('ai_sessions')
        .insert({
          user_id: user.id,
          week_start: weekStart,
          week_end: weekEnd,
          status: 'in_progress',
        })
        .select()
        .single()

      if (session) setSessionId(session.id)

      // Savollar olish
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'questions',
          missedTasks,
          weekStats: { completionRate, totalTasks, completedTasks },
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

  function handleAnswer(qId: string, answer: string) {
    setAnswers(prev => ({ ...prev, [qId]: answer }))
  }

  function nextQuestion() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1)
    } else {
      setPhase('answers')
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
          questions,
          answers,
          weekStats: { completionRate, totalTasks, completedTasks },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setAdvice(data.advice)
      setPhase('advice')

      // Sessiyani yangilash
      if (sessionId) {
        const supabase = createClient()
        await supabase
          .from('ai_sessions')
          .update({
            questions,
            answers,
            advice: data.advice,
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', sessionId)
      }

      loadPastSessions()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xatolik yuz berdi")
    } finally {
      setIsLoading(false)
    }
  }

  // Markdown-ni oddiy HTML ga aylantirish
  function renderMarkdown(text: string): React.ReactNode {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return (
          <h3
            key={i}
            style={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: '1.1rem',
              marginTop: 16,
              marginBottom: 6,
              color: 'var(--text)',
            }}
          >
            {line.slice(3)}
          </h3>
        )
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span>
            <p style={{ fontSize: '0.9rem', color: 'var(--text2)', lineHeight: 1.6 }}>
              {line.slice(2)}
            </p>
          </div>
        )
      }
      if (line.trim() === '') return <div key={i} style={{ height: 6 }} />
      return (
        <p key={i} style={{ fontSize: '0.9rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: 4 }}>
          {line}
        </p>
      )
    })
  }

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <Sparkles size={22} color="var(--accent)" />
        <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: '1.6rem' }}>
          AI Tahlil
        </h1>
      </div>

      {error && (
        <div
          style={{
            background: 'var(--danger-light)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius)',
            padding: '12px 14px',
            color: 'var(--danger)',
            fontSize: '0.88rem',
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* INTRO */}
      {phase === 'intro' && (
        <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Haftalik xulosa */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px',
            }}
          >
            <p style={{ fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>
              Bu haftaning xulosasi
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={statCardStyle}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {completedTasks}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Bajarildi</span>
              </div>
              <div style={statCardStyle}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: getRateColorLocal(completionRate) }}>
                  {completionRate.toFixed(0)}%
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Bajarilish</span>
              </div>
            </div>

            {missedTasks.length > 0 && (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 8 }}>
                  Bajarilmagan vazifalar:
                </p>
                {missedTasks.slice(0, 5).map((t, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text)',
                      padding: '6px 10px',
                      background: 'var(--surface2)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 4,
                    }}
                  >
                    {t}
                  </div>
                ))}
                {missedTasks.length > 5 && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                    + yana {missedTasks.length - 5} ta
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={startAnalysis}
            disabled={isLoading}
            style={primaryBtnStyle(isLoading)}
          >
            <Sparkles size={18} />
            {isLoading ? 'Savollar tayyorlanmoqda...' : "Gemini AI tahlilini boshlash"}
          </button>

          {/* O'tgan tahlillar */}
          {pastSessions.length > 0 && (
            <div>
              <p style={{ fontWeight: 600, marginBottom: 10, color: 'var(--text)', fontSize: '0.9rem' }}>
                O&apos;tgan tahlillar
              </p>
              {pastSessions.map(session => (
                <div
                  key={session.id}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    padding: '14px',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text)', fontWeight: 500 }}>
                      {session.week_start} — {session.week_end}
                    </span>
                    <CheckCircle size={16} color="var(--success)" />
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.5 }}>
                    {session.advice?.slice(0, 120)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SAVOLLAR */}
      {phase === 'questions' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Progress chips */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {questions.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 28,
                  height: 6,
                  borderRadius: 3,
                  background: i <= currentQ ? 'var(--accent)' : 'var(--border)',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>

          {questions[currentQ] && (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '20px',
              }}
            >
              <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 8 }}>
                Savol {currentQ + 1}/{questions.length}
              </p>
              <p style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)', marginBottom: 6, lineHeight: 1.5 }}>
                {questions[currentQ].question}
              </p>
              {questions[currentQ].context && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text3)', marginBottom: 16 }}>
                  {questions[currentQ].context}
                </p>
              )}
              <textarea
                value={answers[questions[currentQ].id] ?? ''}
                onChange={e => handleAnswer(questions[currentQ].id, e.target.value)}
                placeholder="Javobingizni yozing..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1.5px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          <button
            onClick={nextQuestion}
            style={{
              ...primaryBtnStyle(false),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {currentQ < questions.length - 1 ? 'Keyingisi' : "Barcha javoblarni ko'rish"}
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* JAVOBLAR */}
      {phase === 'answers' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontWeight: 600, color: 'var(--text)' }}>Sizning javoblaringiz</p>
          {questions.map(q => (
            <div
              key={q.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '14px',
              }}
            >
              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6, color: 'var(--text)' }}>
                {q.question}
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text2)', lineHeight: 1.6 }}>
                {answers[q.id] || <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Javob berilmadi</span>}
              </p>
            </div>
          ))}

          <button
            onClick={getAdvice}
            disabled={isLoading}
            style={primaryBtnStyle(isLoading)}
          >
            <Sparkles size={18} />
            {isLoading ? 'Tahlil qilinmoqda...' : 'Gemini Tahlilini olish'}
          </button>
        </div>
      )}

      {/* AI MASLAHATI */}
      {phase === 'advice' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              background: 'linear-gradient(135deg, var(--accent-light), #F0F4FF)',
              border: '1px solid #C7D7FF',
              borderRadius: 'var(--radius)',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Sparkles size={18} color="var(--accent)" />
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Gemini AI Maslahat</span>
            </div>
            <div>{renderMarkdown(advice)}</div>
          </div>

          <button
            onClick={() => {
              setPhase('intro')
              setQuestions([])
              setAnswers({})
              setCurrentQ(0)
              setAdvice('')
            }}
            style={{
              width: '100%',
              padding: '13px',
              background: 'var(--surface2)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Boshiga qaytish
          </button>
        </div>
      )}
    </div>
  )
}

function getRateColorLocal(rate: number): string {
  if (rate >= 80) return '#16A34A'
  if (rate >= 60) return '#FBBF24'
  if (rate >= 40) return '#F97316'
  return '#EF4444'
}

const statCardStyle: React.CSSProperties = {
  background: 'var(--surface2)',
  borderRadius: 'var(--radius-sm)',
  padding: '12px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
}

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: '13px',
    background: disabled ? 'var(--surface2)' : 'var(--accent)',
    color: disabled ? 'var(--text2)' : 'white',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.2s',
  }
}
