-- Enum value must be committed before use (Postgres 55P04); rest in next migration.
ALTER TYPE care_task_type ADD VALUE IF NOT EXISTS 'check_in';
