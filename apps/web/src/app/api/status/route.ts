import { NextResponse } from "next/server";
import { fetchScrapeRuns } from "@/lib/db";

export async function GET() {
  const runs = await fetchScrapeRuns();
  return NextResponse.json({ runs });
}
