-- Bir kunda bir necha marta takrorlanuvchi vazifalar uchun migration
-- time_slots: [{start_time: "05:00", end_time: "05:30"}, ...]

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS time_slots JSONB DEFAULT NULL;
