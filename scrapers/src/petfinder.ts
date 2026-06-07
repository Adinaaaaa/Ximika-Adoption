import { chromium, type Page } from "playwright";
import type { CatRecord } from "@cat-matcher/shared";
import { applyFlagsToCat } from "@cat-matcher/shared";
import { sleep } from "./db";

const SEARCH_URL =
  "https://www.petfinder.com/search/cats-for-adoption/ca/on/toronto/?distance=100&sort=recently_added";

export async function scrapePetfinder(): Promise<CatRecord[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const cats: CatRecord[] = [];

  try {
    await page.goto(SEARCH_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(3000);

    const profileLinks = await collectProfileLinks(page);

    for (const link of profileLinks.slice(0, 80)) {
      try {
        const cat = await scrapeProfile(page, link);
        if (cat) cats.push(cat);
        await sleep(1000);
      } catch (e) {
        console.warn(`Petfinder profile skip ${link}:`, e);
      }
    }
  } finally {
    await browser.close();
  }

  return cats;
}

async function collectProfileLinks(page: Page): Promise<string[]> {
  const links = new Set<string>();

  for (let pageNum = 1; pageNum <= 5; pageNum++) {
    const hrefs = await page.$$eval("a[href*='/cat/']", (as) =>
      as
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((h) => h.includes("petfinder.com/cat/"))
    );

    hrefs.forEach((h) => links.add(h.split("?")[0]));

    const nextBtn = page.locator('a[aria-label="Next page"], button:has-text("Next")').first();
    if (pageNum < 5 && (await nextBtn.isVisible())) {
      await nextBtn.click();
      await sleep(2000);
    } else {
      break;
    }
  }

  return [...links];
}

async function scrapeProfile(page: Page, url: string): Promise<CatRecord | null> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  await sleep(1500);

  const data = await page.evaluate(() => {
    const getText = (sel: string) =>
      document.querySelector(sel)?.textContent?.trim() ?? "";

    const name =
      getText("h1") ||
      getText("[data-test='Pet_Name']") ||
      getText(".pet-name");

    const description =
      getText("[data-test='Pet_Story']") ||
      getText(".pet-story") ||
      getText("[class*='description']");

    const meta = Array.from(document.querySelectorAll("dt, [class*='attribute']"))
      .map((el) => el.textContent?.trim())
      .filter(Boolean)
      .join(" ");

    const photo =
      (document.querySelector("img[src*='cloudfront']") as HTMLImageElement)
        ?.src ?? null;

    const org =
      getText("[data-test='Organization_Name']") ||
      getText("a[href*='/member/']") ||
      "";

    const location =
      getText("[data-test='Organization_Location']") ||
      getText("[class*='location']") ||
      "";

    return { name, description, meta, photo, org, location, body: document.body.innerText };
  });

  if (!data.name) return null;

  const external_id = url.match(/(\d+)\/?$/)?.[1] ?? url;
  const combined = `${data.description} ${data.meta} ${data.body}`;

  const ageMatch = combined.match(/\b(Baby|Young|Adult|Senior|\d+\s+years?)\b/i);
  const sexMatch = combined.match(/\b(Male|Female)\b/);
  const breedMatch = combined.match(/Breed[:\s]+([^\n]+)/i);

  return applyFlagsToCat({
    source: "petfinder",
    external_id,
    name: data.name,
    sex: sexMatch?.[1] ?? null,
    age: ageMatch?.[0] ?? null,
    breed: breedMatch?.[1]?.trim() ?? null,
    url,
    photo_url: data.photo,
    description_text: data.description || combined.slice(0, 3000),
    shelter_name: data.org || null,
    city: data.location.split(",")[0]?.trim() || "Toronto",
    province: "ON",
    distance_km: null,
    requires_buddy: /\bbonded\b/i.test(combined),
    is_bonded_pair: false,
    is_on_hold: false,
    is_adoption_pending: /pending/i.test(combined),
  });
}
