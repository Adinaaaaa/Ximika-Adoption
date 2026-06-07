-- Fix reversed age preference: cats under max_age_years, not minimum age
UPDATE user_preferences
SET preferences = (
  preferences - 'min_age_years'
  || jsonb_build_object(
    'max_age_years',
    COALESCE(
      (preferences->>'max_age_years')::int,
      (preferences->>'min_age_years')::int,
      6
    )
  )
),
updated_at = NOW()
WHERE preferences ? 'min_age_years'
   OR NOT (preferences ? 'max_age_years');
