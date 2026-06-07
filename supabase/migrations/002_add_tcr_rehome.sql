-- Add Toronto Cat Rescue and Rehome sources (run once in Supabase SQL Editor)

ALTER TYPE cat_source ADD VALUE IF NOT EXISTS 'tcr';
ALTER TYPE cat_source ADD VALUE IF NOT EXISTS 'rehome';
