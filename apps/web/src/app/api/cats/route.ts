import { NextResponse } from "next/server";
import { fetchActiveCats, fetchStats } from "@/lib/db";

export async function GET() {
  const [cats, stats] = await Promise.all([fetchActiveCats(), fetchStats()]);
  return NextResponse.json({ cats, stats });
}
