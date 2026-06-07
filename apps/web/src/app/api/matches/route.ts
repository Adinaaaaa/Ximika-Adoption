import { NextResponse } from "next/server";
import { matchCats } from "@cat-matcher/shared";
import { fetchActiveCats, fetchPreferences } from "@/lib/db";

export async function GET() {
  const [cats, prefs] = await Promise.all([
    fetchActiveCats(),
    fetchPreferences(),
  ]);

  const matches = matchCats(cats, prefs);

  return NextResponse.json({
    count: matches.length,
    preferences: prefs,
    matches: matches.map((m) => ({
      ...m.cat,
      score: m.score,
      reasons: m.reasons,
      is_partial_match: m.is_partial_match,
    })),
  });
}
