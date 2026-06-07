import { createClient } from "@supabase/supabase-js";
import type { CatRecord, UserPreferences } from "@cat-matcher/shared";
import { DEFAULT_PREFERENCES } from "@cat-matcher/shared";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
}

export async function fetchActiveCats(): Promise<CatRecord[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("cats")
    .select("*")
    .eq("is_active", true)
    .order("last_seen_at", { ascending: false });

  if (error) {
    console.error("fetchActiveCats:", error.message);
    return [];
  }

  return (data ?? []) as CatRecord[];
}

export async function fetchPreferences(): Promise<UserPreferences> {
  const supabase = getSupabase();
  if (!supabase) return DEFAULT_PREFERENCES;

  const { data, error } = await supabase
    .from("user_preferences")
    .select("preferences")
    .eq("is_default", true)
    .single();

  if (error || !data) return DEFAULT_PREFERENCES;
  return { ...DEFAULT_PREFERENCES, ...(data.preferences as UserPreferences) };
}

export async function savePreferences(prefs: UserPreferences): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from("user_preferences")
    .update({ preferences: prefs })
    .eq("is_default", true);

  return !error;
}

export async function fetchStats() {
  const supabase = getSupabase();
  if (!supabase) {
    return { total: 0, bySource: {}, lastRefresh: null };
  }

  const { data: cats } = await supabase
    .from("cats")
    .select("source")
    .eq("is_active", true);

  const bySource: Record<string, number> = {};
  for (const c of cats ?? []) {
    bySource[c.source] = (bySource[c.source] ?? 0) + 1;
  }

  const { data: runs } = await supabase
    .from("scrape_runs")
    .select("finished_at")
    .order("finished_at", { ascending: false })
    .limit(1);

  return {
    total: cats?.length ?? 0,
    bySource,
    lastRefresh: runs?.[0]?.finished_at ?? null,
  };
}

export async function fetchScrapeRuns() {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("scrape_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(50);

  return data ?? [];
}

export { getSupabase };
