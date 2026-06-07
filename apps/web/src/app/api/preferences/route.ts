import { NextResponse } from "next/server";
import type { UserPreferences } from "@cat-matcher/shared";
import { fetchPreferences, savePreferences } from "@/lib/db";

export async function GET() {
  const prefs = await fetchPreferences();
  return NextResponse.json(prefs);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as UserPreferences;
  const ok = await savePreferences(body);
  if (!ok) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
