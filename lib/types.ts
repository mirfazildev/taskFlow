// lib/types.ts — barcha TypeScript interfacelar

export type Priority = 1 | 2 | 3 | 4 | 5
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'
export type RecurrenceType = 'none' | 'daily' | 'every_other_day' | 'weekly' | 'weekdays'

export interface TimeSlot {
  start_time: string  // "HH:MM"
  end_time: string    // "HH:MM"
  label?: string      // ixtiyoriy nom, masalan "Bomdod"
}

export interface Task {
  id: string
  user_id: string
  category_id: string | null
  title: string
  description?: string
  priority: Priority
  start_time: string   // "HH:MM"
  end_time: string     // "HH:MM"
  date: string         // "YYYY-MM-DD"
  status: TaskStatus
  sort_order: number
  completed_at?: string
  created_at: string
  updated_at: string
  categories?: Category // join dan
  // Takrorlanish
  recurrence_type?: RecurrenceType
  recurrence_days?: number[] | null  // 0=Yakshanba, 1=Dushanba ... 6=Shanba
  recurrence_end_date?: string | null
  is_template?: boolean
  template_id?: string | null
  time_slots?: TimeSlot[] | null  // bir kunda bir necha vaqt
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  emoji: string
  is_default: boolean
  created_at: string
}

export interface Profile {
  id: string
  full_name?: string
  avatar_url?: string
  reminder_time: string
  created_at: string
  updated_at: string
}

export interface DailyStats {
  id: string
  user_id: string
  date: string
  total_tasks: number
  completed_tasks: number
  completion_rate: number
  by_category: Record<string, {
    total: number
    completed: number
    name: string
    color: string
    emoji: string
  }>
}

export interface AIQuestion {
  id: string
  question: string
  context: string
}

export interface AISession {
  id: string
  user_id: string
  week_start: string
  week_end: string
  questions: AIQuestion[]
  answers: Record<string, string>
  advice: string
  status: 'pending' | 'in_progress' | 'completed'
  completed_at?: string
  created_at: string
}

// Supabase Database type
export type Database = {
  public: {
    Tables: {
      profiles:    { Row: Profile;    Insert: Partial<Profile>;    Update: Partial<Profile> }
      categories:  { Row: Category;   Insert: Omit<Category, 'id' | 'created_at'>; Update: Partial<Category> }
      tasks:       { Row: Task;       Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Task> }
      daily_stats: { Row: DailyStats; Insert: Partial<DailyStats>; Update: Partial<DailyStats> }
      ai_sessions: { Row: AISession;  Insert: Omit<AISession, 'id' | 'created_at'>; Update: Partial<AISession> }
    }
  }
}
