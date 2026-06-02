ALTER TABLE user_settings
  DROP COLUMN IF EXISTS push_reminder_time,
  DROP COLUMN IF EXISTS push_reminder_timezone,
  DROP COLUMN IF EXISTS push_reminder_last_sent_on;
