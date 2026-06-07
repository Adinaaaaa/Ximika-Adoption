import { matchCats } from "@cat-matcher/shared";
import { fetchActiveCats, fetchPreferences, fetchStats } from "@/lib/db";
import { CatCard } from "@/components/CatCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [cats, prefs, stats] = await Promise.all([
    fetchActiveCats(),
    fetchPreferences(),
    fetchStats(),
  ]);

  const matches = matchCats(cats, prefs);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2">Find your match</h1>
        <p className="text-muted max-w-2xl">
          Quiet, affectionate, solo-adoptable cats under 6 years old within ~2
          hours of
          Spadina Station. Long-haired, cats 6+, FIV+, special-needs, and bonded
          pairs are automatically excluded.
        </p>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Active listings" value={stats.total} />
        <StatBox label="Your matches" value={matches.length} highlight />
        <StatBox
          label="Last refresh"
          value={
            stats.lastRefresh
              ? new Date(stats.lastRefresh).toLocaleDateString()
              : "Never"
          }
        />
        <StatBox label="Sources" value={Object.keys(stats.bySource).length} />
      </section>

      {cats.length === 0 ? (
        <EmptyState />
      ) : matches.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-lg font-medium mb-2">No matches yet</p>
          <p className="text-muted mb-4">
            {cats.length} cats loaded but none pass all your filters. Try
            relaxing settings or wait for the next daily refresh.
          </p>
          <Link href="/settings" className="text-accent hover:underline">
            Adjust preferences →
          </Link>
        </div>
      ) : (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            {matches.length} matching cat{matches.length !== 1 ? "s" : ""}
          </h2>
          <div className="grid gap-4">
            {matches.map((m) => (
              <CatCard
                key={m.cat.url}
                {...m.cat}
                score={m.score}
                reasons={m.reasons}
                is_partial_match={m.is_partial_match}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${highlight ? "border-accent bg-accent-light" : "border-border bg-card"}`}
    >
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
      <p className="text-4xl">🐾</p>
      <p className="text-lg font-medium">No cats loaded yet</p>
      <p className="text-muted max-w-md mx-auto">
        Connect Supabase and run the daily scraper (or trigger it manually via
        GitHub Actions) to populate listings.
      </p>
      <Link href="/status" className="text-accent hover:underline">
        Check scrape status →
      </Link>
    </div>
  );
}
