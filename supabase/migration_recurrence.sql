-- Takrorlanuvchi vazifalar uchun migration

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS recurrence_type TEXT
    CHECK (recurrence_type IN ('none','daily','every_other_day','weekly','weekdays'))
    DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES tasks(id) ON DELETE CASCADE DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_template ON tasks(template_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_template ON tasks(user_id, is_template) WHERE is_template = TRUE;
