'use client'
// components/StatisticsView.tsx — statistika ko'rinishi (bugun/haftalik/oylik)

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer,
} from 'recharts'
import { useDailyStats, useWeeklyStats, useMonthlyStats, useStreak } from '@/lib/hooks/useStats'
import { useCategories } from '@/lib/hooks/useCategories'
import { useUIStore } from '@/lib/store/uiStore'
import { ProgressRing } from './ProgressRing'
import { Skeleton } from './Skeleton'
import { getRateColor, formatDayShort, todayStr } from '@/lib/utils'

type StatsTab = 'today' | 'weekly' | 'monthly'

export function StatisticsView() {
  const [activeTab, setActiveTab] = useState<StatsTab>('today')
  const { selectedDate } = useUIStore()
  const { categories } = useCategories()
  const streak = useStreak()

  const todayStats = useDailyStats(todayStr())
  const { data: weekData, isLoading: weekLoading } = useWeeklyStats(selectedDate)
  const { data: monthData, isLoading: monthLoading } = useMonthlyStats()

  const tabs: { id: StatsTab; label: string }[] = [
    { id: 'today',   label: 'Bugun' },
    { id: 'weekly',  label: 'Haftalik' },
    { id: 'monthly', label: 'Oylik' },
  ]

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <h1
        style={{
          fontFamily: 'Instrument Serif, serif',
          fontSize: '1.6rem',
          marginBottom: 16,
        }}
      >
        Ko&apos;rsatkichlar
      </h1>

      {/* Streak kartasi */}
      {streak > 0 && (
        <div
          className="animate-fade-up"
          style={{
            background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)',
            border: '1px solid #FDE68A',
            borderRadius: 'var(--radius)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: '2rem' }}>🔥</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#92400E' }}>
              {streak} kunlik streak!
            </p>
            <p style={{ fontSize: '0.82rem', color: '#B45309' }}>
              Ketma-ket {streak} kun 70%+ vazifalarni bajardingiz
            </p>
          </div>
        </div>
      )}

      {/* Tab selector */}
      <div
        style={{
          display: 'flex',
          background: 'var(--surface2)',
          borderRadius: 'var(--radius-sm)',
          padding: 3,
          marginBottom: 20,
        }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: 6,
              background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text)' : 'var(--text2)',
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: activeTab === tab.id ? 'var(--shadow)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* BUGUN TAB */}
      {activeTab === 'today' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Asosiy progress */}
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              boxShadow: 'var(--shadow)',
            }}
          >
            <ProgressRing rate={todayStats?.completion_rate ?? 0} size={96} />
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 4 }}>Bugungi natija</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>
                {todayStats?.completed_tasks ?? 0}
                <span style={{ fontSize: '1rem', color: 'var(--text2)', fontWeight: 400 }}>
                  /{todayStats?.total_tasks ?? 0}
                </span>
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>
                {todayStats?.total_tasks ? 'bajarildi' : "Hali vazifalar yo'q"}
              </p>
            </div>
          </div>

          {/* Kategoriyalar progress */}
          {categories.length > 0 && (
            <div
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '16px',
              }}
            >
              <p style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.9rem' }}>Kategoriyalar</p>
              {categories.map(cat => {
                const catData = todayStats?.by_category?.[cat.id]
                const total = catData?.total ?? 0
                const done = catData?.completed ?? 0
                const rate = total > 0 ? (done / total) * 100 : 0
                if (total === 0) return null
                return (
                  <div key={cat.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{cat.name}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
                        {done}/{total}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: 'var(--surface2)',
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${rate}%`,
                          background: cat.color,
                          borderRadius: 3,
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* HAFTALIK TAB */}
      {activeTab === 'weekly' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {weekLoading ? (
            <Skeleton height={200} />
          ) : (
            <>
              {/* Summary kartalar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  {
                    label: 'Jami',
                    value: weekData.reduce((s, d) => s + d.total_tasks, 0),
                    color: 'var(--accent)',
                  },
                  {
                    label: 'Bajarildi',
                    value: weekData.reduce((s, d) => s + d.completed_tasks, 0),
                    color: 'var(--success)',
                  },
                  {
                    label: "O'rtacha",
                    value: `${Math.round(weekData.reduce((s, d) => s + d.completion_rate, 0) / 7)}%`,
                    color: 'var(--warning)',
                  },
                ].map(card => (
                  <div
                    key={card.label}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '14px 12px',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: '1.4rem', fontWeight: 700, color: card.color }}>{card.value}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: 2 }}>{card.label}</p>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '16px',
                }}
              >
                <p style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.9rem' }}>Haftalik bajarilish</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={weekData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={d => formatDayShort(d)}
                      tick={{ fontSize: 11, fill: 'var(--text3)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: number) => [`${v.toFixed(1)}%`, 'Bajarilish']}
                      labelFormatter={d => formatDayShort(d)}
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                      }}
                    />
                    <Bar dataKey="completion_rate" radius={[4, 4, 0, 0]}>
                      {weekData.map((entry, i) => (
                        <Cell key={i} fill={getRateColor(entry.completion_rate)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* OYLIK TAB */}
      {activeTab === 'monthly' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {monthLoading ? (
            <Skeleton height={200} />
          ) : (
            <>
              {/* Summary kartalar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  {
                    label: '30 kun jami',
                    value: monthData.reduce((s, d) => s + d.total_tasks, 0),
                    color: 'var(--accent)',
                  },
                  {
                    label: 'Bajarildi',
                    value: monthData.reduce((s, d) => s + d.completed_tasks, 0),
                    color: 'var(--success)',
                  },
                  {
                    label: "O'rtacha",
                    value: `${Math.round(monthData.reduce((s, d) => s + d.completion_rate, 0) / 30)}%`,
                    color: 'var(--warning)',
                  },
                ].map(card => (
                  <div
                    key={card.label}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '14px 12px',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: '1.4rem', fontWeight: 700, color: card.color }}>{card.value}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: 2 }}>{card.label}</p>
                  </div>
                ))}
              </div>

              {/* 30 kunlik heatmap */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '16px',
                }}
              >
                <p style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.9rem' }}>30 kunlik faollik</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4 }}>
                  {monthData.map((day, i) => {
                    const rate = day.completion_rate
                    const opacity = day.total_tasks === 0 ? 0.08 : Math.max(0.15, rate / 100)
                    return (
                      <div
                        key={i}
                        title={`${day.date}: ${rate.toFixed(0)}%`}
                        style={{
                          aspectRatio: '1',
                          borderRadius: 4,
                          background: day.total_tasks === 0 ? 'var(--surface2)' : getRateColor(rate),
                          opacity: day.total_tasks === 0 ? 1 : opacity,
                        }}
                      />
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>Kam</span>
                  {['#EF4444', '#F97316', '#FBBF24', '#16A34A'].map(c => (
                    <div key={c} style={{ width: 14, height: 14, borderRadius: 3, background: c }} />
                  ))}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>Ko&apos;p</span>
                </div>
              </div>

              {/* Oxirgi 14 kun bar chart */}
              <div
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '16px',
                }}
              >
                <p style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.9rem' }}>Oxirgi 14 kun</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart
                    data={monthData.slice(-14)}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={d => formatDayShort(d)}
                      tick={{ fontSize: 10, fill: 'var(--text3)' }}
                      axisLine={false}
                      tickLine={false}
                      interval={1}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: number) => [`${v.toFixed(1)}%`, 'Bajarilish']}
                      labelFormatter={d => d}
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                      }}
                    />
                    <Bar dataKey="completion_rate" radius={[4, 4, 0, 0]}>
                      {monthData.slice(-14).map((entry, i) => (
                        <Cell key={i} fill={getRateColor(entry.completion_rate)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
