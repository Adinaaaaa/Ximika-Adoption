import { fetchActiveCats } from "@/lib/db";
import { CatCard } from "@/components/CatCard";

export const dynamic = "force-dynamic";

export default async function AllCatsPage() {
  const cats = await fetchActiveCats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">All cats</h1>
        <p className="text-muted">
          {cats.length} active listing{cats.length !== 1 ? "s" : ""} across all
          sources.
        </p>
      </div>

      {cats.length === 0 ? (
        <p className="text-muted">No cats loaded yet.</p>
      ) : (
        <div className="grid gap-4">
          {cats.map((cat) => (
            <CatCard key={cat.url} {...cat} showScore={false} />
          ))}
        </div>
      )}
    </div>
  );
}
