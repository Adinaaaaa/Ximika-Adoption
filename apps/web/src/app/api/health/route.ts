import { NextResponse } from "next/server";
import { fetchActiveCats, getConnectionDiagnostics } from "@/lib/db";

export async function GET() {
  const diagnostics = getConnectionDiagnostics();
  const cats = await fetchActiveCats();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  return NextResponse.json({
    ...diagnostics,
    visibleCats: cats.length,
    keyHints: {
      urlSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
      anonSet: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()),
      serviceRoleSet: Boolean(serviceKey),
      serviceRoleLooksCorrect: serviceKey.startsWith("sb_secret_"),
      anonLooksCorrect: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "").startsWith("sb_publishable_"),
    },
    fix:
      cats.length === 0
        ? "Add SUPABASE_SERVICE_ROLE_KEY (starts with sb_secret_) in Vercel → Settings → Environment Variables → Production, then redeploy. Or run migration 004_public_read_policies.sql in Supabase SQL Editor."
        : null,
  });
}
