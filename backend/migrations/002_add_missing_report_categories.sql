-- Migration: Add missing category enum values to report_category
-- Date: 2026-04-22

ALTER TYPE report_category ADD VALUE IF NOT EXISTS 'DISCRIMINATION';
ALTER TYPE report_category ADD VALUE IF NOT EXISTS 'SAFETY_CONCERN';
ALTER TYPE report_category ADD VALUE IF NOT EXISTS 'CORRUPTION';
ALTER TYPE report_category ADD VALUE IF NOT EXISTS 'ENVIRONMENTAL';
ALTER TYPE report_category ADD VALUE IF NOT EXISTS 'RETALIATION';
