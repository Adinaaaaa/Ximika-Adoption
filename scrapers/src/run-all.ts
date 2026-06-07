import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import type { CatSource } from "@cat-matcher/shared";
import { scrapeAnnex } from "./annex";
import { scrapeThs } from "./ths";
import { scrapeTorontoCatRescue } from "./tcr";
import { scrapeRehome } from "./rehome";
import { scrapePetfinder } from "./petfinder";
import { scrapeAdoptapet, scrapePetplace } from "./adoptapet";
import { scrapeRescueGroups } from "./rescuegroups";
import { upsertCats, deactivateStale, logScrapeRun } from "./db";

type ScraperFn = () => Promise<import("@cat-matcher/shared").CatRecord[]>;

const SCRAPERS: Record<CatSource, ScraperFn> = {
  annex: scrapeAnnex,
  ths: scrapeThs,
  tcr: scrapeTorontoCatRescue,
  rehome: scrapeRehome,
  petfinder: scrapePetfinder,
  adoptapet: scrapeAdoptapet,
  petplace: scrapePetplace,
  rescuegroups: scrapeRescueGroups,
};

const DEFAULT_SOURCES: CatSource[] = [
  "annex",
  "ths",
  "tcr",
  "rehome",
  "petplace",
  "adoptapet",
  "petfinder",
  "rescuegroups",
];

async function runSource(source: CatSource): Promise<void> {
  console.log(`\n▶ Scraping ${source}...`);
  const started = Date.now();

  try {
    const cats = await SCRAPERS[source]();
    const upserted = await upsertCats(cats);
    await deactivateStale(
      source,
      cats.map((c) => c.url)
    );
    await logScrapeRun(source, "success", cats.length, upserted);
    console.log(
      `✓ ${source}: ${cats.length} found, ${upserted} saved (${((Date.now() - started) / 1000).toFixed(1)}s)`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ ${source} failed:`, msg);
    await logScrapeRun(source, "error", 0, 0, msg).catch(() => {});
  }
}

async function main() {
  const arg = process.argv.find((a) => a.startsWith("--source="));
  const onlySource = arg?.split("=")[1] as CatSource | undefined;

  const sources: CatSource[] = onlySource ? [onlySource] : DEFAULT_SOURCES;

  console.log("Cat Adoption Matcher — scrape run");
  console.log(`Sources: ${sources.join(", ")}`);

  for (const source of sources) {
    await runSource(source);
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
