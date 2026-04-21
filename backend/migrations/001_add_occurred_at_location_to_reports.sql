-- Migration: Add occurred_at and location columns to reports table
-- Date: 2026-04-22

ALTER TABLE reports
    ADD COLUMN IF NOT EXISTS occurred_at DATE,
    ADD COLUMN IF NOT EXISTS location VARCHAR(200);
