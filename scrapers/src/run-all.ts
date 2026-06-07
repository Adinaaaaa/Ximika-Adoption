import "dotenv/config";
import type { CatSource } from "@cat-matcher/shared";
import { scrapeAnnex } from "./annex";
import { scrapeThs } from "./ths";
import { scrapePetfinder } from "./petfinder";
import { scrapeAdoptapet } from "./adoptapet";
import { scrapePetplace } from "./petplace";
import { scrapeRescueGroups } from "./rescuegroups";
import { upsertCats, deactivateStale, logScrapeRun } from "./db";

type ScraperFn = () => Promise<import("@cat-matcher/shared").CatRecord[]>;

const SCRAPERS: Record<CatSource, ScraperFn> = {
  annex: scrapeAnnex,
  ths: scrapeThs,
  petfinder: scrapePetfinder,
  adoptapet: scrapeAdoptapet,
  petplace: scrapePetplace,
  rescuegroups: scrapeRescueGroups,
};

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

  const sources: CatSource[] = onlySource
    ? [onlySource]
    : ["annex", "ths", "rescuegroups", "petfinder", "adoptapet", "petplace"];

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
