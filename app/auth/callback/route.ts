// app/auth/callback/route.ts — Google OAuth callback + profil yaratish

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Foydalanuvchi ma'lumotlarini olish
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Profil mavjudligini tekshirish
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        // Agar profil yo'q bo'lsa — yaratish
        if (!existingProfile) {
          await supabase.from('profiles').insert({
            id: user.id,
            full_name: user.user_metadata?.full_name ?? null,
            avatar_url: user.user_metadata?.avatar_url ?? null,
            reminder_time: '22:00',
          })

          // Default "Shaxsiy" kategoriya yaratish
          await supabase.from('categories').insert({
            user_id: user.id,
            name: 'Shaxsiy',
            color: '#4F7FFF',
            emoji: 'user',
            is_default: true,
          })
        }
      }

      return NextResponse.redirect(`${origin}/`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
