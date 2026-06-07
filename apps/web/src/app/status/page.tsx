import { fetchScrapeRuns } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StatusPage() {
  const runs = await fetchScrapeRuns();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Refresh status</h1>
        <p className="text-muted">
          Scrape runs from the daily GitHub Actions workflow.
        </p>
      </div>

      {runs.length === 0 ? (
        <p className="text-muted">No scrape runs recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
            <thead className="bg-accent-light">
              <tr>
                <th className="text-left p-3">Source</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Found</th>
                <th className="text-left p-3">Saved</th>
                <th className="text-left p-3">Started</th>
                <th className="text-left p-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr key={run.id} className="border-t border-border bg-card">
                  <td className="p-3 font-medium">{run.source}</td>
                  <td className="p-3">
                    <StatusBadge status={run.status} />
                  </td>
                  <td className="p-3">{run.cats_found}</td>
                  <td className="p-3">{run.cats_upserted}</td>
                  <td className="p-3 text-muted">
                    {new Date(run.started_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-red-600 text-xs max-w-xs truncate">
                    {run.error_message ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    partial: "bg-amber-100 text-amber-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] ?? "bg-gray-100"}`}
    >
      {status}
    </span>
  );
}
