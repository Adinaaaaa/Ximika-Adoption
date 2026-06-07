import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { CatRecord, CatSource } from "@cat-matcher/shared";
import { applyFlagsToCat } from "@cat-matcher/shared";

export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, key);
}

export async function upsertCats(cats: CatRecord[]): Promise<number> {
  if (cats.length === 0) return 0;

  const supabase = getSupabase();
  const now = new Date().toISOString();

  const rows = cats.map((cat) => {
    const flagged = applyFlagsToCat(cat);
    return {
      ...flagged,
      last_seen_at: now,
      is_active: true,
    };
  });

  const { error } = await supabase.from("cats").upsert(rows, {
    onConflict: "url",
    ignoreDuplicates: false,
  });

  if (error) throw new Error(`upsertCats: ${error.message}`);
  return rows.length;
}

export async function deactivateStale(
  source: CatSource,
  activeUrls: string[]
): Promise<void> {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("cats")
    .select("url")
    .eq("source", source)
    .eq("is_active", true);

  const stale = (existing ?? [])
    .map((r) => r.url)
    .filter((url) => !activeUrls.includes(url));

  if (stale.length === 0) return;

  await supabase
    .from("cats")
    .update({ is_active: false })
    .in("url", stale);
}

export async function logScrapeRun(
  source: CatSource,
  status: "success" | "error" | "partial",
  catsFound: number,
  catsUpserted: number,
  errorMessage?: string
): Promise<void> {
  const supabase = getSupabase();
  await supabase.from("scrape_runs").insert({
    source,
    status,
    cats_found: catsFound,
    cats_upserted: catsUpserted,
    error_message: errorMessage ?? null,
    finished_at: new Date().toISOString(),
  });
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
