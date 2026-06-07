import type { CatRecord } from "@cat-matcher/shared";
import { scrapeAdoptapetListingFetch } from "./adoptapet-fetch";
import { chromium } from "playwright";
import { applyFlagsToCat } from "@cat-matcher/shared";
import { sleep } from "./db";

const POSTAL = process.env.SCRAPE_POSTAL_CODE ?? "M5S2M6";

export async function scrapeAdoptapet(): Promise<CatRecord[]> {
  return scrapeAdoptapetListingFetch(
    "https://www.adoptapet.com/cat-adoption/on/toronto",
    "adoptapet",
    { province: "ON", city: "Toronto" },
    { maxPets: 80, rehomeOnly: false }
  );
}

export async function scrapePetplace(): Promise<CatRecord[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    locale: "en-CA",
  });
  const page = await context.newPage();
  const cats: CatRecord[] = [];

  const searchUrls = [
    `https://www.petplace.com/pet-adoption/search?zipPostal=${POSTAL}&filterAnimalType=Cat&filterBreed=`,
    `https://www.petplace.com/pet-adoption/search?city=Toronto&state=ON&filterAnimalType=Cat`,
  ];

  try {
    for (const searchUrl of searchUrls) {
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
      await sleep(6000);

      const links = await page.$$eval("a[href*='/pet-adoption/']", (as) => {
        const seen = new Set<string>();
        return as
          .map((a) => (a as HTMLAnchorElement).href)
          .filter((h) => {
            if (!h.includes("petplace.com/pet-adoption/")) return false;
            if (h.includes("/search")) return false;
            if (seen.has(h)) return false;
            seen.add(h);
            return true;
          });
      });

      if (links.length === 0) {
        console.warn(`PetPlace: no results for ${searchUrl}`);
        continue;
      }

      for (const link of links.slice(0, 40)) {
        try {
          await page.goto(link, { waitUntil: "domcontentloaded", timeout: 30000 });
          await sleep(1500);

          const data = await page.evaluate(() => ({
            name: document.querySelector("h1")?.textContent?.trim() ?? "",
            description: document.body.innerText.slice(0, 4000),
            photo: (document.querySelector("img[src*='pet'], img[src*='media']") as HTMLImageElement)
              ?.src ?? null,
          }));

          if (!data.name || data.name.length < 2) continue;

          cats.push(
            applyFlagsToCat({
              source: "petplace",
              external_id: link,
              name: data.name,
              url: link,
              photo_url: data.photo,
              description_text: data.description,
              shelter_name: null,
              city: "Toronto",
              province: "ON",
              requires_buddy: false,
              is_bonded_pair: false,
              is_on_hold: false,
              is_adoption_pending: false,
            })
          );
        } catch (e) {
          console.warn(`PetPlace skip ${link}:`, e);
        }
      }

      if (cats.length > 0) break;
    }
  } finally {
    await browser.close();
  }

  return cats;
}
