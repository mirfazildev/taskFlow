// app/api/ai/route.ts — Gemini AI server-side route (API key foydalanuvchiga ko'rinmaydi)

import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import type { AIQuestion } from '@/lib/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

interface WeekStats {
  completionRate: number
  totalTasks: number
  completedTasks: number
}

interface QuestionsBody {
  mode: 'questions'
  missedTasks: string[]
  weekStats: WeekStats
}

interface AdviceBody {
  mode: 'advice'
  questions: AIQuestion[]
  answers: Record<string, string>
  weekStats: WeekStats
}

type RequestBody = QuestionsBody | AdviceBody

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()

    if (body.mode === 'questions') {
      const { missedTasks, weekStats } = body

      const missedList = missedTasks.length > 0
        ? missedTasks.map((t, i) => `${i + 1}. ${t}`).join('\n')
        : "Bajarilmagan vazifalar yo'q"

      const prompt = `Sen shaxsiy rivojlanish trenerisan. Faqat O'zbek tilida javob ber.

Haftalik natija: ${weekStats.completionRate.toFixed(1)}% bajarildi.
Jami vazifalar: ${weekStats.totalTasks}, Bajarildi: ${weekStats.completedTasks}

Bajarilmagan vazifalar:
${missedList}

Ushbu natijalar asosida 3-4 ta aniq, foydali savol ber. Savollar foydalanuvchining rivojlanishiga yordam bersin.
Faqat JSON array formatida javob ber, boshqa hech narsa yozma:
[{"id":"1","question":"...","context":"..."},{"id":"2","question":"...","context":"..."}]`

      const result = await model.generateContent(prompt)
      const text = result.response.text().trim()

      // JSON ni ajratib olish
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error("AI noto'g'ri format qaytardi")
      }

      const questions: AIQuestion[] = JSON.parse(jsonMatch[0])
      return NextResponse.json({ questions })
    }

    if (body.mode === 'advice') {
      const { questions, answers, weekStats } = body

      const qaText = questions.map(q => {
        const answer = answers[q.id] || "Javob berilmadi"
        return `Savol: ${q.question}\nJavob: ${answer}`
      }).join('\n\n')

      const prompt = `Sen shaxsiy rivojlanish murabbiyisan. O'zbek tilida yoz.

Haftalik natija: ${weekStats.completionRate.toFixed(1)}% bajarildi.

Foydalanuvchining savol-javoblari:
${qaText}

Ushbu javoblarni chuqur tahlil qil:
1. Har bir muammo uchun 2-3 ta amaliy, amalga oshirish mumkin bo'lgan yechim taklif qil
2. Kuchli tomonlarini ta'kidla
3. Keyingi hafta uchun aniq maqsadlar bel
4. Motivatsion, quvvat beruvchi xulosa yoz

Markdown formatida yoz (## sarlavhalar, - ro'yxatlar ishlatish mumkin).`

      const result = await model.generateContent(prompt)
      const advice = result.response.text()
      return NextResponse.json({ advice })
    }

    return NextResponse.json({ error: "Noto'g'ri so'rov" }, { status: 400 })
  } catch (error) {
    console.error('AI route xatosi:', error)
    return NextResponse.json(
      { error: "AI xizmati vaqtincha ishlamayapti. Qayta urinib ko'ring." },
      { status: 500 }
    )
  }
}
