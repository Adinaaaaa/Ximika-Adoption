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

### 5. Deploy to Vercel (no terminal)

1. Open [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import **Adinaaaaa/Ximika-Adoption**.
3. Set **Root Directory** to `apps/web` (Edit → Root Directory → `apps/web`).
4. Under **Environment Variables**, add (copy from your Supabase dashboard or `apps/web/.env.local`):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://qrsytlmopzmwkhpxfuim.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your publishable/anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your secret/service role key |

5. Click **Deploy**. Vercel gives you a URL like `https://ximika-adoption.vercel.app` — bookmark it.

Every push to `main` redeploys automatically. You never need `npm run dev` again unless you are editing code.

#### Troubleshooting Vercel

| What you see | Cause | Fix |
|---|---|---|
| `DEPLOYMENT_NOT_FOUND` on `*.vercel.app` | No successful production deploy is linked to that URL | Vercel → project → **Deployments** → open the latest build. If it failed, fix the error and **Redeploy**. If it succeeded, click **⋯ → Promote to Production**. |
| “Authentication Required” / Vercel login wall | **Deployment Protection** is on (common on new Hobby projects) | Vercel → project → **Settings** → **Deployment Protection** → set **Production** to **None** (or “Only Preview Deployments” if you only want previews locked). Save, then redeploy. |
| Site loads but “No cats loaded yet” | Env vars missing or scrapers haven’t run | Add the three Supabase env vars in Vercel → **Settings** → **Environment Variables**, redeploy, then run **Daily Cat Scrape** in GitHub Actions. |

### 6. Daily auto-refresh (GitHub Actions, no terminal)

So cat listings stay fresh without running scrapers locally:

1. GitHub → **Adinaaaaa/Ximika-Adoption** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
2. Add:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESCUEGROUPS_API_KEY` (optional)

3. **Actions** tab → **Daily Cat Scrape** → **Run workflow** (once, to test).

The workflow in [.github/workflows/scrape.yml](.github/workflows/scrape.yml) runs daily at 8 AM Toronto time after that.

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
