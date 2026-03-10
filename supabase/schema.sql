-- TaskFlow — Supabase SQL sxemasi
-- Supabase SQL Editor da bu skriptni ishga tushiring

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  reminder_time TEXT DEFAULT '22:00',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#4F7FFF',
  emoji      TEXT NOT NULL DEFAULT 'checkmark',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  priority     SMALLINT CHECK (priority BETWEEN 1 AND 5) DEFAULT 3,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  date         DATE NOT NULL,
  status       TEXT CHECK (status IN ('pending','in_progress','completed','skipped')) DEFAULT 'pending',
  sort_order   INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_stats (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date             DATE NOT NULL,
  total_tasks      INTEGER DEFAULT 0,
  completed_tasks  INTEGER DEFAULT 0,
  completion_rate  NUMERIC(5,2) DEFAULT 0,
  by_category      JSONB DEFAULT '{}',
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE ai_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_start   DATE NOT NULL,
  week_end     DATE NOT NULL,
  questions    JSONB DEFAULT '[]',
  answers      JSONB DEFAULT '{}',
  advice       TEXT,
  status       TEXT CHECK (status IN ('pending','in_progress','completed')) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_date   ON tasks(user_id, date);
CREATE INDEX idx_tasks_category    ON tasks(category_id);
CREATE INDEX idx_stats_user_date   ON daily_stats(user_id, date);
CREATE INDEX idx_ai_user           ON ai_sessions(user_id, created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_profile"      ON profiles    FOR ALL USING (auth.uid() = id);
CREATE POLICY "own_categories"   ON categories  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_tasks"        ON tasks       FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_stats"        ON daily_stats FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_ai_sessions"  ON ai_sessions FOR ALL USING (auth.uid() = user_id);

-- Trigger: vazifa o'zgarganda kunlik statistika avtomatik yangilanadi
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_date    DATE;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_date    := OLD.date;
  ELSE
    v_user_id := NEW.user_id;
    v_date    := NEW.date;
  END IF;

  INSERT INTO daily_stats (user_id, date, total_tasks, completed_tasks, completion_rate, updated_at)
  SELECT
    v_user_id,
    v_date,
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    ROUND(COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / NULLIF(COUNT(*), 0), 2),
    NOW()
  FROM tasks
  WHERE user_id = v_user_id AND date = v_date
  ON CONFLICT (user_id, date) DO UPDATE SET
    total_tasks     = EXCLUDED.total_tasks,
    completed_tasks = EXCLUDED.completed_tasks,
    completion_rate = EXCLUDED.completion_rate,
    updated_at      = NOW();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_task_change
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_daily_stats();

-- Trigger: yangi foydalanuvchi uchun profil + default kategoriya yaratish
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  INSERT INTO categories (user_id, name, color, emoji, is_default)
  VALUES (NEW.id, 'Shaxsiy', '#4F7FFF', 'user', TRUE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
