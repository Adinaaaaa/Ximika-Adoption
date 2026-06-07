import { chromium } from "playwright";
import type { CatRecord } from "@cat-matcher/shared";
import { applyFlagsToCat } from "@cat-matcher/shared";
import { sleep } from "./db";

const POSTAL = process.env.SCRAPE_POSTAL_CODE ?? "M5S2M6";
const SEARCH_URL = `https://www.adoptapet.com/pet-search?species=Cat&postal_code=${POSTAL}&radius=100&sort=nearest`;

export async function scrapeAdoptapet(): Promise<CatRecord[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const cats: CatRecord[] = [];

  try {
    await page.goto(SEARCH_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(3000);

    const cards = await page.$$eval(
      "a[href*='/pet/'], a[href*='adoptapet.com']",
      (links) => {
        const seen = new Set<string>();
        return links
          .map((a) => ({
            href: (a as HTMLAnchorElement).href,
            text: a.textContent?.trim() ?? "",
          }))
          .filter((l) => l.href.includes("/pet/") && !seen.has(l.href) && seen.add(l.href));
      }
    );

    for (const card of cards.slice(0, 80)) {
      try {
        await page.goto(card.href, { waitUntil: "domcontentloaded", timeout: 30000 });
        await sleep(1200);

        const data = await page.evaluate(() => {
          const name = document.querySelector("h1")?.textContent?.trim() ?? "";
          const description =
            document.querySelector("[class*='description'], .pet-details")?.textContent?.trim() ??
            document.body.innerText.slice(0, 4000);
          const photo =
            (document.querySelector("img[src*='cloudfront'], img.pet-photo") as HTMLImageElement)
              ?.src ?? null;
          const shelter =
            document.querySelector("[class*='shelter'], a[href*='shelter']")?.textContent?.trim() ??
            "";
          return { name, description, photo, shelter, body: document.body.innerText };
        });

        if (!data.name) continue;

        const external_id = card.href.match(/(\d+)\/?$/)?.[1] ?? card.href;
        const combined = `${data.description} ${data.body}`;

        const ageMatch = combined.match(/\b(Young|Adult|Senior|Kitten|\d+\s+years?\s*old)\b/i);
        const sexMatch = combined.match(/\b(Male|Female)\b/);
        const breedMatch = combined.match(/Breed[:\s]+([^\n]+)/i);

        cats.push(
          applyFlagsToCat({
            source: "adoptapet",
            external_id,
            name: data.name,
            sex: sexMatch?.[1] ?? null,
            age: ageMatch?.[0] ?? null,
            breed: breedMatch?.[1]?.trim() ?? null,
            url: card.href,
            photo_url: data.photo,
            description_text: data.description,
            shelter_name: data.shelter || null,
            city: null,
            province: "ON",
            distance_km: null,
            requires_buddy: /\bbonded\b|must be adopted with/i.test(combined),
            is_bonded_pair: false,
            is_on_hold: false,
            is_adoption_pending: false,
          })
        );
      } catch (e) {
        console.warn(`Adoptapet skip ${card.href}:`, e);
      }
    }
  } finally {
    await browser.close();
  }

  return cats;
}
