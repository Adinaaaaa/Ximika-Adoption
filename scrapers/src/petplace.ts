import { chromium } from "playwright";
import type { CatRecord } from "@cat-matcher/shared";
import { applyFlagsToCat } from "@cat-matcher/shared";
import { sleep } from "./db";

const POSTAL = process.env.SCRAPE_POSTAL_CODE ?? "M5S2M6";

const SEARCH_URLS = [
  `https://www.petplace.com/pet-adoption/search?zipPostal=${POSTAL}&filterAnimalType=Cat&filterBreed=`,
  `https://www.petplace.com/pet-adoption/search?city=Toronto&state=ON&filterAnimalType=Cat&filterBreed=`,
];

export async function scrapePetplace(): Promise<CatRecord[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const cats: CatRecord[] = [];

  try {
    for (const searchUrl of SEARCH_URLS) {
      await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 60000 });
      await sleep(4000);

      const resultCount = await page.evaluate(() => {
        const text = document.body.innerText;
        if (/no results/i.test(text)) return 0;
        return document.querySelectorAll(
          "a[href*='/pet/'], a[href*='pet-adoption'], [class*='pet-card'], [class*='PetCard']"
        ).length;
      });

      if (resultCount === 0) {
        console.warn(`PetPlace: no results for ${searchUrl}`);
        continue;
      }

      const links = await page.$$eval(
        "a[href*='/pet/'], a[href*='pet-adoption/pet']",
        (as) => {
          const seen = new Set<string>();
          return as
            .map((a) => (a as HTMLAnchorElement).href)
            .filter((h) => h.includes("pet") && !seen.has(h) && seen.add(h));
        }
      );

      for (const link of links.slice(0, 40)) {
        try {
          await page.goto(link, { waitUntil: "domcontentloaded", timeout: 30000 });
          await sleep(1200);

          const data = await page.evaluate(() => ({
            name: document.querySelector("h1")?.textContent?.trim() ?? "",
            description: document.body.innerText.slice(0, 4000),
            photo:
              (document.querySelector("img[src*='pet']") as HTMLImageElement)?.src ?? null,
          }));

          if (!data.name) continue;

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
              distance_km: null,
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
