import Image from "next/image";
import Link from "next/link";

interface CatCardProps {
  name: string;
  source: string;
  shelter_name?: string | null;
  age?: string | null;
  breed?: string | null;
  photo_url?: string | null;
  url: string;
  score?: number;
  reasons?: string[];
  is_partial_match?: boolean;
  showScore?: boolean;
}

export function CatCard({
  name,
  source,
  shelter_name,
  age,
  breed,
  photo_url,
  url,
  score,
  reasons,
  is_partial_match,
  showScore = true,
}: CatCardProps) {
  return (
    <article className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row">
      <div className="relative w-full sm:w-40 h-40 sm:h-auto shrink-0 bg-accent-light">
        {photo_url ? (
          <Image
            src={photo_url}
            alt={name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl">🐱</div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{name}</h2>
            <p className="text-sm text-muted">
              {shelter_name ?? source} · {age ?? "Age unknown"}
            </p>
            {breed && <p className="text-sm text-muted">{breed}</p>}
          </div>
          {showScore && score != null && (
            <span className="bg-accent text-white text-sm font-medium px-2.5 py-1 rounded-full shrink-0">
              {score}
            </span>
          )}
        </div>
        {is_partial_match && (
          <span className="inline-block text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded w-fit">
            Partial match — limited profile info
          </span>
        )}
        {reasons && reasons.length > 0 && (
          <ul className="text-sm text-muted flex flex-wrap gap-1.5">
            {reasons.map((r) => (
              <li
                key={r}
                className="bg-accent-light text-foreground px-2 py-0.5 rounded"
              >
                {r}
              </li>
            ))}
          </ul>
        )}
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline w-fit"
        >
          View profile →
        </Link>
      </div>
    </article>
  );
}
