# Cat Adoption Matcher

Repository: [github.com/Adinaaaaa/Ximika-Adoption](https://github.com/Adinaaaaa/Ximika-Adoption)

A personal web app that aggregates adoptable cats from multiple Toronto-area sources, filters them to your ideal profile, and ranks matches with direct profile links.

## Your ideal cat profile

- Quiet, well-socialized, affectionate & cuddly
- Solo-adoptable (no buddy/bonded pairs)
- Not FIV+, no special care needed
- **Not long-haired**
- **Under 6 years old**
- Within ~2 hours drive of Spadina Station (M5S 2M6)

## Sources

| Source | Method |
|---|---|
| Annex Cat Rescue | HTML scrape |
| Toronto Humane Society | HTML scrape |
| Toronto Cat Rescue | Adopt-a-Pet shelter feed (Playwright) |
| Rehome (Adopt-a-Pet) | Private-owner listings near M5S (Playwright) |
| PetPlace | Playwright |
| Adopt-a-Pet | Playwright |
| Petfinder | Playwright |
| RescueGroups.org | Free API (optional bonus data) |

## Quick start

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration in [supabase/migrations/001_initial.sql](supabase/migrations/001_initial.sql) via the SQL editor
3. Copy your project URL, anon key, and service role key

### 2. Environment

```bash
cp .env.example .env.local
# Fill in Supabase keys and optional RESCUEGROUPS_API_KEY
```

For the web app, put env vars in `apps/web/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Install & run locally

```bash
npm install
npm run build -w @cat-matcher/shared
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Run scrapers manually

```bash
cd scrapers
npx playwright install chromium
npm run scrape
```

Or scrape one source:

```bash
npm run scrape:annex
npm run scrape:ths
```

### 5. Deploy to Vercel

```bash
npm i -g vercel
vercel --cwd apps/web
```

Set environment variables in the Vercel dashboard (same as `.env.local`).

### 6. Daily auto-refresh (GitHub Actions)

Add these secrets to your GitHub repo:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESCUEGROUPS_API_KEY` (optional)

The workflow in [.github/workflows/scrape.yml](.github/workflows/scrape.yml) runs daily at 8 AM Toronto time.

## Auto-push to GitHub

This repo includes a **post-commit hook** that pushes to GitHub automatically after every local commit.

Enable it once (already done if you cloned from this repo after setup):

```bash
npm run setup:hooks
```

After that, a normal commit syncs to GitHub:

```bash
git add .
git commit -m "your message"
# → automatically runs git push origin main
```

If push fails (offline, auth), your commit is still saved locally — run `git push` manually when ready.

## Project structure

```
cat-adoption-matcher/
├── apps/web/           Next.js UI (Vercel)
├── packages/shared/    Types, flag detection, match engine
├── scrapers/           Playwright + RescueGroups ingest
├── supabase/           Database migrations
└── .github/workflows/  Daily scrape cron
```

## Match engine

**Hard excludes:** bonded pairs, FIV+, special needs, aggression history, long hair, under 6 years, on hold, too far.

**Ranking bonuses:** quiet, friendly, affectionate, low energy, indoor, adult/senior.

Cats with sparse profile data show a **Partial match** badge and rank lower.

## Optional: RescueGroups API key

Register free at [rescuegroups.org/services/adoptable-pet-data-api](https://rescuegroups.org/services/adoptable-pet-data-api/) for structured temperament fields (`energyLevel`, `vocalLevel`, etc.).
