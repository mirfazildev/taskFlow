// app/api/ai/route.ts — Groq AI server-side route (API key foydalanuvchiga ko'rinmaydi)

import Groq from 'groq-sdk'
import { NextRequest, NextResponse } from 'next/server'
import type { AIQuestion } from '@/lib/types'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const MODEL = 'llama-3.3-70b-versatile'

interface WeekStats {
  completionRate: number
  totalTasks: number
  completedTasks: number
}

interface QuestionsBody {
  mode: 'questions'
  period?: 'daily' | 'weekly' | 'monthly'
  missedTasks: string[]
  weekStats: WeekStats
}

interface AdviceBody {
  mode: 'advice'
  period?: 'daily' | 'weekly' | 'monthly'
  questions: AIQuestion[]
  answers: Record<string, string>
  weekStats: WeekStats
}

type RequestBody = QuestionsBody | AdviceBody

export async function POST(request: NextRequest) {
  // API key tekshiruvi
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY muhit o\'zgaruvchisi topilmadi')
    return NextResponse.json(
      { error: "Server sozlanmagan: GROQ_API_KEY yo'q" },
      { status: 500 }
    )
  }

  try {
    const body: RequestBody = await request.json()

    if (body.mode === 'questions') {
      const { missedTasks, weekStats, period = 'weekly' } = body

      const periodLabel = period === 'daily' ? 'bugungi kun' : period === 'weekly' ? 'bu hafta' : 'bu oy'
      const periodTitle = period === 'daily' ? 'Kunlik tahlil' : period === 'weekly' ? 'Haftalik tahlil' : 'Oylik tahlil'

      const missedList = missedTasks.length > 0
        ? missedTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')
        : "Bajarilmagan vazifalar yo'q"

      const prompt = `Sen shaxsiy rivojlanish trenerisan. Faqat O'zbek tilida javob ber.

${periodTitle} (${periodLabel}): ${weekStats.completionRate.toFixed(1)}% bajarildi.
Jami vazifalar: ${weekStats.totalTasks}, Bajarildi: ${weekStats.completedTasks}

Bajarilmagan vazifalar:
${missedList}

Ushbu ${periodLabel} natijalari asosida 3-4 ta aniq, foydali savol ber. Savollar foydalanuvchining ${periodLabel} rivojlanishiga yordam bersin.
Faqat JSON array formatida javob ber, boshqa hech narsa yozma:
[{"id":"1","question":"...","context":"..."},{"id":"2","question":"...","context":"..."}]`

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: MODEL,
        temperature: 0.7,
      })

      const text = (completion.choices[0]?.message?.content ?? '').trim()

      // JSON ni ajratib olish
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error("AI noto'g'ri format qaytardi")
      }

      let questions: AIQuestion[]
      try {
        questions = JSON.parse(jsonMatch[0])
      } catch {
        throw new Error("AI javobini tahlil qilishda xatolik yuz berdi")
      }
      return NextResponse.json({ questions })
    }

    if (body.mode === 'advice') {
      const { questions, answers, weekStats, period = 'weekly' } = body

      const periodLabel = period === 'daily' ? 'bugungi kun' : period === 'weekly' ? 'bu hafta' : 'bu oy'
      const nextPeriod = period === 'daily' ? 'ertangi kun' : period === 'weekly' ? 'keyingi hafta' : 'keyingi oy'

      const qaText = questions.map(q => {
        const answer = answers[q.id] || "Javob berilmadi"
        return `Savol: ${q.question}\nJavob: ${answer}`
      }).join('\n\n')

      const prompt = `Sen shaxsiy rivojlanish murabbiyisan. O'zbek tilida yoz.

${periodLabel.charAt(0).toUpperCase() + periodLabel.slice(1)} natijasi: ${weekStats.completionRate.toFixed(1)}% bajarildi.
Jami: ${weekStats.totalTasks} ta vazifadan ${weekStats.completedTasks} tasi bajarildi.

Foydalanuvchining ${periodLabel} bo'yicha savol-javoblari:
${qaText}

Ushbu javoblarni chuqur tahlil qil:
1. Har bir muammo uchun 2-3 ta amaliy, amalga oshirish mumkin bo'lgan yechim taklif qil
2. Kuchli tomonlarini ta'kidla
3. ${nextPeriod.charAt(0).toUpperCase() + nextPeriod.slice(1)} uchun aniq maqsadlar bel
4. Motivatsion, quvvat beruvchi xulosa yoz

Markdown formatida yoz (## sarlavhalar, - ro'yxatlar ishlatish mumkin).`

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: MODEL,
        temperature: 0.8,
      })

      const advice = completion.choices[0]?.message?.content ?? ''
      return NextResponse.json({ advice })
    }

    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('AI route xatosi:', message)

    const userMessage = message.includes('API_KEY') || message.includes('401')
      ? "Groq API kaliti noto'g'ri"
      : message.includes('quota') || message.includes('429') || message.includes('rate')
        ? "Groq API limiti tugagan, keyinroq urinib ko'ring"
        : "AI xizmati vaqtincha ishlamayapti. Qayta urinib ko'ring."

    return NextResponse.json({ error: userMessage }, { status: 500 })
  }
}
