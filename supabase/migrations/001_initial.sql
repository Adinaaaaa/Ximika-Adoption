-- Cat Adoption Matcher schema

CREATE TYPE cat_source AS ENUM (
  'petfinder', 'adoptapet', 'annex', 'ths', 'tcr', 'rehome', 'petplace', 'rescuegroups'
);

CREATE TABLE cats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source cat_source NOT NULL,
  external_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sex TEXT,
  age TEXT,
  breed TEXT,
  url TEXT NOT NULL UNIQUE,
  photo_url TEXT,
  description_text TEXT,
  shelter_name TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  distance_km DOUBLE PRECISION,
  energy_level TEXT,
  vocal_level TEXT,
  activity_level TEXT,
  people_reaction TEXT,
  indoor_outdoor TEXT,
  coat_length TEXT,
  requires_buddy BOOLEAN NOT NULL DEFAULT FALSE,
  is_bonded_pair BOOLEAN NOT NULL DEFAULT FALSE,
  is_on_hold BOOLEAN NOT NULL DEFAULT FALSE,
  is_adoption_pending BOOLEAN NOT NULL DEFAULT FALSE,
  is_fiv_positive BOOLEAN NOT NULL DEFAULT FALSE,
  is_special_needs BOOLEAN NOT NULL DEFAULT FALSE,
  has_aggression_flags BOOLEAN NOT NULL DEFAULT FALSE,
  is_long_hair BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cats_source ON cats(source);
CREATE INDEX idx_cats_active ON cats(is_active);
CREATE INDEX idx_cats_last_seen ON cats(last_seen_at DESC);

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  preferences JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scrape_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source cat_source NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  cats_found INTEGER NOT NULL DEFAULT 0,
  cats_upserted INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE INDEX idx_scrape_runs_started ON scrape_runs(started_at DESC);

-- Default preferences for Toronto / Spadina user
INSERT INTO user_preferences (is_default, preferences) VALUES (TRUE, '{
  "postal_code": "M5S2M6",
  "max_distance_km": 130,
  "solo_cat_only": true,
  "exclude_fiv_positive": true,
  "exclude_special_needs": true,
  "exclude_aggression_history": true,
  "exclude_long_hair": true,
  "max_age_years": 6,
  "prefer_quiet": true,
  "prefer_well_socialized": true,
  "prefer_affectionate": true,
  "prefer_single_person_ok": true,
  "prefer_low_energy": true,
  "small_home": true,
  "exclude_on_hold": true
}'::jsonb);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cats_updated_at
  BEFORE UPDATE ON cats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
