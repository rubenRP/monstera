ALTER TABLE user_settings
  ADD COLUMN push_reminder_time TIME NOT NULL DEFAULT '09:00:00',
  ADD COLUMN push_reminder_timezone TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN push_reminder_last_sent_on DATE;
