-- Allow the web app to read cat data with the anon/publishable key.
-- (Service role bypasses RLS; this is needed when only NEXT_PUBLIC_* keys are set on Vercel.)

ALTER TABLE cats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read active cats" ON cats;
CREATE POLICY "Public read active cats" ON cats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read preferences" ON user_preferences;
CREATE POLICY "Public read preferences" ON user_preferences
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read scrape runs" ON scrape_runs;
CREATE POLICY "Public read scrape runs" ON scrape_runs
  FOR SELECT USING (true);
