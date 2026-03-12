'use client'
// app/(auth)/login/page.tsx — Google OAuth kirish sahifasi
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin() {
    setIsLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'var(--bg)',
      }}
    >
      <div
        className="animate-fade-up"
        style={{
          width: '100%',
          maxWidth: '360px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '32px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(79,127,255,0.3)',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 11l3 3L22 4"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '2.5rem',
              color: 'var(--text)',
              lineHeight: 1.1,
              marginBottom: 8,
            }}
          >
            TaskFlow
          </h1>
          <p
            style={{
              color: 'var(--text2)',
              fontSize: '1rem',
              lineHeight: 1.5,
            }}
          >
            Har kunlik vazifalaringizni
            <br />
            rejalashtiring va maqsadlaringizga erishing
          </p>
        </div>

        {/* Xususiyatlar */}
        <div
          style={{
            width: '100%',
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            padding: '20px',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {[
            { icon: '📋', text: "Har kuni vazifalar rejalashtiring" },
            { icon: '📊', text: "O'sishingizni kuzating" },
            { icon: '🤖', text: "AI maslahatchi bilan yaxshilaning" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.25rem' }}>{icon}</span>
              <span style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Google login tugmasi */}
        <button
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            padding: '14px 24px',
            background: isLoading ? 'var(--surface2)' : 'var(--surface)',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--radius)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 500,
            color: 'var(--text)',
            transition: 'all 0.2s',
            boxShadow: 'var(--shadow)',
          }}
          onMouseOver={e => {
            if (!isLoading) (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-md)'
          }}
          onMouseOut={e => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow)'
          }}
        >
          {/* Google icon */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {isLoading ? 'Kirish...' : 'Google bilan kirish'}
        </button>

        <p style={{ color: 'var(--text3)', fontSize: '0.8rem', textAlign: 'center' }}>
          Bepul · Reklama yo&apos;q · Ma&apos;lumotlaringiz xavfsiz
        </p>
      </div>
    </div>
  )
}
